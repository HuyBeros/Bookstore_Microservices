package com.bookstore.order.controller;

import com.bookstore.order.dto.CreatePaymentRequest;
import com.bookstore.order.dto.PaymentCallbackRequest;
import com.bookstore.order.dto.PaymentResponse;
import com.bookstore.order.service.PaymentService;
import jakarta.validation.Valid;
import com.bookstore.order.dto.ApiResponse;
import com.bookstore.order.service.OrderService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.Authentication;
import static com.bookstore.order.config.CurrentUser.id;
import static com.bookstore.order.config.CurrentUser.manager;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;

    @PostMapping("/api/orders/{orderId}/payments")
    public ApiResponse<PaymentResponse> createPayment(@PathVariable Long orderId, @AuthenticationPrincipal Jwt jwt,
                                         @RequestBody(required = false) CreatePaymentRequest req) {
        return ApiResponse.success(paymentService.createPayment(id(jwt), orderId, req == null ? null : req.method()));
    }

    @GetMapping("/api/orders/{orderId}/payments")
    public ApiResponse<List<PaymentResponse>> getPayments(@PathVariable Long orderId, @AuthenticationPrincipal Jwt jwt, Authentication auth) {
        orderService.getOrderForUser(orderId, id(jwt), manager(auth));
        return ApiResponse.success(paymentService.getPayments(orderId));
    }

    /** Giả lập cổng thanh toán báo kết quả. Bản thật phải có chữ ký xác thực. */
    @org.springframework.security.access.prepost.PreAuthorize("denyAll()")
    @PostMapping("/api/payments/callback")
    public ApiResponse<PaymentResponse> callback(@Valid @RequestBody PaymentCallbackRequest req) {
        return ApiResponse.success(paymentService.handleCallback(req));
    }
}