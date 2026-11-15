package com.example.ai.Dto;

import java.time.Instant;
import java.util.List;

public record AdminBriefing(Instant checkedAt, Long pendingOrders, Integer lowStockCount,
                            int stockThreshold, List<StockAlert> lowStockBooks,
                            Priority priority, boolean aiAssisted) {
    public enum Priority { ORDERS, STOCK, NONE }

    public record StockAlert(Long bookId, String title, int quantity) {}
}
