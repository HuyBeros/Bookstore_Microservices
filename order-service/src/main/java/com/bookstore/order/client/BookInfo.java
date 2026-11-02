package com.bookstore.order.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BookInfo(Long id, String title, BigDecimal price, String coverUrl) {
    public BookInfo(Long id, String title, BigDecimal price) {
        this(id, title, price, null);
    }
}
