package com.vkusplan.service;

public class GroceryItemNotFoundException extends RuntimeException {

    public GroceryItemNotFoundException(String message) {
        super(message);
    }
}