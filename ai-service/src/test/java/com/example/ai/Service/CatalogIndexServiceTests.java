package com.example.ai.Service;

import com.example.ai.Client.CatalogClient;
import com.example.ai.Dto.CatalogBook;
import com.example.ai.Provider.EmbeddingProvider;
import com.example.ai.Repository.VectorRepository;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class CatalogIndexServiceTests {
    private final CatalogClient catalog = mock(CatalogClient.class);
    private final EmbeddingProvider embeddings = mock(EmbeddingProvider.class);
    private final VectorRepository vectors = mock(VectorRepository.class);
    private final CatalogBook book = new CatalogBook(1L, "Book", BigDecimal.TEN, "<p>Public description</p>", null, null, List.of());
    private CatalogIndexService service() {
        when(embeddings.model()).thenReturn("fixture"); when(embeddings.dimensions()).thenReturn(3);
        return new CatalogIndexService(catalog, embeddings, vectors, true);
    }
    @Test void indexesChangedContentButDoesNotEmbedPrice() {
        var service = service(); when(catalog.snapshot()).thenReturn(List.of(book));
        when(embeddings.embed(anyList(), eq(false))).thenReturn(List.of(new float[]{1, 0, 0}));
        service.refresh();
        assertThat(service.status().state()).isEqualTo("READY");
        assertThat(CatalogIndexService.document(book)).contains("Public description").doesNotContain("<p>", "price", "10");
        verify(vectors).upsert(anyList(), eq("fixture"), eq(3));
        verify(vectors).removeMissing(Set.of(1L), "fixture", 3);
    }
    @Test void keepsExistingIndexOnProviderOrPartialCatalogFailure() {
        var service = service(); when(catalog.snapshot()).thenReturn(List.of(book));
        when(vectors.hashes("fixture", 3)).thenReturn(Map.of(2L, "previous"));
        when(embeddings.embed(anyList(), anyBoolean())).thenThrow(new IllegalStateException("private upstream error"));
        service.refresh();
        assertThat(service.status().state()).isEqualTo("UNAVAILABLE");
        assertThat(service.ready()).isTrue();
        verify(vectors, never()).removeMissing(anySet(), anyString(), anyInt());
        verify(vectors, never()).upsert(anyList(), anyString(), anyInt());
    }
}
