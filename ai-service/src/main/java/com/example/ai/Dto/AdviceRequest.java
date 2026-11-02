package com.example.ai.Dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record AdviceRequest(@NotBlank @Size(max = 2000) String message,
                            @Size(max = 10) List<@NotNull @Valid Turn> history,
                            @Min(1) @Max(10) Integer limit) {
    public AdviceRequest {
        history = history == null ? List.of() : List.copyOf(history);
        limit = limit == null ? 5 : limit;
    }
    public enum Role { USER, ASSISTANT }
    public record Turn(@NotNull Role role, @NotBlank @Size(max = 2000) String content) {}
}
