package com.example.ai.Dto;

import java.util.List;

public record AdviceResponse(String answer, List<CatalogBook> books, boolean degraded,
                             List<Source> sources, String retrievalMode, List<String> notices) {
    public record Source(Long bookId, String title, String url) {}
    public AdviceResponse(String answer, List<CatalogBook> books, boolean degraded) {
        this(answer, books, degraded, List.of(), "keyword", List.of());
    }
}
