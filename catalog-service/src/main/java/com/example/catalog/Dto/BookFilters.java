package com.example.catalog.Dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Stream;

public record BookFilters(
        @Size(max = 200) String q,
        @Positive Long categoryId, @Positive Long authorId, @Positive Long publisherId,
        @Size(max = 50) List<@NotNull @Positive Long> categoryIds,
        @Size(max = 50) List<@NotNull @Positive Long> authorIds,
        @Size(max = 50) List<@NotNull @Positive Long> publisherIds,
        @DecimalMin("0") BigDecimal minPrice, @DecimalMin("0") BigDecimal maxPrice) {
    public List<Long> categories() { return merge(categoryId, categoryIds); }
    public List<Long> authors() { return merge(authorId, authorIds); }
    public List<Long> publishers() { return merge(publisherId, publisherIds); }
    private static List<Long> merge(Long single, List<Long> multiple) {
        return Stream.concat(single == null ? Stream.empty() : Stream.of(single),
                multiple == null ? Stream.empty() : multiple.stream()).distinct().sorted().toList();
    }
}
