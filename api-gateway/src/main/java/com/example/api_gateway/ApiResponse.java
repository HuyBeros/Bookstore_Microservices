package com.example.api_gateway;

public record ApiResponse<T>(boolean success, String message, T data) {
    public static ApiResponse<Void> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
