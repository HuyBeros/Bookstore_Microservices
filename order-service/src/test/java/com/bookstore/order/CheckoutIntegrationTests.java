package com.bookstore.order;

import com.bookstore.order.client.*;
import com.bookstore.order.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckoutIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockBean CatalogClient catalog;
    @MockBean InventoryClient inventory;
    private String customer;
    private String admin;
    @Autowired com.bookstore.order.repository.CartRepository carts;
    @Autowired com.bookstore.order.repository.OrderRepository orders;
    @Autowired com.bookstore.order.repository.PaymentRepository payments;
    @Autowired com.bookstore.order.repository.OrderStatusEventRepository events;
    @BeforeEach void setup() {
        events.deleteAll(); payments.deleteAll(); orders.deleteAll(); carts.deleteAll();
        customer = token(1, "CUSTOMER", "access");
        admin = token(99, "ADMIN", "access");
        when(catalog.getBook(1L)).thenReturn(new BookInfo(1L, "Integration book", new BigDecimal("100000")));
    }
    private void addItem() throws Exception {
        mvc.perform(post("/api/cart/items").param("userId", "2").header("Authorization", "Bearer " + customer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"bookId\":1,\"quantity\":2}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalAmount").value(200000));
    }
    private long place() throws Exception {
        String body = mvc.perform(post("/api/orders").header("Authorization", "Bearer " + customer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"shippingAddress\":\"Hanoi\",\"paymentMethod\":\"COD\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalAmount").value(230000))
                .andExpect(jsonPath("$.data.shippingCost").value(30000)).andReturn().getResponse().getContentAsString();
        return json.readTree(body).path("data").path("orderId").asLong();
    }
    private void change(long id, String next) throws Exception {
        mvc.perform(patch("/api/orders/" + id + "/status").header("Authorization", "Bearer " + admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + next + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.orderStatus").value(next));
    }
    @Test void completesCodFlowAndIsolatesCustomerData() throws Exception {
        addItem();
        mvc.perform(get("/api/cart").header("Authorization", "Bearer " + token(2, "CUSTOMER", "access")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.items").isEmpty());
        long id = place();
        mvc.perform(get("/api/cart").header("Authorization", "Bearer " + customer))
                .andExpect(jsonPath("$.data.items").isEmpty());
        mvc.perform(get("/api/orders/" + id).header("Authorization", "Bearer " + token(2, "CUSTOMER", "access")))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/orders").header("Authorization", "Bearer " + customer)).andExpect(status().isForbidden());
        mvc.perform(patch("/api/orders/" + id + "/status").header("Authorization", "Bearer " + customer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isForbidden());
        change(id, "CONFIRMED");
        change(id, "CONFIRMED");
        verify(inventory, times(1)).deduct(eq(id), anyList());
        change(id, "PREPARING"); change(id, "SHIPPING"); change(id, "DELIVERED");
        mvc.perform(get("/api/orders/" + id).header("Authorization", "Bearer " + customer))
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"));
        mvc.perform(get("/api/orders/" + id + "/status-history").header("Authorization", "Bearer " + customer))
                .andExpect(jsonPath("$.data.length()").value(5));
        mvc.perform(get("/api/stats/overview").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalRevenue").value(230000));
    }
    @Test void restoresConfirmedCancellationAndKeepsCartOnStockFailure() throws Exception {
        addItem(); long id = place(); change(id, "CONFIRMED");
        mvc.perform(post("/api/orders/" + id + "/cancel").header("Authorization", "Bearer " + customer))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.orderStatus").value("CANCELLED"));
        verify(inventory).restore(eq(id), anyList());
        addItem();
        doThrow(new BadRequestException("Not enough stock")).when(inventory).checkStock(1L, 2);
        mvc.perform(post("/api/orders").header("Authorization", "Bearer " + customer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"shippingAddress\":\"Hanoi\",\"paymentMethod\":\"COD\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/cart").header("Authorization", "Bearer " + customer))
                .andExpect(jsonPath("$.data.items.length()").value(1));
    }
    @Test void rejectsRefreshTokensAndUnauthenticatedRequests() throws Exception {
        mvc.perform(get("/api/cart")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/cart").header("Authorization", "Bearer " + token(1, "CUSTOMER", "refresh")))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/payments/callback").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }
    private String token(long userId, String role, String type) {
        byte[] key = java.util.Base64.getDecoder().decode("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
        var encoder = new org.springframework.security.oauth2.jwt.NimbusJwtEncoder(
                new com.nimbusds.jose.jwk.source.ImmutableSecret<>(new javax.crypto.spec.SecretKeySpec(key, "HmacSHA256")));
        var now = java.time.Instant.now();
        var claims = org.springframework.security.oauth2.jwt.JwtClaimsSet.builder()
                .issuer("http://localhost:8081").subject("user-" + userId).audience(java.util.List.of("bookstore"))
                .issuedAt(now).expiresAt(now.plusSeconds(300)).claim("userId", userId)
                .claim("roles", java.util.List.of(role)).claim("type", type)
                .claim("scope", "service".equals(type) ? "inventory.write" : "").build();
        return encoder.encode(org.springframework.security.oauth2.jwt.JwtEncoderParameters.from(
                org.springframework.security.oauth2.jwt.JwsHeader.with(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
