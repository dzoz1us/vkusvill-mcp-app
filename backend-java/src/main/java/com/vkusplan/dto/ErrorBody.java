package com.vkusplan.dto;

import com.vkusplan.enums.ErrorCode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorBody {

    private ErrorCode code;
    private String message;

    @Builder.Default
    private Boolean retryable = false;
}