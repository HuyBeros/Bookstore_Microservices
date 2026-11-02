package com.bookstore.inventory.controller;

import com.bookstore.inventory.dto.*;
import com.bookstore.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@org.springframework.validation.annotation.Validated
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/availability")
    public ApiResponse<List<StockResponse>> availability(
            @RequestParam @jakarta.validation.constraints.Size(min = 1, max = 100)
            List<@jakarta.validation.constraints.Positive Long> ids) {
        return ApiResponse.success(inventoryService.getAvailability(ids));
    }

    @GetMapping
    public ApiResponse<List<StockResponse>> getAll() {
        return ApiResponse.success(inventoryService.getAll());
    }

    @GetMapping("/{bookId}")
    public ApiResponse<StockResponse> getStock(@PathVariable Long bookId) {
        return ApiResponse.success(inventoryService.getStock(bookId));
    }

    @GetMapping("/low-stock")
    public ApiResponse<List<StockResponse>> lowStock(@RequestParam(defaultValue = "5") int threshold) {
        return ApiResponse.success(inventoryService.getLowStock(threshold));
    }

    @GetMapping("/transactions")
    public ApiResponse<List<TransactionResponse>> transactions(@RequestParam(required = false) Long bookId) {
        return ApiResponse.success(inventoryService.getTransactions(bookId));
    }

    @PostMapping("/import")
    public ApiResponse<StockResponse> importStock(@Valid @RequestBody ImportRequest req) {
        return ApiResponse.success(inventoryService.importStock(req));
    }

    @PostMapping("/adjust")
    public ApiResponse<StockResponse> adjust(@Valid @RequestBody AdjustRequest req) {
        return ApiResponse.success(inventoryService.adjust(req));
    }

    @PostMapping("/orders/{orderId}/deduct")
    public ResponseEntity<Void> deduct(@PathVariable Long orderId, @Valid @RequestBody DeductRequest req) {
        inventoryService.deduct(orderId, req.items());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/orders/{orderId}/restore")
    public ResponseEntity<Void> restore(@PathVariable Long orderId) {
        inventoryService.restore(orderId);
        return ResponseEntity.noContent().build();
    }
}