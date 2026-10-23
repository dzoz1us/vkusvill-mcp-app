package com.vkusplan.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.vkusplan.dto.ErrorBody;
import com.vkusplan.dto.ErrorResponse;
import com.vkusplan.enums.ErrorCode;
import com.vkusplan.service.MealNotFoundException;
import com.vkusplan.service.NoAlternativeRecipeException;
import com.vkusplan.service.NoSuitableRecipesException;
import com.vkusplan.service.UnknownUnitException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NoSuitableRecipesException.class)
    public ResponseEntity<ErrorResponse> handleNoSuitable(NoSuitableRecipesException e) {
        return build(ErrorCode.NO_SUITABLE_RECIPES, e.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY, false);
    }

    @ExceptionHandler(NoAlternativeRecipeException.class)
    public ResponseEntity<ErrorResponse> handleNoAlternative(NoAlternativeRecipeException e) {
        return build(ErrorCode.NO_SUITABLE_RECIPES, e.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY, false);
    }

    @ExceptionHandler(MealNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleMealNotFound(MealNotFoundException e) {
        return build(ErrorCode.NOT_FOUND, e.getMessage(), HttpStatus.NOT_FOUND, false);
    }

    @ExceptionHandler(UnknownUnitException.class)
    public ResponseEntity<ErrorResponse> handleUnknownUnit(UnknownUnitException e) {
        return build(ErrorCode.VALIDATION_ERROR, e.getMessage(), HttpStatus.BAD_REQUEST, false);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Validation failed");
        return build(ErrorCode.VALIDATION_ERROR, message, HttpStatus.UNPROCESSABLE_ENTITY, false);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException e) {
        return build(ErrorCode.VALIDATION_ERROR, e.getMessage(), HttpStatus.BAD_REQUEST, false);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception e) {
        return build(ErrorCode.INTERNAL_ERROR, "Внутренняя ошибка сервера", HttpStatus.INTERNAL_SERVER_ERROR, false);
    }

    private ResponseEntity<ErrorResponse> build(ErrorCode code, String message, HttpStatus status, boolean retryable) {
        ErrorBody body = ErrorBody.builder()
                .code(code)
                .message(message)
                .retryable(retryable)
                .build();
        return ResponseEntity.status(status).body(new ErrorResponse(body));
    }
}