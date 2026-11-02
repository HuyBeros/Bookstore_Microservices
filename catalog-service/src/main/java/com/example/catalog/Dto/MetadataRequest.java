package com.example.catalog.Dto;

import jakarta.validation.constraints.*;

public record MetadataRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 10000) String description,
        @Size(max = 10000) String bio) {
}
