package com.menyushka.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.menyushka.dto.GroceryDtos.ProductOption;
import com.menyushka.dto.GroceryDtos.ReplaceProductRequest;
import com.menyushka.dto.GroceryItemRead;
import com.menyushka.dto.GroceryItemUpdate;
import com.menyushka.dto.GroceryListResponse;
import com.menyushka.dto.ManualGroceryItemCreate;
import com.menyushka.mapper.GroceryItemMapper;
import com.menyushka.security.CurrentUser;
import com.menyushka.service.GroceryListService;

import jakarta.validation.Valid;

/** Список покупок: просмотр, правка количества, удаление, замена товара. */
@RestController
public class GroceryController {

    private final GroceryListService groceryListService;
    private final GroceryItemMapper groceryItemMapper;

    public GroceryController(GroceryListService groceryListService, GroceryItemMapper groceryItemMapper) {
        this.groceryListService = groceryListService;
        this.groceryItemMapper = groceryItemMapper;
    }

    @GetMapping("/api/meal-plans/{planId}/grocery-list")
    public GroceryListResponse getGroceryList(@PathVariable Integer planId) {
        return groceryListService.getList(planId, CurrentUser.id());
    }

    @PatchMapping("/api/grocery-items/{itemId}")
    @Transactional
    public GroceryItemRead updateGroceryItem(
            @PathVariable Integer itemId,
            @RequestBody GroceryItemUpdate update
    ) {
        return groceryItemMapper.toRead(groceryListService.update(itemId, CurrentUser.id(), update));
    }

    @DeleteMapping("/api/grocery-items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGroceryItem(@PathVariable Integer itemId) {
        groceryListService.delete(itemId, CurrentUser.id());
    }

    @PostMapping("/api/meal-plans/{planId}/grocery-items")
    @Transactional
    public GroceryItemRead addManualItem(
            @PathVariable Integer planId,
            @Valid @RequestBody ManualGroceryItemCreate request
    ) {
        return groceryItemMapper.toRead(groceryListService.addManual(planId, CurrentUser.id(), request));
    }

    @GetMapping("/api/grocery-items/{itemId}/alternatives")
    public List<ProductOption> alternatives(@PathVariable Integer itemId) {
        return groceryListService.alternatives(itemId, CurrentUser.id());
    }

    @PostMapping("/api/grocery-items/{itemId}/replace-product")
    @Transactional
    public GroceryItemRead replaceProduct(
            @PathVariable Integer itemId,
            @Valid @RequestBody ReplaceProductRequest request
    ) {
        return groceryItemMapper.toRead(groceryListService.replaceProduct(itemId, CurrentUser.id(), request));
    }
}
