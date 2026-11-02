package com.bookstore.order.dto;

/** Public aggregate only: no customer, payment, address, or revenue information. */
public record BestsellerResponse(Long bookId, Long soldCount) {}
