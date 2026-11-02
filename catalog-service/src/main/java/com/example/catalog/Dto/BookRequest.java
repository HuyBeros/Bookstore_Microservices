package com.example.catalog.Dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record BookRequest(
        @NotBlank @Size(max = 255) String title,
        @NotNull @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal price,
        @Size(max = 10000) String description,
        @NotNull @Positive Long categoryId,
        @NotNull @Positive Long publisherId,
        @NotEmpty @Size(max = 20) List<@NotNull @Positive Long> authorIds,
        @Size(max = 500) String coverUrl) {

    public BookRequest(String title, BigDecimal price, String description, Long categoryId, Long publisherId, List<Long> authorIds) {
        this(title, price, description, categoryId, publisherId, authorIds, null);
    }
}
