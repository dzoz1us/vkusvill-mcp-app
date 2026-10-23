package com.vkusplan.mcp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCandidate {

    private Integer productId;
    private String xmlId;
    private String name;

    private Double price;

    /** Net weight/volume per package, in canonical unit (g / ml / pcs). */
    private Double packageQuantity;
    private String packageUnit;

    private String url;

    /** Filled by scorer. */
    private double matchScore;
}