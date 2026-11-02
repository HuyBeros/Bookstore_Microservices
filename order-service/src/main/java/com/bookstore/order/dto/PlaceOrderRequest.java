package com.bookstore.order.dto;

import com.bookstore.order.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlaceOrderRequest(
        @NotBlank(message = "Địa chỉ giao hàng không được để trống")
        String shippingAddress,

        @NotNull(message = "Phương thức thanh toán không được để trống")
        PaymentMethod paymentMethod,
        @jakarta.validation.constraints.Size(max = 200) String customerName,
        @jakarta.validation.constraints.Size(max = 30) String customerPhone,
        @jakarta.validation.constraints.Size(max = 2000) String note
) {}