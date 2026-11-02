package com.example.ai.Service;

import com.example.ai.Client.CatalogClient;
import com.example.ai.Dto.*;
import com.example.ai.Provider.EmbeddingProvider;
import com.example.ai.Repository.VectorRepository;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class RetrievalServiceTests {
    private final CatalogClient catalog = mock(CatalogClient.class);
    private final CatalogIndexService index = mock(CatalogIndexService.class);
    private final EmbeddingProvider embeddings = mock(EmbeddingProvider.class);
    private final VectorRepository vectors = mock(VectorRepository.class);
    private final RetrievalService service = new RetrievalService(catalog, index, embeddings, vectors);
    private CatalogBook book(long id, long price) { return new CatalogBook(id, "Book " + id, BigDecimal.valueOf(price), "", null, null, List.of()); }
    @Test void hydratesSemanticHitsAndAppliesHardPriceConstraints() {
        when(catalog.candidates(anyString(), anyList())).thenReturn(List.of(book(1, 200000)));
        when(catalog.cachedSnapshot()).thenReturn(List.of(book(1, 200000), book(2, 80000)));
        when(index.ready()).thenReturn(true); when(embeddings.model()).thenReturn("fixture"); when(embeddings.dimensions()).thenReturn(3);
        when(index.status()).thenReturn(new CatalogIndexService.Status(true, "READY", 2, "fixture", 3, java.time.Instant.now()));
        float[] query = {1, 0, 0}; when(embeddings.embed(anyList(), eq(true))).thenReturn(List.of(query));
        when(vectors.nearestAllowed(query, "fixture", 3, 40, List.of(2L))).thenReturn(List.of(new VectorRepository.Hit(2, .9), new VectorRepository.Hit(999, .8)));
        when(catalog.findBooks(List.of(2L, 999L))).thenReturn(List.of(book(2, 80000)));
        var result = service.retrieve(new AdviceRequest("Truyện chữa lành dưới 100k", List.of(), 3), List.of());
        assertThat(result.mode()).isEqualTo("hybrid"); assertThat(result.books()).extracting(CatalogBook::id).containsExactly(2L);
    }
    @Test void keepsKeywordResultsWhenEmbeddingIsUnavailable() {
        when(catalog.candidates(anyString(), anyList())).thenReturn(List.of(book(1, 50000)));
        when(catalog.cachedSnapshot()).thenReturn(List.of(book(1, 50000)));
        when(index.ready()).thenReturn(true); when(embeddings.embed(anyList(), eq(true))).thenThrow(new IllegalStateException());
        when(index.status()).thenReturn(new CatalogIndexService.Status(true, "READY", 2, "fixture", 3, java.time.Instant.now()));
        var result = service.retrieve(new AdviceRequest("Sách dưới 100k", List.of(), 3), List.of());
        assertThat(result.mode()).isEqualTo("keyword"); assertThat(result.books()).hasSize(1);
    }
    @Test void constrainedCatalogBackfillPreventsFalseEmptyResults() {
        var novel = new CatalogBook(86L, "Nhà giả kim", BigDecimal.valueOf(63200), "Tiểu thuyết về Santiago",
                new CatalogBook.Reference(1L, "Văn học hiện đại"), null, List.of());
        when(catalog.cachedSnapshot()).thenReturn(List.of(novel));
        when(catalog.candidates(anyString(), anyList())).thenReturn(List.of());
        var result = service.retrieve(new AdviceRequest("Tiểu thuyết dưới 100k", List.of(), 3), List.of());
        assertThat(result.books()).extracting(CatalogBook::id).containsExactly(86L);
    }
}
