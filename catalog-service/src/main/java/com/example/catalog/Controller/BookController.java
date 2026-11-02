package com.example.catalog.Controller;

import com.example.catalog.Dto.BookRequest;
import com.example.catalog.Dto.BookResponse;
import com.example.catalog.Dto.PageResponse;
import com.example.catalog.Service.BookService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/catalog")
public class BookController {
    private final BookService service;
    public BookController(BookService service) { this.service = service; }

    @GetMapping({"/books", "/search"})
    public PageResponse<BookResponse> search(
            @Valid @ModelAttribute @org.springdoc.core.annotations.ParameterObject com.example.catalog.Dto.BookFilters filters,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "newest") String sort) {
        return service.searchFiltered(filters.q(), filters.categories(), filters.authors(), filters.publishers(),
                filters.minPrice(), filters.maxPrice(), page, size, sort);
    }

    @GetMapping("/books/batch")
    public List<BookResponse> batch(@RequestParam @Size(min = 1, max = 50) List<@Positive Long> ids) {
        return service.batch(ids);
    }
    @GetMapping("/books/{id}")
    public BookResponse get(@PathVariable @Positive long id) { return service.get(id); }
    @PostMapping("/books")
    public ResponseEntity<BookResponse> create(@Valid @RequestBody BookRequest request) {
        BookResponse result = service.create(request);
        return ResponseEntity.created(URI.create("/api/catalog/books/" + result.id())).body(result);
    }
    @PutMapping("/books/{id}")
    public BookResponse update(@PathVariable @Positive long id, @Valid @RequestBody BookRequest request) {
        return service.update(id, request);
    }
    @DeleteMapping("/books/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
