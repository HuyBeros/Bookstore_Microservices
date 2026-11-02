package com.example.catalog.Controller;

import com.example.catalog.Dto.MetadataRequest;
import com.example.catalog.Dto.MetadataResponse;
import com.example.catalog.Dto.PageResponse;
import com.example.catalog.Service.PublisherService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/catalog/publishers")
public class PublisherController {
    private final PublisherService service;

    public PublisherController(PublisherService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<MetadataResponse> list(
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    public MetadataResponse get(@PathVariable @Positive long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<MetadataResponse> create(@Valid @RequestBody MetadataRequest request) {
        MetadataResponse result = service.create(request);
        return ResponseEntity.created(URI.create("/api/catalog/publishers/" + result.id())).body(result);
    }

    @PutMapping("/{id}")
    public MetadataResponse update(@PathVariable @Positive long id, @Valid @RequestBody MetadataRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
