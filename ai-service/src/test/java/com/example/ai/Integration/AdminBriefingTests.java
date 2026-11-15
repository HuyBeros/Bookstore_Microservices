package com.example.ai.Integration;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminBriefingTests {
    private static final String PATH = "/api/ai/admin/briefing";
    private static final List<String> modelRequests = new CopyOnWriteArrayList<>();
    private static final AtomicBoolean stockUnavailable = new AtomicBoolean();
    private static final HttpServer server = startUpstreams();

    @Autowired MockMvc mvc;
    @MockitoBean JwtDecoder decoder;

    @DynamicPropertySource
    static void upstreams(DynamicPropertyRegistry registry) {
        String url = "http://127.0.0.1:" + server.getAddress().getPort();
        for (String key : List.of("order.base-url", "inventory.base-url", "catalog.base-url", "ai.gemini.base-url")) {
            registry.add(key, () -> url);
        }
        registry.add("ai.gemini.api-key", () -> "fixture-key");
        registry.add("ai.gemini.model", () -> "gemini-2.5-flash");
    }

    @BeforeEach void reset() {
        stockUnavailable.set(false);
        modelRequests.clear();
    }

    @AfterAll static void stopUpstreams() {
        server.stop(0);
    }

    @Test void deniesGuestsCustomersAndStaff() throws Exception {
        mvc.perform(post(PATH)).andExpect(status().isUnauthorized());
        for (String role : List.of("ROLE_CUSTOMER", "ROLE_STAFF")) {
            mvc.perform(post(PATH).with(jwt().authorities(new SimpleGrantedAuthority(role))))
                    .andExpect(status().isForbidden());
        }
        assertThat(modelRequests).isEmpty();
    }

    @Test void combinesLiveHttpResultsWithGeminiToolCalls() throws Exception {
        mvc.perform(post(PATH).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pendingOrders").value(3))
                .andExpect(jsonPath("$.data.lowStockCount").value(2))
                .andExpect(jsonPath("$.data.lowStockBooks[0].title").value("Sách A"))
                .andExpect(jsonPath("$.data.lowStockBooks[0].quantity").value(0))
                .andExpect(jsonPath("$.data.priority").value("STOCK"))
                .andExpect(jsonPath("$.data.aiAssisted").value(true));
        assertThat(modelRequests).hasSize(2);
        assertThat(modelRequests.getLast()).contains("functionResponse", "outOfStock")
                .doesNotContain("Bearer", "Sách A");
    }

    @Test void preservesOrdersWhenInventoryIsUnavailable() throws Exception {
        stockUnavailable.set(true);
        mvc.perform(post(PATH).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pendingOrders").value(3))
                .andExpect(jsonPath("$.data.lowStockCount").isEmpty())
                .andExpect(jsonPath("$.data.lowStockBooks").isEmpty())
                .andExpect(jsonPath("$.data.priority").value("ORDERS"))
                .andExpect(jsonPath("$.data.aiAssisted").value(false));
        assertThat(modelRequests).isEmpty();
    }

    private static HttpServer startUpstreams() {
        try {
            var mock = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            mock.createContext("/api/stats/dashboard", exchange -> adminResponse(exchange,
                    "{\"success\":true,\"data\":{\"pending_orders_count\":3,\"totalOrders\":10}}"));
            mock.createContext("/api/inventory/low-stock", exchange -> {
                if (stockUnavailable.get()) respond(exchange, 503, "{}");
                else if (!"threshold=5".equals(exchange.getRequestURI().getQuery())) respond(exchange, 400, "{}");
                else adminResponse(exchange, """
                        {"success":true,"data":[{"bookId":2,"quantity":4},{"bookId":1,"quantity":0}]}
                        """);
            });
            mock.createContext("/api/catalog/books/batch", exchange -> respond(exchange, 200,
                    "[{\"id\":1,\"title\":\"Sách A\"},{\"id\":2,\"title\":\"Sách B\"}]"));
            mock.createContext("/v1beta/models/gemini-2.5-flash:generateContent", exchange -> {
                String request = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                modelRequests.add(request);
                String parts = request.contains("functionResponse") ? "[{\"text\":\"STOCK\"}]" : """
                        [{"functionCall":{"name":"getPendingOrders","args":{}}},
                         {"functionCall":{"name":"getLowStockBooks","args":{}}}]
                        """;
                respond(exchange, 200, """
                        {"candidates":[{"content":{"role":"model","parts":%s},"finishReason":"STOP"}],
                         "modelVersion":"gemini-2.5-flash",
                         "usageMetadata":{"promptTokenCount":20,"candidatesTokenCount":5,"totalTokenCount":25}}
                        """.formatted(parts));
            });
            mock.start();
            return mock;
        } catch (IOException failure) {
            throw new UncheckedIOException(failure);
        }
    }

    private static void adminResponse(HttpExchange exchange, String body) throws IOException {
        if ("Bearer token".equals(exchange.getRequestHeaders().getFirst("Authorization"))) respond(exchange, 200, body);
        else respond(exchange, 401, "{}");
    }

    private static void respond(HttpExchange exchange, int status, String body) throws IOException {
        try (exchange) {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
        }
    }
}
