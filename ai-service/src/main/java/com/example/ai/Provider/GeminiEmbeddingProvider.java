package com.example.ai.Provider;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class GeminiEmbeddingProvider implements EmbeddingProvider {
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
    private final ObjectMapper json;
    private final String baseUrl, key, model;
    private final int dimensions;
    public GeminiEmbeddingProvider(ObjectMapper json, @Value("${ai.gemini.base-url}") String baseUrl,
            @Value("${ai.gemini.api-key:}") String key,
            @Value("${ai.rag.embedding-model:gemini-embedding-001}") String model,
            @Value("${ai.rag.dimensions:768}") int dimensions) {
        if (!model.matches("[a-zA-Z0-9._-]+") || dimensions < 1 || dimensions > 3072) throw new IllegalArgumentException("Invalid embedding configuration");
        this.json = json; this.baseUrl = baseUrl; this.key = key; this.model = model; this.dimensions = dimensions;
    }
    public String model() { return model; }
    public int dimensions() { return dimensions; }
    public List<float[]> embed(List<String> texts, boolean query) {
        if (texts.isEmpty()) return List.of();
        if (key.isBlank() || texts.size() > 16) throw new IllegalStateException("Embedding unavailable");
        try {
            var requests = texts.stream().map(text -> Map.of("model", "models/" + model,
                    "content", Map.of("parts", List.of(Map.of("text", text))),
                    "taskType", query ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT", "outputDimensionality", dimensions)).toList();
            var body = texts.size() == 1 ? requests.getFirst() : Map.of("requests", requests);
            var request = HttpRequest.newBuilder(URI.create(baseUrl + "/v1beta/models/" + model
                            + (texts.size() == 1 ? ":embedContent" : ":batchEmbedContents")))
                    .timeout(Duration.ofSeconds(query ? 4 : 20)).header("Content-Type", "application/json")
                    .header("x-goog-api-key", key).POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build();
            var response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) throw new EmbeddingUnavailableException(response.statusCode());
            if (response.body().length() > 2000000) throw new IllegalStateException();
            var root = json.readTree(response.body());
            var nodes = texts.size() == 1 ? List.of(root.path("embedding")) : root.path("embeddings").valueStream().toList();
            if (nodes.size() != texts.size()) throw new IllegalStateException();
            var result = new ArrayList<float[]>();
            for (var node : nodes) {
                var values = node.path("values");
                if (!values.isArray() || values.size() != dimensions) throw new IllegalStateException();
                var vector = new float[dimensions]; double norm = 0;
                for (int i = 0; i < dimensions; i++) {
                    if (!values.get(i).isNumber()) throw new IllegalStateException();
                    vector[i] = (float) values.get(i).asDouble();
                    if (!Float.isFinite(vector[i])) throw new IllegalStateException();
                    norm += (double) vector[i] * vector[i];
                }
                if (norm == 0) throw new IllegalStateException();
                for (int i = 0; i < dimensions; i++) vector[i] /= (float) Math.sqrt(norm);
                result.add(vector);
            }
            return result;
        } catch (EmbeddingUnavailableException error) { throw error;
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt(); throw new IllegalStateException("Embedding unavailable");
        } catch (Exception error) { throw new IllegalStateException("Embedding unavailable"); }
    }
}
