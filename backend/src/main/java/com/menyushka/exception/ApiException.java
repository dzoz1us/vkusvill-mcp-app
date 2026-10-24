package com.menyushka.exception;

import org.springframework.http.HttpStatus;

import com.menyushka.enums.ErrorCode;

/** Ожидаемая ошибка API с кодом и HTTP-статусом. */
public class ApiException extends RuntimeException {

    private final ErrorCode code;
    private final HttpStatus status;

    public ApiException(ErrorCode code, HttpStatus status, String message) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public ErrorCode getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static ApiException notFound(String message) {
        return new ApiException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, message);
    }

    public static ApiException badRequest(String message) {
        return new ApiException(ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(ErrorCode.CONFLICT, HttpStatus.CONFLICT, message);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED, message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN, message);
    }
}
