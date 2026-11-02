package com.example.ai.Provider;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.*;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;

class GeminiEmbeddingProviderTests {
    private HttpServer server;
    private final AtomicReference<String> received = new AtomicReference<>();
    private final AtomicReference<String> key = new AtomicReference<>();
    @AfterEach void stop() { if (server != null) server.stop(0); }
    @Test void sendsRetrievalTaskAndNormalizesQueryVectors() throws Exception {
        var provider = provider(200, "{\"embedding\":{\"values\":[3,4,0]}}");
        assertThat(provider.embed(List.of("tiểu thuyết"), true).getFirst()).containsExactly(.6f, .8f, 0f);
        assertThat(received.get()).contains("RETRIEVAL_QUERY", "outputDimensionality").doesNotContain("fixture-key");
        assertThat(key.get()).isEqualTo("fixture-key");
    }
    @Test void supportsBatchesAndRejectsWrongDimensions() throws Exception {
        var provider = provider(200, "{\"embeddings\":[{\"values\":[1,0,0]},{\"values\":[0,1,0]}]}");
        assertThat(provider.embed(List.of("book one", "book two"), false)).hasSize(2);
        assertThat(received.get()).contains("RETRIEVAL_DOCUMENT", "requests");
    }
    @Test void rejectsMalformedOrZeroVectorsAndRedactsProviderErrors() throws Exception {
        var provider = provider(200, "{\"embedding\":{\"values\":[0,0,0]}}");
        assertThatThrownBy(() -> provider.embed(List.of("book"), true)).hasMessage("Embedding unavailable");
    }
    @Test void rejectsBlockedRequestsWithoutExposingResponse() throws Exception {
        var provider = provider(403, "private provider error fixture-key");
        assertThatThrownBy(() -> provider.embed(List.of("book"), true)).hasMessage("Embedding unavailable").hasNoCause();
    }
    private GeminiEmbeddingProvider provider(int status, String response) throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1beta/models/fixture", exchange -> {
            received.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            key.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            var bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, bytes.length); exchange.getResponseBody().write(bytes); exchange.close();
        });
        server.start();
        return new GeminiEmbeddingProvider(new ObjectMapper(), "http://127.0.0.1:" + server.getAddress().getPort(), "fixture-key", "fixture", 3);
    }
}
