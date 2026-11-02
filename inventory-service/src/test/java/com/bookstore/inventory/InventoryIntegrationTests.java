package com.bookstore.inventory;

import com.bookstore.inventory.dto.*;
import com.bookstore.inventory.service.InventoryService;
import com.bookstore.inventory.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import java.util.List;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InventoryIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired InventoryService inventory;
    @Autowired InventoryTransactionRepository transactions;
    @Autowired StockRepository stocks;
    @BeforeEach void clear() { transactions.deleteAll(); stocks.deleteAll(); }
    @Test void protectsMutationsAndServesActualAvailability() throws Exception {
        mvc.perform(get("/api/inventory/availability").param("ids", "1,2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].quantity").value(0));
        mvc.perform(post("/api/inventory/import").header("Authorization", "Bearer " + token(1, "CUSTOMER", "access"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"bookId\":1,\"quantity\":10}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/inventory/import").header("Authorization", "Bearer " + token(99, "ADMIN", "access"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"bookId\":1,\"quantity\":10}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.quantity").value(10));
        mvc.perform(post("/api/inventory/orders/10/deduct").header("Authorization", "Bearer " + token(99, "ADMIN", "access"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"items\":[{\"bookId\":1,\"quantity\":2}]}"))
                .andExpect(status().isForbidden());
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/inventory/orders/10/deduct").header("Authorization", "Bearer " + token(0, "SERVICE", "service"))
                    .contentType(MediaType.APPLICATION_JSON).content("{\"items\":[{\"bookId\":1,\"quantity\":10}]}"))
                    .andExpect(status().isNoContent());
        }
        assertThat(inventory.getStock(1L).quantity()).isZero();
        for (int i = 0; i < 2; i++) inventory.restore(10L);
        assertThat(inventory.getStock(1L).quantity()).isEqualTo(10);
    }
    @Test void rollsBackEveryLineWhenAnyBookHasInsufficientStock() {
        inventory.importStock(new ImportRequest(1L, 5, "test"));
        assertThatThrownBy(() -> inventory.deduct(20L, List.of(new StockItemRequest(1L, 2), new StockItemRequest(2L, 1))))
                .isInstanceOf(com.bookstore.inventory.exception.BadRequestException.class);
        assertThat(inventory.getStock(1L).quantity()).isEqualTo(5);
    }
    @Test void concurrentDuplicateDeductionAndRestoreApplyOnce() throws Exception {
        inventory.importStock(new ImportRequest(1L, 10, "test"));
        try (var pool = Executors.newFixedThreadPool(2)) {
            var gate = new CountDownLatch(1);
            Callable<Void> deduct = () -> { gate.await(); inventory.deduct(30L, List.of(new StockItemRequest(1L, 10))); return null; };
            var first = pool.submit(deduct); var second = pool.submit(deduct); gate.countDown();
            first.get(15, TimeUnit.SECONDS); second.get(15, TimeUnit.SECONDS);
            assertThat(inventory.getStock(1L).quantity()).isZero();
            var a = pool.submit(() -> inventory.restore(30L)); var b = pool.submit(() -> inventory.restore(30L));
            a.get(15, TimeUnit.SECONDS); b.get(15, TimeUnit.SECONDS);
            assertThat(inventory.getStock(1L).quantity()).isEqualTo(10);
        }
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
