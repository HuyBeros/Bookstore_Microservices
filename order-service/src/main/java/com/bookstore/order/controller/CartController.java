package com.bookstore.order.controller;

import com.bookstore.order.dto.*;
import com.bookstore.order.service.CartService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import static com.bookstore.order.config.CurrentUser.id;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ApiResponse<CartResponse> getCart(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(cartService.getCart(id(jwt)));
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addItem(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CartItemRequest req) {
        return ApiResponse.success(cartService.addItem(id(jwt), req));
    }

    @PutMapping("/items/{bookId}")
    public ApiResponse<CartResponse> updateQuantity(@AuthenticationPrincipal Jwt jwt, @PathVariable Long bookId,
                                       @Valid @RequestBody UpdateQuantityRequest req) {
        return ApiResponse.success(cartService.updateQuantity(id(jwt), bookId, req.quantity()));
    }

    @DeleteMapping("/items/{bookId}")
    public ApiResponse<CartResponse> removeItem(@AuthenticationPrincipal Jwt jwt, @PathVariable Long bookId) {
        return ApiResponse.success(cartService.removeItem(id(jwt), bookId));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal Jwt jwt) {
        cartService.clearCart(id(jwt));
        return ResponseEntity.noContent().build();
    }
}