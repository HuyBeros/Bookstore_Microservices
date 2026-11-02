package com.example.ai.Dto;

import java.util.List;

public record BookPage(List<CatalogBook> content, Integer totalPages, Long totalElements) {
}
