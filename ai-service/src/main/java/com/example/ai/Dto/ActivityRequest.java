package com.example.ai.Dto;

import jakarta.validation.constraints.*;

public record ActivityRequest(@NotNull @Positive Long bookId, @NotNull Activity type) {
    public enum Activity { VIEW, FAVORITE }
}
