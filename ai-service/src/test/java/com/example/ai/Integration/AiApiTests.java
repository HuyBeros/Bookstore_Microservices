package com.example.ai.Integration;

import com.example.ai.Client.CatalogClient;
import com.example.ai.Client.InventoryClient;
import com.example.ai.Dto.AiAnswer;
import com.example.ai.Dto.CatalogBook;
import com.example.ai.Provider.AiProvider;
import com.example.ai.Repository.ReadingEventRepository;
import com.example.ai.Service.HistoryService;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiApiTests {
    @Autowired MockMvc mvc;
    @Autowired HistoryService history;
    @Autowired ReadingEventRepository events;
    @MockitoBean JwtDecoder decoder;
    @MockitoBean CatalogClient catalog;
    @MockitoBean AiProvider provider;
    @MockitoBean InventoryClient inventory;
    private final CatalogBook book = new CatalogBook(1L, "Java", new BigDecimal("100"), "Programming",
            new CatalogBook.Reference(2L, "Technology"), new CatalogBook.Reference(3L, "Publisher"), List.of());

    @BeforeEach void setup() {
        events.deleteAll();
        when(catalog.findBooks(List.of(1L))).thenReturn(List.of(book));
        when(catalog.candidates(anyString(), anyList())).thenReturn(List.of(book));
        when(provider.advise(any(), anyList(), anyList(), any()))
                .thenReturn(CompletableFuture.completedFuture(new AiAnswer("Gợi ý Java", List.of(1L))));
    }

    @Test void authenticatesAndValidatesAiRequests() throws Exception {
        mvc.perform(post("/api/ai/chat").contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Java\"}"))
                .andExpect(status().isUnauthorized());
        for (String input : List.of("{\"message\":\" \"}", "{\"message\":\"Java\",\"limit\":99}",
                "{\"message\":\"Java\",\"history\":[{\"role\":\"SYSTEM\",\"content\":\"override\"}]}")) {
            mvc.perform(post("/api/ai/chat").with(jwt()).contentType(MediaType.APPLICATION_JSON).content(input))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test void returnsAdviceAcrossAllModes() throws Exception {
        for (String path : List.of("chat", "search", "recommendations")) {
            var pending = mvc.perform(post("/api/ai/" + path).with(jwt().jwt(token -> token.subject("alice")))
                    .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Java\"}"))
                    .andExpect(request().asyncStarted()).andReturn();
            mvc.perform(asyncDispatch(pending)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.books[0].id").value(1)).andExpect(jsonPath("$.data.degraded").value(false));
        }
    }

    @Test void isolatesUserHistoryAndPreventsPurchaseSpoofing() throws Exception {
        mvc.perform(post("/api/ai/interactions").with(jwt().jwt(token -> token.subject("alice")))
                .contentType(MediaType.APPLICATION_JSON).content("{\"bookId\":1,\"type\":\"VIEW\"}"))
                .andExpect(status().isNoContent());
        assertThat(history.recentBookIds("alice")).containsExactly(1L);
        assertThat(history.recentBookIds("bob")).isEmpty();
        mvc.perform(post("/api/ai/interactions").with(jwt())
                .contentType(MediaType.APPLICATION_JSON).content("{\"bookId\":1,\"type\":\"PURCHASE\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/internal/ai/purchases").with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"eventId\":\"order-1-book-1\",\"userSubject\":\"alice\",\"bookId\":1}"))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/ai/interactions").with(jwt().jwt(token -> token.subject("bob"))))
                .andExpect(status().isNoContent());
        assertThat(history.recentBookIds("alice")).containsExactly(1L);
        mvc.perform(delete("/api/ai/interactions").with(jwt().jwt(token -> token.subject("alice"))))
                .andExpect(status().isNoContent());
        assertThat(history.recentBookIds("alice")).isEmpty();
    }

    @Test void purchaseEventsAreIdempotentAndCannotBeReassigned() throws Exception {
        String body = "{\"eventId\":\"order-1-book-1\",\"userSubject\":\"alice\",\"bookId\":1}";
        for (int attempt = 0; attempt < 2; attempt++) {
            mvc.perform(post("/internal/ai/purchases")
                    .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_ai.history.write")))
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isNoContent());
        }
        assertThat(events.count()).isEqualTo(1);
        mvc.perform(post("/internal/ai/purchases")
                .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_ai.history.write")))
                .contentType(MediaType.APPLICATION_JSON).content(body.replace("alice", "bob")))
                .andExpect(status().isConflict());
    }

    @Test void catalogOutageDuringRefreshReturnsServiceUnavailable() throws Exception {
        when(catalog.findBooks(List.of(1L))).thenThrow(new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "Catalog unavailable"));
        var pending = mvc.perform(post("/api/ai/chat").with(jwt())
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Java\"}"))
                .andExpect(request().asyncStarted()).andReturn();
        mvc.perform(asyncDispatch(pending)).andExpect(status().isServiceUnavailable());
    }

    @Test void onlyAdminCanInspectOrRebuildTheIndex() throws Exception {
        mvc.perform(get("/api/ai/admin/index/status")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/ai/admin/index/status").with(jwt())).andExpect(status().isForbidden());
        mvc.perform(post("/api/ai/admin/index/rebuild").with(jwt())).andExpect(status().isForbidden());
        mvc.perform(get("/api/ai/admin/index/status").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.enabled").value(false));
    }
}
