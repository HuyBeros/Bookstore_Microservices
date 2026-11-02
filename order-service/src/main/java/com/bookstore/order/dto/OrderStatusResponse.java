package com.bookstore.order.dto;
import com.bookstore.order.enums.OrderStatus;
import java.time.LocalDateTime;
public record OrderStatusResponse(OrderStatus status, LocalDateTime createdAt) {}
