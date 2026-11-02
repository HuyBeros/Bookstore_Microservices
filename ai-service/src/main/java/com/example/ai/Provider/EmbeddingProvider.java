package com.example.ai.Provider;

import java.util.List;

public interface EmbeddingProvider {
    List<float[]> embed(List<String> texts, boolean query);
    String model();
    int dimensions();
}
