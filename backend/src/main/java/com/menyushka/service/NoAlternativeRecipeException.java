package com.menyushka.service;

public class NoAlternativeRecipeException extends RuntimeException {

    public NoAlternativeRecipeException(String message) {
        super(message);
    }
}