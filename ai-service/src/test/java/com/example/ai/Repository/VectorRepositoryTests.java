package com.example.ai.Repository;

import java.sql.DriverManager;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import static org.assertj.core.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "AI_VECTOR_TEST_URL", matches = ".*/ai_vectors_test.*")
class VectorRepositoryTests {
    @Test void migratesRealPgvectorAndSearchesUpdatesAndRemovesDocuments() throws Exception {
        String url = System.getenv("AI_VECTOR_TEST_URL"), password = System.getenv("AI_VECTOR_TEST_PASSWORD");
        var repository = new VectorRepository(url, "postgres", password);
        repository.hashes("fixture", 3);
        try (var connection = DriverManager.getConnection(url, "postgres", password); var statement = connection.createStatement()) {
            statement.execute("TRUNCATE book_vectors"); // Only the explicitly isolated disposable test database.
        }
        repository.upsert(List.of(new VectorRepository.Document(1, "a", "first", new float[]{1, 0, 0}),
                new VectorRepository.Document(2, "b", "second", new float[]{0, 1, 0})), "fixture", 3);
        assertThat(repository.nearest(new float[]{1, 0, 0}, "fixture", 3, 2)).extracting(VectorRepository.Hit::bookId).containsExactly(1L, 2L);
        assertThat(repository.nearest(new float[]{1, 0, 0}, "other-model", 3, 2)).isEmpty();
        assertThat(repository.nearestAllowed(new float[]{1, 0, 0}, "fixture", 3, 1, List.of(2L)))
                .extracting(VectorRepository.Hit::bookId).containsExactly(2L);
        repository.upsert(List.of(new VectorRepository.Document(1, "new-hash", "updated", new float[]{1, 0, 0})), "fixture", 3);
        assertThat(repository.hashes("fixture", 3)).containsEntry(1L, "new-hash").hasSize(2);
        repository.removeMissing(Set.of(1L), "fixture", 3);
        assertThat(repository.hashes("fixture", 3)).hasSize(1);
        assertThatThrownBy(() -> repository.upsert(List.of(new VectorRepository.Document(3, "bad", "bad", new float[]{1, 0})), "fixture", 3))
                .hasMessage("Vector store unavailable");
        assertThat(repository.hashes("fixture", 3)).hasSize(1);
    }
}
