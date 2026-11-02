package com.example.ai.Dto;

public record ApiResponse<T>(boolean success, T data) {
    public static <T> ApiResponse<T> success(T data) { return new ApiResponse<>(true, data); }
}
