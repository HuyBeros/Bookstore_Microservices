package com.example.ai.Service;

import com.example.ai.Client.CatalogClient;
import com.example.ai.Dto.CatalogBook;
import com.example.ai.Provider.EmbeddingProvider;
import com.example.ai.Provider.EmbeddingUnavailableException;
import com.example.ai.Repository.VectorRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class CatalogIndexService {
    public record Status(boolean enabled, String state, int indexedBooks, String model, int dimensions, Instant lastSuccess) {}
    private final CatalogClient catalog;
    private final EmbeddingProvider embeddings;
    private final VectorRepository vectors;
    private final boolean enabled;
    private final ReentrantLock lock = new ReentrantLock();
    private volatile String state = "NOT_STARTED";
    private volatile int indexed;
    private volatile Instant lastSuccess;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CatalogIndexService.class);
    public CatalogIndexService(CatalogClient catalog, EmbeddingProvider embeddings, VectorRepository vectors,
                               @Value("${ai.rag.enabled:false}") boolean enabled) {
        this.catalog = catalog; this.embeddings = embeddings; this.vectors = vectors; this.enabled = enabled;
    }
    public Status status() { return new Status(enabled, state, indexed, embeddings.model(), embeddings.dimensions(), lastSuccess); }
    public boolean ready() { return enabled && (lastSuccess != null || indexed > 0); }
    @Scheduled(initialDelayString = "${ai.rag.initial-delay-ms:15000}", fixedDelayString = "${ai.rag.interval-ms:600000}")
    public void refresh() {
        if (!enabled || !lock.tryLock()) return;
        try {
            state = "INDEXING";
            var books = catalog.snapshot();
            var hashes = vectors.hashes(embeddings.model(), embeddings.dimensions());
            indexed = hashes.size();
            var changed = books.stream().filter(b -> !hash(document(b)).equals(hashes.get(b.id()))).toList();
            for (int offset = 0; offset < changed.size(); offset += 16) {
                var batch = changed.subList(offset, Math.min(offset + 16, changed.size()));
                var texts = batch.stream().map(CatalogIndexService::document).toList();
                var values = embedWithBackoff(texts);
                if (values.size() != batch.size()) throw new IllegalStateException();
                var rows = new ArrayList<VectorRepository.Document>();
                for (int i = 0; i < batch.size(); i++) rows.add(new VectorRepository.Document(batch.get(i).id(), hash(texts.get(i)), texts.get(i), values.get(i)));
                vectors.upsert(rows, embeddings.model(), embeddings.dimensions());
                indexed += (int) batch.stream().filter(book -> !hashes.containsKey(book.id())).count();
            }
            // No sweep on partial fetch or embedding failure. Removed books are revalidated at query time too.
            vectors.removeMissing(new HashSet<>(books.stream().map(CatalogBook::id).toList()), embeddings.model(), embeddings.dimensions());
            indexed = books.size(); lastSuccess = Instant.now(); state = "READY";
            log.info("Book index ready: {} books", indexed);
        } catch (EmbeddingUnavailableException error) {
            state = "EMBEDDING_HTTP_" + error.status();
            log.warn("Book indexing paused: HTTP {}, {} indexed books retained", error.status(), indexed);
        } catch (RuntimeException error) {
            state = "UNAVAILABLE"; // Do not expose provider responses, credentials or DB connection strings.
            log.warn("Book indexing paused; existing vectors retained (reason: {})", error.getClass().getSimpleName());
        } finally { lock.unlock(); }
    }
    private List<float[]> embedWithBackoff(List<String> texts) {
        for (int attempt = 0; ; attempt++) {
            try { state = "INDEXING"; return embeddings.embed(texts, false); }
            catch (EmbeddingUnavailableException error) {
                if (attempt >= 2 || (error.status() != 429 && error.status() < 500)) throw error;
                state = "WAITING_FOR_QUOTA";
                try { Thread.sleep(error.status() == 429 ? 61000L : 2000L * (attempt + 1)); }
                catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); throw new IllegalStateException("Indexing interrupted"); }
            }
        }
    }
    public static String document(CatalogBook book) {
        String authors = book.authors() == null ? "" : String.join(", ", book.authors().stream().map(CatalogBook.Reference::name).toList());
        String description = book.description() == null ? "" : book.description().replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").strip();
        return "index-format-v1\nTên sách: " + book.title() + "\nTác giả: " + authors
                + "\nThể loại: " + (book.category() == null ? "" : book.category().name())
                + "\nGiới thiệu: " + description.substring(0, Math.min(description.length(), 1800));
    }
    private static String hash(String content) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content.getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }
}
