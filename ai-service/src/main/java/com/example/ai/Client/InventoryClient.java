package com.example.ai.Client;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class InventoryClient {
    private record Stock(Long bookId, Integer quantity) {}
    private record Envelope(Boolean success, List<Stock> data) {}
    private final RestClient client;
    public InventoryClient(@Value("${inventory.base-url:http://localhost:8084}") String baseUrl) {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build());
        factory.setReadTimeout(Duration.ofSeconds(2));
        client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }
    public Map<Long, Integer> quantities(List<Long> ids) {
        if (ids.isEmpty()) return Map.of();
        try {
            var result = client.get().uri(b -> b.path("/api/inventory/availability")
                    .queryParam("ids", String.join(",", ids.stream().map(String::valueOf).toList())).build())
                    .retrieve().body(Envelope.class);
            if (result == null || !Boolean.TRUE.equals(result.success()) || result.data() == null) return Map.of();
            var stocks = new HashMap<Long, Integer>();
            result.data().stream().filter(s -> s.bookId() != null && s.quantity() != null && s.quantity() >= 0)
                    .forEach(s -> stocks.put(s.bookId(), s.quantity()));
            return Map.copyOf(stocks);
        } catch (RuntimeException error) {
            // Unknown stock is not zero; never turn an outage into a false availability claim.
            return Map.of();
        }
    }
}
