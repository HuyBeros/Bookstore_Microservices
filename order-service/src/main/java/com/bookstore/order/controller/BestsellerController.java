package com.bookstore.order.controller;

import com.bookstore.order.dto.ApiResponse;
import com.bookstore.order.dto.BestsellerResponse;
import com.bookstore.order.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class BestsellerController {
    private final StatisticsService statistics;

    @GetMapping("/api/orders/bestsellers")
    public ApiResponse<List<BestsellerResponse>> list(
            @RequestParam(defaultValue = "12") int limit) {
        if (limit < 1 || limit > 24) throw new com.bookstore.order.exception.BadRequestException("limit phải từ 1 đến 24");
        return ApiResponse.success(statistics.bestsellers(limit));
    }
}
