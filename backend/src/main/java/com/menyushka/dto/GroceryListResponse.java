package com.menyushka.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroceryListResponse {

    @Builder.Default
    private List<GroceryItemRead> items = new ArrayList<>();

    private Double totalCost;
    private Integer matchedCount;
    private Integer reviewCount;
    private Integer notFoundCount;
}