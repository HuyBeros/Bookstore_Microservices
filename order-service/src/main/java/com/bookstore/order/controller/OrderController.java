package com.bookstore.order.controller;

import com.bookstore.order.dto.*;
import com.bookstore.order.enums.OrderStatus;
import com.bookstore.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.Authentication;
import static com.bookstore.order.config.CurrentUser.id;
import static com.bookstore.order.config.CurrentUser.manager;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ApiResponse<OrderResponse> placeOrder(@AuthenticationPrincipal Jwt jwt,
                                    @Valid @RequestBody PlaceOrderRequest req) {
        return ApiResponse.success(orderService.placeOrder(id(jwt), req));
    }

    @GetMapping("/my")
    public ApiResponse<List<OrderResponse>> myOrders(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(orderService.getMyOrders(id(jwt)));
    }

    @GetMapping
    public ApiResponse<List<OrderResponse>> allOrders(@RequestParam(required = false) OrderStatus status) {
        return ApiResponse.success(orderService.getAllOrders(status));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getOrder(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt, Authentication auth) {
        return ApiResponse.success(orderService.getOrderForUser(id, id(jwt), manager(auth)));
    }

    @GetMapping("/{id}/status-history")
    public ApiResponse<List<OrderStatusResponse>> history(@PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt, Authentication auth) {
        return ApiResponse.success(orderService.getHistory(id, id(jwt), manager(auth)));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<OrderResponse> updateStatus(@PathVariable Long id,
                                      @Valid @RequestBody UpdateStatusRequest req) {
        return ApiResponse.success(orderService.updateStatus(id, req.status()));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<OrderResponse> cancel(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(orderService.cancelByCustomer(id(jwt), id));
    }
}