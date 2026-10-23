package com.vkusplan.service;

public class NoAlternativeRecipeException extends RuntimeException {

    public NoAlternativeRecipeException(String message) {
        super(message);
    }
}