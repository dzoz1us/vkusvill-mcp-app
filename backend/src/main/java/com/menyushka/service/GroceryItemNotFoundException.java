package com.menyushka.service;

public class GroceryItemNotFoundException extends RuntimeException {

    public GroceryItemNotFoundException(String message) {
        super(message);
    }
}