package com.example.catalog.Controller;
import com.example.catalog.Dto.*;
import com.example.catalog.Service.BookFilterService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/catalog/filters")
public class BookFilterController {
    private final BookFilterService service;
    public BookFilterController(BookFilterService service) { this.service = service; }
    @GetMapping
    public ApiResponse<FilterResponse> get(@Valid @ModelAttribute
            @org.springdoc.core.annotations.ParameterObject BookFilters filters) {
        return ApiResponse.success(service.get(filters));
    }
}
