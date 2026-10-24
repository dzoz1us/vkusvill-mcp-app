package com.vkusplan.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vkusplan.config.AppProperties;
import com.vkusplan.domain.GroceryItem;
import com.vkusplan.domain.Ingredient;
import com.vkusplan.domain.MealPlan;
import com.vkusplan.domain.ProductMapping;
import com.vkusplan.enums.ErrorCode;
import com.vkusplan.enums.MatchStatus;
import com.vkusplan.exception.ApiException;
import com.vkusplan.mcp.Matcher;
import com.vkusplan.mcp.McpClient;
import com.vkusplan.mcp.McpException;
import com.vkusplan.mcp.ProductCandidate;
import com.vkusplan.repository.GroceryItemRepository;
import com.vkusplan.repository.ProductMappingRepository;

/** Работа с MCP ВкусВилл: поиск товаров, аналоги, проверка наличия и цен. */
@Service
public class VkusVillService {

    private static final Logger log = LoggerFactory.getLogger(VkusVillService.class);

    /** Итог проверки наличия товаров в плане. */
    public record AvailabilityResult(
            int checked,
            int priceChanged,
            int replaced,
            int unavailable,
            int unchecked
    ) {}

    private final McpClient mcpClient;
    private final GroceryItemRepository groceryRepo;
    private final ProductMappingRepository mappingRepo;
    private final CatalogService catalogService;
    private final MealPlanService mealPlanService;
    private final AppProperties props;

    public VkusVillService(
            McpClient mcpClient,
            GroceryItemRepository groceryRepo,
            ProductMappingRepository mappingRepo,
            CatalogService catalogService,
            MealPlanService mealPlanService,
            AppProperties props
    ) {
        this.mcpClient = mcpClient;
        this.groceryRepo = groceryRepo;
        this.mappingRepo = mappingRepo;
        this.catalogService = catalogService;
        this.mealPlanService = mealPlanService;
        this.props = props;
    }

    // ------------------------------------------------------------------
    // Guards
    // ------------------------------------------------------------------

    public void requireLive() {
        if (!props.isEnableLiveMcp()) {
            throw new ApiException(
                    ErrorCode.VKUSVILL_MCP_UNAVAILABLE,
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Связь с ВкусВилл отключена в настройках сервера"
            );
        }
    }

    private ApiException unavailable(McpException e) {
        return new ApiException(
                ErrorCode.VKUSVILL_MCP_UNAVAILABLE,
                HttpStatus.BAD_GATEWAY,
                "ВкусВилл сейчас не отвечает, попробуйте позже"
        );
    }

    // ------------------------------------------------------------------
    // Search
    // ------------------------------------------------------------------

    public List<ProductCandidate> search(String query) {
        requireLive();
        try {
            return mcpClient.productsSearch(query);
        } catch (McpException e) {
            throw unavailable(e);
        }
    }

    /** Варианты замены товара в списке: аналоги исходного товара или поиск по названию. */
    public List<ProductCandidate> alternativesFor(GroceryItem item) {
        requireLive();
        try {
            List<ProductCandidate> found = new ArrayList<>();
            if (item.getProductXmlId() != null) {
                try {
                    found.addAll(mcpClient.productAnalogs(Integer.parseInt(item.getProductXmlId())));
                } catch (NumberFormatException ignored) {
                    // нечисловой id: ищем по названию
                }
            }
            if (found.size() < 6) {
                String q = item.getIngredient() != null
                        ? Matcher.normalizeIngredientQuery(item.getIngredient().getName())
                        : item.getProductName();
                for (ProductCandidate c : mcpClient.productsSearch(q)) {
                    if (found.stream().noneMatch(f -> Objects.equals(f.getXmlId(), c.getXmlId()))) {
                        found.add(c);
                    }
                }
            }
            return found.stream()
                    .filter(c -> !Objects.equals(c.getXmlId(), item.getProductXmlId()))
                    .filter(c -> c.getPrice() != null && c.getPrice() > 0)
                    .limit(12)
                    .toList();
        } catch (McpException e) {
            throw unavailable(e);
        }
    }

    // ------------------------------------------------------------------
    // Candidate -> purchase
    // ------------------------------------------------------------------

    /** Временное (несохранённое) сопоставление из товара-кандидата — для расчёта упаковок. */
    public ProductMapping mappingFrom(ProductCandidate c, ProductMapping base) {
        return ProductMapping.builder()
                .ingredient(base != null ? base.getIngredient() : null)
                .productXmlId(c.getXmlId())
                .productName(c.getName())
                .productUrl(c.getUrl())
                .packageQuantity(c.isSoldByWeight() ? 100.0 : c.getPackageQuantity())
                .packageUnit(c.isSoldByWeight() ? "g" : c.getPackageUnit())
                .lastPrice(c.getPrice())
                .soldByWeight(c.isSoldByWeight())
                .pieceWeightG(base != null ? base.getPieceWeightG() : null)
                .available(true)
                .matchScore(c.getMatchScore())
                .matchStatus("matched")
                .lastCheckedAt(Instant.now())
                .build();
    }

    // ------------------------------------------------------------------
    // Availability check
    // ------------------------------------------------------------------

