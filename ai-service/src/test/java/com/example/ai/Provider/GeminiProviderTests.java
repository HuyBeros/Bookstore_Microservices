package com.example.ai.Provider;

import com.example.ai.Dto.AdviceMode;
import com.example.ai.Dto.AdviceRequest;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;

class GeminiProviderTests {
    private final ObjectMapper json = new ObjectMapper();
    private HttpServer server;
    private final AtomicReference<String> received = new AtomicReference<>();
    private final AtomicReference<String> key = new AtomicReference<>();

    @AfterEach void stop() { if (server != null) server.stop(0); }

    @Test void sendsStructuredContextAndParsesResponse() throws Exception {
        String response = envelope("{\"answer\":\"Try Java\",\"bookIds\":[1]}", "STOP");
        GeminiProvider provider = provider(response, 200);
        var result = provider.advise(new AdviceRequest("Java", List.of(), 5), List.of(), List.of(2L),
                AdviceMode.CHAT).toCompletableFuture().join();
        assertThat(result.bookIds()).containsExactly(1L);
        assertThat(result.answer()).isEqualTo("Try Java");
        assertThat(key.get()).isEqualTo("test-key");
        assertThat(json.readTree(received.get()).path("generationConfig").path("responseJsonSchema").isObject()).isTrue();
        assertThat(received.get()).contains("recentBookIds").doesNotContain("test-key");
    }

    @Test void rejectsMalformedModelOutput() throws Exception {
        GeminiProvider provider = provider(envelope("{\"answer\":\"Wrong\",\"bookIds\":[\"abc\"]}", "STOP"), 200);
        assertThatThrownBy(() -> provider.advise(new AdviceRequest("Java", List.of(), 5), List.of(), List.of(),
                AdviceMode.SEARCH).toCompletableFuture().join()).hasRootCauseMessage("Invalid AI response");
    }

    @Test void rejectsBlockedOrTruncatedOutput() throws Exception {
        GeminiProvider provider = provider(envelope("{\"answer\":\"Partial\",\"bookIds\":[]}", "MAX_TOKENS"), 200);
        assertThatThrownBy(() -> provider.advise(new AdviceRequest("Java", List.of(), 5), List.of(), List.of(),
                AdviceMode.SEARCH).toCompletableFuture().join()).hasRootCauseMessage("Invalid AI response");
    }

    @Test void hidesUpstreamErrors() throws Exception {
        GeminiProvider provider = provider("secret upstream error", 429);
        assertThatThrownBy(() -> provider.advise(new AdviceRequest("Java", List.of(), 5), List.of(), List.of(),
                AdviceMode.SEARCH).toCompletableFuture().join()).hasRootCauseMessage("AI response unavailable");
    }

    @Test void missingConfigurationDoesNotCallNetwork() {
        GeminiProvider provider = new GeminiProvider(json, "http://localhost:1", "", "", 1);
        assertThatThrownBy(() -> provider.advise(new AdviceRequest("Java", List.of(), 5), List.of(), List.of(),
                AdviceMode.CHAT).toCompletableFuture().join()).hasRootCauseMessage("AI is not configured");
    }

    private GeminiProvider provider(String response, int status) throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1beta/models/test-model:generateContent", exchange -> {
            received.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            key.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        return new GeminiProvider(json, "http://127.0.0.1:" + server.getAddress().getPort(), "test-key", "test-model", 2);
    }

    private String envelope(String content, String reason) {
        return json.writeValueAsString(Map.of("candidates", List.of(Map.of("finishReason", reason,
                "content", Map.of("parts", List.of(Map.of("text", content)))))));
    }
}
