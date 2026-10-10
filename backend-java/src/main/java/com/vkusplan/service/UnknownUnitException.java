package com.vkusplan.service;

public class UnknownUnitException extends RuntimeException {

    public UnknownUnitException(String unit) {
        super("Unknown unit: " + unit);
    }
}