    @Transactional
    public AvailabilityResult checkAvailability(MealPlan plan) {
        requireLive();
        int checked = 0, priceChanged = 0, replaced = 0, unavailable = 0, unchecked = 0;

        for (GroceryItem item : groceryRepo.findByMealPlanId(plan.getId())) {
            if (Boolean.TRUE.equals(item.getIsManual()) || item.getProductXmlId() == null) {
                continue;
            }
            int productId;
            try {
                productId = Integer.parseInt(item.getProductXmlId());
            } catch (NumberFormatException e) {
                unchecked++;
                continue;
            }

            Optional<ProductCandidate> details;
            try {
                details = mcpClient.productDetails(productId);
            } catch (McpException e) {
                log.warn("Проверка товара {} не удалась: {}", productId, e.getMessage());
                unchecked++;
                continue;
            }
            checked++;

            ProductMapping mapping = item.getIngredient() == null ? null
                    : mappingRepo.findByIngredientId(item.getIngredient().getId()).orElse(null);
            boolean sameAsMapping = mapping != null
                    && Objects.equals(mapping.getProductXmlId(), item.getProductXmlId());

            if (details.isPresent() && details.get().getPrice() != null && details.get().getPrice() > 0) {
                ProductCandidate c = details.get();
                boolean changed = item.getPricePerPackage() == null
                        || Math.abs(unitPrice(c) - item.getPricePerPackage()) > 0.009;
                if (sameAsMapping) {
                    mapping.setLastPrice(c.getPrice());
                    mapping.setAvailable(true);
                    mapping.setLastCheckedAt(Instant.now());
                    mappingRepo.save(mapping);
                }
                ProductMapping basis = sameAsMapping ? mapping : mappingFrom(c, mapping);
                Optional<CatalogService.Purchase> p = catalogService
                        .purchase(basis, item.getNeededQuantity(), item.getNeededUnit());
                p.ifPresent(x -> mealPlanService.applyPurchase(item, basis, x));
                groceryRepo.save(item);
                if (changed) {
                    priceChanged++;
                }
                continue;
            }

            // товара больше нет: пробуем аналог
            unavailable++;
            if (sameAsMapping) {
                mapping.setAvailable(false);
                mapping.setLastCheckedAt(Instant.now());
                mappingRepo.save(mapping);
            }
            Optional<ProductCandidate> analog = pickAnalog(item, productId);
            if (analog.isPresent()) {
                ProductMapping basis = mappingFrom(analog.get(), mapping);
                Optional<CatalogService.Purchase> p = catalogService
                        .purchase(basis, item.getNeededQuantity(), item.getNeededUnit());
                if (p.isPresent()) {
                    mealPlanService.applyPurchase(item, basis, p.get());
                    groceryRepo.save(item);
                    replaced++;
                    continue;
                }
            }
            item.setMatchStatus(MatchStatus.REQUIRES_REVIEW.getValue());
            groceryRepo.save(item);
        }

        mealPlanService.recomputeTotals(plan);
        return new AvailabilityResult(checked, priceChanged, replaced, unavailable, unchecked);
    }

    private double unitPrice(ProductCandidate c) {
        return c.isSoldByWeight() ? CatalogService.round2(c.getPrice() / 10.0) : c.getPrice();
    }

    private Optional<ProductCandidate> pickAnalog(GroceryItem item, int productId) {
        try {
            String name = item.getIngredient() != null ? item.getIngredient().getName() : item.getProductName();
            return mcpClient.productAnalogs(productId).stream()
                    .filter(c -> c.getPrice() != null && c.getPrice() > 0)
                    .peek(c -> c.setMatchScore(Matcher.scoreCandidate(c, name)))
                    .filter(c -> c.getMatchScore() >= Matcher.MATCH_THRESHOLD)
                    .max(java.util.Comparator.comparingDouble(ProductCandidate::getMatchScore));
        } catch (McpException e) {
            return Optional.empty();
        }
    }

    // ------------------------------------------------------------------
    // Admin: auto-match an ingredient to the best VkusVill product
    // ------------------------------------------------------------------

    @Transactional
    public Optional<ProductMapping> autoMatch(Ingredient ingredient) {
        requireLive();
        String query = Matcher.normalizeIngredientQuery(ingredient.getName());
        List<ProductCandidate> candidates = search(query);
        Matcher.MatchResult result = Matcher.pickBestCandidate(ingredient.getName(), candidates);
        if (result.candidate == null || !"matched".equals(result.status)) {
            return Optional.empty();
        }
        ProductCandidate c = result.candidate;
        ProductMapping pm = mappingRepo.findByIngredientId(ingredient.getId())
                .orElseGet(() -> ProductMapping.builder().ingredient(ingredient).build());
        pm.setProductXmlId(c.getXmlId());
        pm.setProductName(c.getName());
        pm.setProductUrl(c.getUrl());
        pm.setSoldByWeight(c.isSoldByWeight());
        pm.setPackageQuantity(c.isSoldByWeight() ? 100.0 : c.getPackageQuantity());
        pm.setPackageUnit(c.isSoldByWeight() ? "g" : c.getPackageUnit());
        pm.setLastPrice(c.getPrice());
        pm.setAvailable(true);
        pm.setMatchScore(result.score);
        pm.setMatchStatus("matched");
        pm.setLastCheckedAt(Instant.now());
        return Optional.of(mappingRepo.save(pm));
    }
}
