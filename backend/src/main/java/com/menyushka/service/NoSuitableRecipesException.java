package com.menyushka.service;

public class NoSuitableRecipesException extends RuntimeException {

    public NoSuitableRecipesException(String message) {
        super(message);
    }
}