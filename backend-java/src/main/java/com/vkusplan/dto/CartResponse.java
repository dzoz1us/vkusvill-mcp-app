package com.vkusplan.dto;

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
public class CartResponse {

    @Builder.Default
    private List<CartLink> carts = new ArrayList<>();

    private Boolean priceChanged;
    private Integer unresolvedItems;
}