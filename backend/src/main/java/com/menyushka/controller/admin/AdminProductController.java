package com.menyushka.controller.admin;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.menyushka.domain.Ingredient;
import com.menyushka.domain.ProductMapping;
import com.menyushka.dto.AdminDtos.IngredientUpsert;
import com.menyushka.dto.AdminDtos.ProductMappingRead;
import com.menyushka.dto.AdminDtos.ProductMappingUpsert;
import com.menyushka.dto.AdminDtos.SyncResult;
import com.menyushka.dto.GroceryDtos.ProductOption;
import com.menyushka.exception.ApiException;
import com.menyushka.mcp.McpClient;
import com.menyushka.mcp.McpException;
import com.menyushka.mcp.ProductCandidate;
import com.menyushka.repository.IngredientRepository;
import com.menyushka.repository.ProductMappingRepository;
import com.menyushka.service.QuantityService;
import com.menyushka.service.VkusVillService;

import jakarta.validation.Valid;

/** Администратор: ингредиенты, товары ВкусВилл и сопоставления «ингредиент → товар». */
@RestController
@RequestMapping("/api/admin")
public class AdminProductController {

    private final IngredientRepository ingredients;
    private final ProductMappingRepository mappings;
    private final VkusVillService vkusVillService;
    private final McpClient mcpClient;
    private final QuantityService quantityService;

    public AdminProductController(
            IngredientRepository ingredients,
            ProductMappingRepository mappings,
            VkusVillService vkusVillService,
            McpClient mcpClient,
            QuantityService quantityService
    ) {
        this.ingredients = ingredients;
        this.mappings = mappings;
        this.vkusVillService = vkusVillService;
        this.mcpClient = mcpClient;
        this.quantityService = quantityService;
    }

    // ------------------------------------------------------------------
    // Ingredients
    // ------------------------------------------------------------------

    @PostMapping("/ingredients")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ProductMappingRead createIngredient(@Valid @RequestBody IngredientUpsert request) {
        String normalized = request.name().trim().toLowerCase();
        if (ingredients.findByNormalizedName(normalized).isPresent()) {
            throw ApiException.conflict("Такой ингредиент уже есть");
        }
        Ingredient saved = ingredients.save(Ingredient.builder()
                .name(request.name().trim())
                .normalizedName(normalized)
                .defaultUnit(canonicalUnit(request.defaultUnit()))
                .category(request.category())
                .build());
        return toRead(saved, null);
    }

    @PutMapping("/ingredients/{id}")
    @Transactional
    public ProductMappingRead updateIngredient(@PathVariable Integer id, @Valid @RequestBody IngredientUpsert request) {
        Ingredient ing = requireIngredient(id);
        ing.setName(request.name().trim());
        ing.setDefaultUnit(canonicalUnit(request.defaultUnit()));
        ing.setCategory(request.category());
        ingredients.save(ing);
        return toRead(ing, mappings.findByIngredientId(id).orElse(null));
    }

    @DeleteMapping("/ingredients/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteIngredient(@PathVariable Integer id) {
        Ingredient ing = requireIngredient(id);
        if (ingredients.countUsages(id) > 0) {
            throw ApiException.conflict("Ингредиент используется в рецептах — удалить нельзя");
        }
        mappings.findByIngredientId(id).ifPresent(mappings::delete);
        ingredients.delete(ing);
    }

    // ------------------------------------------------------------------
    // Product mappings
    // ------------------------------------------------------------------

    @GetMapping("/products")
    @Transactional(readOnly = true)
    public List<ProductMappingRead> products() {
        return ingredients.findAll().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(i -> toRead(i, mappings.findByIngredientId(i.getId()).orElse(null)))
                .toList();
    }

