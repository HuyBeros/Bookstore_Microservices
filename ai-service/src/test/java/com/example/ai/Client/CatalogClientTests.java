package com.example.ai.Client;

import com.example.ai.Dto.CatalogBook;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;

class CatalogClientTests {
    private HttpServer server;
    @AfterEach void stop() { if (server != null) server.stop(0); }

    @Test void readsRealCatalogWireFormatAndDeduplicatesCandidates() throws Exception {
        String book = "{\"id\":1,\"title\":\"Java\",\"price\":100,\"description\":null,"
                + "\"category\":{\"id\":2,\"name\":\"IT\"},\"publisher\":{\"id\":3,\"name\":\"Pub\"},\"authors\":[]}";
        CatalogClient client = client(200, "{\"content\":[" + book + "],\"totalElements\":1}", "[" + book + "]");
        assertThat(client.candidates("Java", List.of(1L))).hasSize(1)
                .first().extracting(CatalogBook::title).isEqualTo("Java");
        assertThat(client.findBooks(List.of(1L))).hasSize(1);
        assertThat(client.findBooks(List.of())).isEmpty();
    }
    @Test void convertsServerErrorsIntoUnavailable() throws Exception {
        CatalogClient client = client(500, "database password must not leak", "");
        assertThatThrownBy(() -> client.candidates("Java", List.of()))
                .isInstanceOf(ResponseStatusException.class).hasMessageNotContaining("password");
        assertThatThrownBy(() -> client.findBooks(List.of(1L))).isInstanceOf(ResponseStatusException.class);
    }

    private CatalogClient client(int status, String search, String batch) throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/catalog/", exchange -> {
            byte[] body = (exchange.getRequestURI().getPath().endsWith("batch") ? batch : search)
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        return new CatalogClient("http://127.0.0.1:" + server.getAddress().getPort());
    }
}
