package com.example.ai.Client;

import com.example.ai.Dto.BookPage;
import com.example.ai.Dto.CatalogBook;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CatalogClient {
    private static final int MAX_CANDIDATES = 30;
    private static final Set<String> STOP_WORDS = Set.of("tu", "van", "cho", "toi", "minh", "ban", "giup", "tim", "goi", "muon", "can", "sach", "cuon", "quyen", "ngan", "duoi", "tren", "dong", "khong", "qua", "khoang", "den", "gia", "tam", "trieu", "nghin", "ve", "mot", "nhung", "cac", "recommend", "please", "book", "books", "looking");
    private final RestClient client;
    private record Snapshot(List<CatalogBook> books, long expiresAt) {}
    private volatile Snapshot cached;

    public CatalogClient(@Value("${catalog.base-url}") String baseUrl) {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2)).build());
        factory.setReadTimeout(Duration.ofSeconds(2));
        client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    public List<CatalogBook> candidates(String message, List<Long> recentIds) {
        var candidates = new LinkedHashMap<Long, CatalogBook>();
        // Bound both outgoing calls and the context sent to the model.
        add(candidates, search(message.substring(0, Math.min(message.length(), 200)), null, 10));
        if (candidates.size() < 10) {
            var keywords = Arrays.stream(message.split("[^\\p{L}\\p{N}]+"))
                    .filter(word -> word.length() >= 3 && Character.isLetter(word.charAt(0)))
                    .filter(word -> !STOP_WORDS.contains(com.example.ai.Util.BookText.normalize(word))).distinct().limit(3).toList();
            for (String keyword : keywords) {
                add(candidates, search(keyword, null, 5));
            }
        }
        if (!recentIds.isEmpty()) {
            List<CatalogBook> recent = findBooks(recentIds.stream().distinct().limit(20).toList());
            add(candidates, recent);
            recent.stream().filter(book -> book.category() != null).map(book -> book.category().id())
                    .distinct().limit(2).forEach(id -> add(candidates, search("", id, 5)));
        }
        if (candidates.isEmpty()) add(candidates, search("", null, MAX_CANDIDATES));
        return candidates.values().stream().limit(MAX_CANDIDATES).toList();
    }

    public List<CatalogBook> findBooks(List<Long> ids) {
        if (ids.isEmpty()) return List.of();
        try {
            CatalogBook[] books = client.get().uri(builder -> builder.path("/api/catalog/books/batch")
                    .queryParam("ids", ids.stream().map(String::valueOf).collect(Collectors.joining(","))).build())
                    .retrieve().body(CatalogBook[].class);
            if (books == null) throw unavailable();
            return List.of(books);
        } catch (RestClientException error) { throw unavailable(); }
    }

    public List<CatalogBook> snapshot() {
        var books = new LinkedHashMap<Long, CatalogBook>();
        try {
            for (int page = 0; page < 100; page++) {
                int current = page;
                var result = client.get().uri(b -> b.path("/api/catalog/books").queryParam("page", current)
                        .queryParam("size", 100).queryParam("sort", "title").build()).retrieve().body(BookPage.class);
                if (result == null || result.content() == null || result.totalPages() == null) throw unavailable();
                result.content().forEach(book -> books.put(book.id(), book));
                if (page + 1 >= result.totalPages()) {
                    var complete = List.copyOf(books.values());
                    cached = new Snapshot(complete, System.currentTimeMillis() + 60000);
                    return complete;
                }
            }
            throw unavailable(); // A partial snapshot must never remove documents from the index.
        } catch (RestClientException error) { throw unavailable(); }
    }

    public synchronized List<CatalogBook> cachedSnapshot() {
        var current = cached;
        if (current != null && current.expiresAt() > System.currentTimeMillis()) return current.books();
        return snapshot();
    }

    private List<CatalogBook> search(String query, Long categoryId, int size) {
        try {
            BookPage page = client.get().uri(builder -> {
                builder.path("/api/catalog/search").queryParam("q", query).queryParam("size", size);
                if (categoryId != null) builder.queryParam("categoryId", categoryId);
                return builder.build();
            }).retrieve().body(BookPage.class);
            if (page == null || page.content() == null) throw unavailable();
            return page.content();
        } catch (RestClientException error) { throw unavailable(); }
    }

    private static void add(Map<Long, CatalogBook> target, List<CatalogBook> books) {
        books.forEach(book -> { if (target.size() < MAX_CANDIDATES) target.putIfAbsent(book.id(), book); });
    }

    private static ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Không thể truy cập danh mục sách, vui lòng thử lại.");
    }
}
