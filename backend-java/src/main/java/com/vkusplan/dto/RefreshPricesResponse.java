package com.vkusplan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshPricesResponse {

    private String planId;
    private Boolean costChanged;
    private Double newCost;
}