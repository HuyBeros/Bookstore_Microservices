package com.example.catalog.Dto;
import java.math.BigDecimal;
import java.util.List;
public record FilterResponse(List<Option> categories, List<Option> authors, List<Option> publishers,
                             BigDecimal minPrice, BigDecimal maxPrice, long total) {
    public record Option(Long id, String name, long count) {}
}
