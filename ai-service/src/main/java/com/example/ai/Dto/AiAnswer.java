package com.example.ai.Dto;

import java.util.List;

public record AiAnswer(String answer, List<Long> bookIds) {
}
