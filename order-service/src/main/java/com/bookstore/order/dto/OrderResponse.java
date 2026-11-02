package com.bookstore.order.dto;

import com.bookstore.order.enums.OrderStatus;
import com.bookstore.order.enums.PaymentMethod;
import com.bookstore.order.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long orderId,
        Long userId,
        String shippingAddress,
        BigDecimal totalAmount,
        BigDecimal shippingCost,
        String customerName,
        String customerPhone,
        String note,
        OrderStatus orderStatus,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        LocalDateTime createdAt,
        List<OrderItemResponse> items
) {}