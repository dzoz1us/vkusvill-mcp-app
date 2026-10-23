package com.vkusplan.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeListResponse {

    private List<RecipeShort> items;
    private Integer total;
    private Integer limit;
    private Integer offset;
}