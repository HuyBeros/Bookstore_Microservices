package com.example.ai.Provider;

public class EmbeddingUnavailableException extends IllegalStateException {
    private final int status;
    public EmbeddingUnavailableException(int status) { super("Embedding unavailable"); this.status = status; }
    public int status() { return status; }
}
