package com.example.ai.Repository;

import java.sql.*;
import java.util.*;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

@Repository
public class VectorRepository {
    public record Document(long bookId, String hash, String content, float[] embedding) {}
    public record Hit(long bookId, double similarity) {}
    private final String url, user, password;
    private volatile boolean initialized;
    public VectorRepository(@Value("${ai.rag.jdbc-url}") String url, @Value("${ai.rag.username}") String user,
                            @Value("${ai.rag.password:}") String password) {
        this.url = url; this.user = user; this.password = password;
    }
    private synchronized void initialize() {
        if (initialized) return;
        Flyway.configure().dataSource(url, user, password).locations("classpath:db/vector-migration").load().migrate();
        initialized = true;
    }
    private Connection connection() throws SQLException {
        initialize();
        var properties = new Properties();
        properties.setProperty("user", user); properties.setProperty("password", password);
        properties.setProperty("connectTimeout", "2"); properties.setProperty("socketTimeout", "5");
        return DriverManager.getConnection(url, properties);
    }
    public Map<Long, String> hashes(String model, int dimensions) {
        try (var connection = connection(); var statement = connection.prepareStatement(
                "SELECT book_id, content_hash FROM book_vectors WHERE model=? AND dimensions=?")) {
            statement.setString(1, model); statement.setInt(2, dimensions);
            var hashes = new HashMap<Long, String>();
            try (var rows = statement.executeQuery()) { while (rows.next()) hashes.put(rows.getLong(1), rows.getString(2)); }
            return hashes;
        } catch (SQLException error) { throw new IllegalStateException("Vector store unavailable"); }
    }
    public void upsert(List<Document> documents, String model, int dimensions) {
        try (var connection = connection()) {
            connection.setAutoCommit(false);
            try (var statement = connection.prepareStatement("""
                    INSERT INTO book_vectors(book_id, model, dimensions, content_hash, content, embedding)
                    VALUES (?, ?, ?, ?, ?, ?::vector)
                    ON CONFLICT(book_id, model, dimensions) DO UPDATE SET content_hash=EXCLUDED.content_hash,
                    content=EXCLUDED.content, embedding=EXCLUDED.embedding, updated_at=CURRENT_TIMESTAMP
                    """)) {
                for (var document : documents) {
                    statement.setLong(1, document.bookId()); statement.setString(2, model); statement.setInt(3, dimensions);
                    statement.setString(4, document.hash()); statement.setString(5, document.content());
                    statement.setString(6, Arrays.toString(document.embedding())); statement.addBatch();
                }
                statement.executeBatch(); connection.commit();
            } catch (SQLException error) { connection.rollback(); throw error; }
        } catch (SQLException error) { throw new IllegalStateException("Vector store unavailable"); }
    }
    public List<Hit> nearest(float[] query, String model, int dimensions, int limit) {
        return nearestAllowed(query, model, dimensions, limit, null);
    }
    public List<Hit> nearestAllowed(float[] query, String model, int dimensions, int limit, List<Long> allowedIds) {
        if (allowedIds != null && allowedIds.isEmpty()) return List.of();
        String sql = """
                SELECT book_id, 1 - (embedding <=> ?::vector) AS similarity FROM book_vectors
                WHERE model=? AND dimensions=?
                """ + (allowedIds == null ? "" : " AND book_id = ANY (?) ") + " ORDER BY embedding <=> ?::vector LIMIT ?";
        try (var connection = connection(); var statement = connection.prepareStatement(sql)) {
            statement.setQueryTimeout(2);
            statement.setString(1, Arrays.toString(query)); statement.setString(2, model); statement.setInt(3, dimensions);
            int parameter = 4;
            if (allowedIds != null) statement.setArray(parameter++, connection.createArrayOf("bigint", allowedIds.toArray()));
            statement.setString(parameter++, Arrays.toString(query)); statement.setInt(parameter, Math.clamp(limit, 1, 50));
            var hits = new ArrayList<Hit>();
            try (var rows = statement.executeQuery()) { while (rows.next()) hits.add(new Hit(rows.getLong(1), rows.getDouble(2))); }
            return hits;
        } catch (SQLException error) { throw new IllegalStateException("Vector store unavailable"); }
    }
    public void removeMissing(Set<Long> ids, String model, int dimensions) {
        if (ids.isEmpty()) return;
        try (var connection = connection(); var statement = connection.prepareStatement(
                "DELETE FROM book_vectors WHERE model=? AND dimensions=? AND NOT (book_id = ANY (?))")) {
            statement.setString(1, model); statement.setInt(2, dimensions);
            statement.setArray(3, connection.createArrayOf("bigint", ids.toArray())); statement.executeUpdate();
        } catch (SQLException error) { throw new IllegalStateException("Vector store unavailable"); }
    }
}
