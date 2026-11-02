package com.example.catalog.Dto;

import com.example.catalog.Model.Book;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record BookResponse(Long id, String title, BigDecimal price, String description,
                           Reference category, Reference publisher, List<Reference> authors,
                           String coverUrl,
                           Instant createdAt, Instant updatedAt) {
    public record Reference(Long id, String name) {}
    public static BookResponse from(Book book) {
        return new BookResponse(book.getId(), book.getTitle(), book.getPrice(), book.getDescription(),
                new Reference(book.getCategory().getId(), book.getCategory().getName()),
                new Reference(book.getPublisher().getId(), book.getPublisher().getName()),
                book.getAuthors().stream().map(a -> new Reference(a.getId(), a.getName())).toList(),
                book.getCoverUrl(),
                book.getCreatedAt(), book.getUpdatedAt());
    }
}
