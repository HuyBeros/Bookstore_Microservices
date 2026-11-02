package com.bookstore.order.controller;
import com.bookstore.order.dto.ApiResponse;
import com.bookstore.order.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatisticsController {
    private final StatisticsService statistics;
    @GetMapping({"/overview", "/dashboard"})
    public ApiResponse<Map<String, Object>> overview() { return ApiResponse.success(statistics.overview()); }
}
