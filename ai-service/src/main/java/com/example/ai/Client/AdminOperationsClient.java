package com.example.ai.Client;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class AdminOperationsClient {
    private record OrderStats(@JsonProperty("pending_orders_count") Long pendingOrders) {}
    private record OrderEnvelope(boolean success, OrderStats data) {}
    private record StockEnvelope(boolean success, List<Stock> data) {}

    public record Stock(Long bookId, Integer quantity) {}

    private final RestClient orders;
    private final RestClient inventory;

    public AdminOperationsClient(@Value("${order.base-url}") String orderUrl,
                                 @Value("${inventory.base-url}") String inventoryUrl) {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2)).build());
        factory.setReadTimeout(Duration.ofSeconds(3));
        orders = RestClient.builder().baseUrl(orderUrl).requestFactory(factory).build();
        inventory = RestClient.builder().baseUrl(inventoryUrl).requestFactory(factory).build();
    }

    public Long pendingOrders(String token) {
        try {
            var response = orders.get().uri("/api/stats/dashboard")
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve().body(OrderEnvelope.class);
            if (response != null && response.success() && response.data() != null) {
                Long count = response.data().pendingOrders();
                if (count != null && count >= 0) return count;
            }
        } catch (RestClientException ignored) {
            // An unavailable source is represented by null.
        }
        return null;
    }

    public List<Stock> lowStock(String token, int threshold) {
        try {
            var response = inventory.get().uri("/api/inventory/low-stock?threshold={threshold}", threshold)
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve().body(StockEnvelope.class);
            if (response != null && response.success() && response.data() != null
                    && response.data().stream().allMatch(stock -> stock != null && stock.bookId() != null
                            && stock.bookId() > 0 && stock.quantity() != null && stock.quantity() >= 0)) {
                return response.data();
            }
        } catch (RestClientException ignored) {
            // An unavailable source is represented by null.
        }
        return null;
    }
}
