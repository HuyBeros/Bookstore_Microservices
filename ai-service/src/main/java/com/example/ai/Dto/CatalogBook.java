package com.example.ai.Dto;

import java.math.BigDecimal;
import java.util.List;

public record CatalogBook(Long id, String title, BigDecimal price, String description,
                          Reference category, Reference publisher, List<Reference> authors,
                          String coverUrl, Integer stock) {
    public CatalogBook(Long id, String title, BigDecimal price, String description,
                       Reference category, Reference publisher, List<Reference> authors) {
        this(id, title, price, description, category, publisher, authors, null, null);
    }
    public CatalogBook withStock(Integer quantity) {
        return new CatalogBook(id, title, price, description, category, publisher, authors, coverUrl, quantity);
    }
    public record Reference(Long id, String name) {}
}
