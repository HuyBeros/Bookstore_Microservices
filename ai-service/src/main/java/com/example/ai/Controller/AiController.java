package com.example.ai.Controller;

import com.example.ai.Dto.ActivityRequest;
import com.example.ai.Dto.ApiResponse;
import com.example.ai.Dto.AdviceMode;
import com.example.ai.Dto.AdviceRequest;
import com.example.ai.Dto.AdviceResponse;
import com.example.ai.Dto.PurchaseRequest;
import com.example.ai.Model.ReadingEvent;
import com.example.ai.Service.AdviceService;
import com.example.ai.Service.HistoryService;
import com.example.ai.Service.RequestLimits;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Parameter;
import java.util.concurrent.CompletionStage;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
public class AiController {
    private final AdviceService advice;
    private final HistoryService history;
    private final RequestLimits limits;

    public AiController(AdviceService advice, HistoryService history, RequestLimits limits) {
        this.advice = advice; this.history = history; this.limits = limits;
    }
    @PostMapping("/api/ai/chat")
    public CompletionStage<ApiResponse<AdviceResponse>> chat(@Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AdviceRequest request) {
        return answer(jwt.getSubject(), request, AdviceMode.CHAT);
    }
    @PostMapping("/api/ai/search")
    public CompletionStage<ApiResponse<AdviceResponse>> search(@Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AdviceRequest request) {
        return answer(jwt.getSubject(), request, AdviceMode.SEARCH);
    }
    @PostMapping("/api/ai/recommendations")
    public CompletionStage<ApiResponse<AdviceResponse>> recommend(@Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AdviceRequest request) {
        return answer(jwt.getSubject(), request, AdviceMode.RECOMMENDATIONS);
    }
    @PostMapping("/api/ai/interactions")
    public ResponseEntity<Void> record(@Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ActivityRequest request) {
        history.record(jwt.getSubject(), request.bookId(), ReadingEvent.Type.valueOf(request.type().name()), null);
        return ResponseEntity.noContent().build();
    }
    @DeleteMapping("/api/ai/interactions")
    public ResponseEntity<Void> clear(@Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        history.clear(jwt.getSubject());
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/internal/ai/purchases")
    public ResponseEntity<Void> purchase(@Valid @RequestBody PurchaseRequest request) {
        history.record(request.userSubject(), request.bookId(), ReadingEvent.Type.PURCHASE, request.eventId());
        return ResponseEntity.noContent().build();
    }

    private CompletionStage<ApiResponse<AdviceResponse>> answer(String subject, AdviceRequest request, AdviceMode mode) {
        limits.acquire(subject);
        try {
            return advice.advise(subject, request, mode).thenApply(ApiResponse::success).whenComplete((response, error) -> limits.release());
        } catch (RuntimeException error) {
            limits.release();
            throw error;
        }
    }
}
