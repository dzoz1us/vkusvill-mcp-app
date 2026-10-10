package com.vkusplan.service;

public class NoSuitableRecipesException extends RuntimeException {

    public NoSuitableRecipesException(String message) {
        super(message);
    }
}