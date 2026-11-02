package com.example.catalog.Model;

import com.example.catalog.Dto.BookRequest;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 255)
    private String title;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
    @Column(columnDefinition = "text")
    private String description;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "publisher_id")
    private Publisher publisher;
    @ManyToMany
    @JoinTable(name = "books_authors", joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "author_id"))
    @OrderColumn(name = "author_order")
    private List<Author> authors = new ArrayList<>();
    @Column(name = "cover_url", length = 500)
    private String coverUrl;
    @Column(nullable = false)
    private boolean active = true;
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Version
    private long version;

    @PrePersist void created() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public BigDecimal getPrice() { return price; }
    public String getDescription() { return description; }
    public Category getCategory() { return category; }
    public Publisher getPublisher() { return publisher; }
    public List<Author> getAuthors() {
        if (authors == null) return List.of();
        return authors.stream().filter(Objects::nonNull).toList();
    }
    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void update(BookRequest request, Category category, Publisher publisher, List<Author> authors) {
        this.title = request.title().trim();
        this.price = request.price();
        this.description = request.description();
        this.category = category;
        this.publisher = publisher;
        this.authors.clear();
        this.authors.addAll(authors);
    }
    public void deactivate() { this.active = false; }
}
