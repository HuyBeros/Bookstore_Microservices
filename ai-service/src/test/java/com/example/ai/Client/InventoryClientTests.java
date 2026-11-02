package com.example.ai.Client;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.*;
import static org.assertj.core.api.Assertions.*;

class InventoryClientTests {
    private HttpServer server;
    @AfterEach void stop() { if (server != null) server.stop(0); }
    @Test void readsEnvelopeWithoutInventingZeroForMissingBooks() throws Exception {
        var client = client(200, "{\"success\":true,\"data\":[{\"bookId\":1,\"quantity\":0},{\"bookId\":2,\"quantity\":3}]}");
        assertThat(client.quantities(List.of(1L, 2L, 3L))).containsEntry(1L, 0).containsEntry(2L, 3).doesNotContainKey(3L);
    }
    @Test void outageReturnsUnknownNotOutOfStock() throws Exception {
        var client = client(503, "private database error");
        assertThat(client.quantities(List.of(1L))).isEmpty();
    }
    private InventoryClient client(int status, String response) throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/inventory/availability", exchange -> {
            var bytes = response.getBytes(StandardCharsets.UTF_8); exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length); exchange.getResponseBody().write(bytes); exchange.close();
        });
        server.start(); return new InventoryClient("http://127.0.0.1:" + server.getAddress().getPort());
    }
}
