package com.menyushka.dto;

import com.menyushka.mcp.ProductCandidate;

import jakarta.validation.constraints.NotBlank;

/** Запросы и ответы для редактирования списка покупок. */
public final class GroceryDtos {

    private GroceryDtos() {}

    /** Вариант замены товара. */
    public record ProductOption(
            String xmlId,
            String name,
            String url,
            Double price,
            Double packageQuantity,
            String packageUnit,
            boolean soldByWeight
    ) {
        public static ProductOption of(ProductCandidate c) {
            return new ProductOption(
                    c.getXmlId(), c.getName(), c.getUrl(), c.getPrice(),
                    c.getPackageQuantity(), c.getPackageUnit(), c.isSoldByWeight());
        }
    }

    public record ReplaceProductRequest(
            @NotBlank String xmlId,
            @NotBlank String name,
            String url,
            Double price,
            Double packageQuantity,
            String packageUnit,
            Boolean soldByWeight
    ) {
        public ProductCandidate toCandidate() {
            return ProductCandidate.builder()
                    .xmlId(xmlId)
                    .name(name)
                    .url(url)
                    .price(price)
                    .packageQuantity(packageQuantity)
                    .packageUnit(packageUnit)
                    .soldByWeight(Boolean.TRUE.equals(soldByWeight))
                    .build();
        }
    }

    public record AvailabilityResponse(
            int checked,
            int priceChanged,
            int replaced,
            int unavailable,
            int unchecked,
            double cartEstimatedCost,
            int unresolvedItems
    ) {}
}