    @PutMapping("/products/{ingredientId}")
    @Transactional
    public ProductMappingRead setMapping(
            @PathVariable Integer ingredientId,
            @Valid @RequestBody ProductMappingUpsert request
    ) {
        Ingredient ing = requireIngredient(ingredientId);
        boolean byWeight = Boolean.TRUE.equals(request.soldByWeight());
        if (!byWeight && (request.packageQuantity() == null || request.packageUnit() == null)) {
            throw ApiException.badRequest("Укажите размер упаковки и единицу (g, ml или pcs)");
        }

        ProductMapping pm = mappings.findByIngredientId(ingredientId)
                .orElseGet(() -> ProductMapping.builder().ingredient(ing).build());
        pm.setProductXmlId(request.productXmlId().trim());
        pm.setProductName(request.productName().trim());
        pm.setProductUrl(request.productUrl());
        pm.setSoldByWeight(byWeight);
        pm.setPackageQuantity(byWeight ? 100.0 : request.packageQuantity());
        pm.setPackageUnit(byWeight ? "g" : canonicalUnit(request.packageUnit()));
        pm.setLastPrice(request.price());
        pm.setPieceWeightG(request.pieceWeightG());
        pm.setAvailable(request.available() == null || request.available());
        pm.setMatchScore(10.0);
        pm.setMatchStatus("matched");
        pm.setLastCheckedAt(Instant.now());
        return toRead(ing, mappings.save(pm));
    }

    @DeleteMapping("/products/{ingredientId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void removeMapping(@PathVariable Integer ingredientId) {
        mappings.findByIngredientId(ingredientId).ifPresent(mappings::delete);
    }

    /** Поиск товаров во ВкусВилл — чтобы выбрать товар для сопоставления. */
    @GetMapping("/products/search")
    public List<ProductOption> search(@RequestParam String q) {
        return vkusVillService.search(q).stream().map(ProductOption::of).toList();
    }

    /** Автоматически подбирает лучший товар для ингредиента. */
    @PostMapping("/products/{ingredientId}/auto-match")
    @Transactional
    public ProductMappingRead autoMatch(@PathVariable Integer ingredientId) {
        Ingredient ing = requireIngredient(ingredientId);
        Optional<ProductMapping> pm = vkusVillService.autoMatch(ing);
        return toRead(ing, pm.orElseThrow(() ->
                ApiException.notFound("Подходящего товара во ВкусВилл не нашлось — выберите вручную")));
    }

    /** Обновляет цены и наличие всех сопоставленных товаров. */
    @PostMapping("/products/sync")
    @Transactional
    public SyncResult sync() {
        vkusVillService.requireLive();
        int checked = 0, updated = 0, unavailable = 0, failed = 0;
        for (ProductMapping m : mappings.findAll()) {
            int id;
            try {
                id = Integer.parseInt(m.getProductXmlId());
            } catch (NumberFormatException e) {
                failed++;
                continue;
            }
            try {
                Optional<ProductCandidate> d = mcpClient.productDetails(id);
                checked++;
                if (d.isPresent() && d.get().getPrice() != null && d.get().getPrice() > 0) {
                    if (m.getLastPrice() == null || Math.abs(m.getLastPrice() - d.get().getPrice()) > 0.009
                            || !Boolean.TRUE.equals(m.getAvailable())) {
                        updated++;
                    }
                    m.setLastPrice(d.get().getPrice());
                    m.setAvailable(true);
                } else {
                    m.setAvailable(false);
                    unavailable++;
                }
                m.setLastCheckedAt(Instant.now());
                mappings.save(m);
            } catch (McpException e) {
                failed++;
            }
        }
        return new SyncResult(checked, updated, unavailable, failed);
    }

    // ------------------------------------------------------------------

    private Ingredient requireIngredient(Integer id) {
        return ingredients.findById(id).orElseThrow(() -> ApiException.notFound("Ингредиент не найден"));
    }

    private String canonicalUnit(String unit) {
        try {
            return quantityService.toCanonical(1, unit).unit().getValue();
        } catch (RuntimeException e) {
            throw ApiException.badRequest("Единица измерения: g, ml или pcs");
        }
    }

    private ProductMappingRead toRead(Ingredient i, ProductMapping m) {
        return new ProductMappingRead(
                String.valueOf(i.getId()),
                i.getName(),
                i.getCategory(),
                i.getDefaultUnit(),
                m != null,
                m == null ? null : m.getProductXmlId(),
                m == null ? null : m.getProductName(),
                m == null ? null : m.getProductUrl(),
                m == null ? null : m.getPackageQuantity(),
                m == null ? null : m.getPackageUnit(),
                m == null ? null : m.getLastPrice(),
                m == null ? null : m.getSoldByWeight(),
                m == null ? null : m.getPieceWeightG(),
                m == null ? null : m.getAvailable(),
                m == null ? null : m.getLastCheckedAt()
        );
    }
}
