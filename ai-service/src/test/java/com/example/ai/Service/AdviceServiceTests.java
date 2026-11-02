package com.example.ai.Service;

import com.example.ai.Client.CatalogClient;
import com.example.ai.Dto.AdviceMode;
import com.example.ai.Dto.AdviceRequest;
import com.example.ai.Dto.AiAnswer;
import com.example.ai.Dto.CatalogBook;
import com.example.ai.Provider.AiProvider;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdviceServiceTests {
    private final CatalogClient catalog = mock(CatalogClient.class);
    private final AiProvider provider = mock(AiProvider.class);
    private final HistoryService history = mock(HistoryService.class);
    private final RetrievalService retrieval = mock(RetrievalService.class);
    private final com.example.ai.Client.InventoryClient inventory = mock(com.example.ai.Client.InventoryClient.class);
    private final AdviceService service = new AdviceService(catalog, provider, history, retrieval, inventory);
    private final CatalogBook book = new CatalogBook(1L, "Java", new BigDecimal("100"), "Programming",
            new CatalogBook.Reference(2L, "Technology"), new CatalogBook.Reference(3L, "Publisher"), List.of());

    @Test void filtersHallucinatedIdsAndReturnsCurrentCatalogData() {
        when(history.recentBookIds("alice")).thenReturn(List.of());
        when(retrieval.retrieve(any(), any())).thenReturn(new RetrievalService.Result(List.of(book), "keyword"));
        when(provider.advise(any(), any(), any(), any())).thenReturn(CompletableFuture.completedFuture(
                new AiAnswer("Read Java", List.of(999L, 1L, 1L))));
        when(catalog.findBooks(List.of(1L))).thenReturn(List.of(book));
        var response = service.advise("alice", new AdviceRequest("java", List.of(), 5), AdviceMode.CHAT)
                .toCompletableFuture().join();
        assertThat(response.books()).containsExactly(book);
        assertThat(response.degraded()).isTrue();
    }

    @Test void returnsExplicitFallbackWhenProviderFails() {
        when(history.recentBookIds("alice")).thenReturn(List.of());
        when(retrieval.retrieve(any(), any())).thenReturn(new RetrievalService.Result(List.of(book), "keyword"));
        when(provider.advise(any(), any(), any(), any())).thenReturn(CompletableFuture.failedFuture(
                new IllegalStateException("provider unavailable")));
        when(catalog.findBooks(List.of(1L))).thenReturn(List.of(book));
        var response = service.advise("alice", new AdviceRequest("java", List.of(), 5), AdviceMode.SEARCH)
                .toCompletableFuture().join();
        assertThat(response.degraded()).isTrue();
        assertThat(response.books()).containsExactly(book);
        assertThat(response.answer()).doesNotContain("provider unavailable");
    }

    @Test void skipsProviderWhenCatalogIsEmpty() {
        when(history.recentBookIds("alice")).thenReturn(List.of());
        when(retrieval.retrieve(any(), any())).thenReturn(new RetrievalService.Result(List.of(), "keyword"));
        var response = service.advise("alice", new AdviceRequest("nothing", List.of(), 5), AdviceMode.CHAT)
                .toCompletableFuture().join();
        assertThat(response.books()).isEmpty();
        verifyNoInteractions(provider);
    }

    @Test void omitsBookRemovedDuringGenerationAndUsesPersonalHistory() {
        when(history.recentBookIds("alice")).thenReturn(List.of(7L));
        when(retrieval.retrieve(any(), any())).thenReturn(new RetrievalService.Result(List.of(book), "keyword"));
        when(provider.advise(any(), any(), any(), any())).thenReturn(CompletableFuture.completedFuture(
                new AiAnswer("Read Java", List.of(1L))));
        when(catalog.findBooks(List.of(1L))).thenReturn(List.of());
        var request = new AdviceRequest("java", List.of(), 5);
        var response = service.advise("alice", request, AdviceMode.RECOMMENDATIONS).toCompletableFuture().join();
        assertThat(response.books()).isEmpty();
        verify(provider).advise(request, List.of(book), List.of(7L), AdviceMode.RECOMMENDATIONS);
    }

    @Test void propagatesCatalogOutageWithoutInventingRecommendations() {
        when(history.recentBookIds("alice")).thenReturn(List.of());
        when(retrieval.retrieve(any(), any())).thenThrow(new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE));
        assertThatThrownBy(() -> service.advise("alice", new AdviceRequest("java", List.of(), 5),
                AdviceMode.CHAT)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        verifyNoInteractions(provider);
    }

    @Test void refreshesPriceAndTreatsMissingStockAsUnknown() {
        when(history.recentBookIds("alice")).thenReturn(List.of());
        when(retrieval.retrieve(any(), any())).thenReturn(new RetrievalService.Result(List.of(book), "hybrid"));
        when(provider.advise(any(), any(), any(), any())).thenReturn(CompletableFuture.completedFuture(new AiAnswer("Read Java", List.of(1L))));
        var updated = new CatalogBook(1L, "Java", new BigDecimal("80"), "Programming", book.category(), book.publisher(), List.of());
        when(catalog.findBooks(List.of(1L))).thenReturn(List.of(updated));
        var response = service.advise("alice", new AdviceRequest("java", List.of(), 3), AdviceMode.CHAT).toCompletableFuture().join();
        assertThat(response.books().getFirst().price()).isEqualByComparingTo("80");
        assertThat(response.books().getFirst().stock()).isNull();
        assertThat(response.sources().getFirst().url()).isEqualTo("/books/1");
        assertThat(response.notices()).anyMatch(note -> note.contains("Chưa xác minh"));
    }

    @Test void excludesBooksThatBecomeSoldOutAfterGeneration() {
        when(history.recentBookIds("alice")).thenReturn(List.of());
        when(retrieval.retrieve(any(), any())).thenReturn(new RetrievalService.Result(List.of(book), "hybrid"));
        when(provider.advise(any(), any(), any(), any())).thenReturn(CompletableFuture.completedFuture(new AiAnswer("Read Java", List.of(1L))));
        when(catalog.findBooks(List.of(1L))).thenReturn(List.of(book));
        when(inventory.quantities(List.of(1L))).thenReturn(java.util.Map.of(1L, 1), java.util.Map.of(1L, 0));
        var response = service.advise("alice", new AdviceRequest("java", List.of(), 3), AdviceMode.CHAT).toCompletableFuture().join();
        assertThat(response.books()).isEmpty(); assertThat(response.degraded()).isTrue();
        assertThat(response.answer()).doesNotContain("Read Java");
    }

    @Test void internalBookReferencesNeverAppearInTheCustomerAnswer() {
        when(history.recentBookIds("alice")).thenReturn(List.of());
        when(retrieval.retrieve(any(), any())).thenReturn(new RetrievalService.Result(List.of(book), "hybrid"));
        when(catalog.findBooks(List.of(1L))).thenReturn(List.of(book));
        when(provider.advise(any(), any(), any(), any())).thenReturn(CompletableFuture.completedFuture(
                new AiAnswer("Đây là gợi ý cho bạn.\nSách đã hiển thị: [book:1] Java", List.of(1L))));
        var response = service.advise("alice", new AdviceRequest("java", List.of(), 3), AdviceMode.CHAT).toCompletableFuture().join();
        assertThat(response.answer()).isEqualTo("Đây là gợi ý cho bạn.");
        assertThat(response.answer()).doesNotContain("[book:", "Sách đã hiển thị");
    }
}
