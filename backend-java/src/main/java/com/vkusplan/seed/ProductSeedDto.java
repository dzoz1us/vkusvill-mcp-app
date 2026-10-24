package com.vkusplan.seed;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

/** Товар ВкусВилл для ингредиента (реальные id, цены и ссылки из каталога MCP). */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductSeedDto {

    @JsonProperty("normalized_name")
    private String normalizedName;

    @JsonProperty("xml_id")
    private String xmlId;
    private String name;
    private String url;
    @JsonProperty("package_quantity")
    private Double packageQuantity;

    @JsonProperty("package_unit")
    private String packageUnit;

    /** Цена упаковки; для товаров на вес — цена за 1 кг. */
    private Double price;

    @JsonProperty("sold_by_weight")
    private Boolean soldByWeight;

    @JsonProperty("piece_weight_g")
    private Double pieceWeightG;
}
