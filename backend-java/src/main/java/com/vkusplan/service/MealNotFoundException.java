package com.vkusplan.service;

public class MealNotFoundException extends RuntimeException {

    public MealNotFoundException(String message) {
        super(message);
    }
}