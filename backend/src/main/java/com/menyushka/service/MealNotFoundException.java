package com.menyushka.service;

public class MealNotFoundException extends RuntimeException {

    public MealNotFoundException(String message) {
        super(message);
    }
}