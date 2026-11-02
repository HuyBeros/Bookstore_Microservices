package com.example.ai.Dto;

import jakarta.validation.constraints.*;

public record PurchaseRequest(
        @NotBlank @Size(max = 150) String eventId,
        @NotBlank @Size(max = 200) String userSubject,
        @NotNull @Positive Long bookId) {
}
