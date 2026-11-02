package com.example.ai.Service;

import com.example.ai.Client.CatalogClient;
import com.example.ai.Dto.*;
import com.example.ai.Provider.EmbeddingProvider;
import com.example.ai.Repository.VectorRepository;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class RetrievalService {
    public record Result(List<CatalogBook> books, String mode, boolean partialIndex) {
        public Result(List<CatalogBook> books, String mode) { this(books, mode, false); }
    }
    private final CatalogClient catalog;
    private final CatalogIndexService index;
    private final EmbeddingProvider embeddings;
    private final VectorRepository vectors;
    private volatile long semanticRetryAfter;
    public RetrievalService(CatalogClient catalog, CatalogIndexService index, EmbeddingProvider embeddings, VectorRepository vectors) {
        this.catalog = catalog; this.index = index; this.embeddings = embeddings; this.vectors = vectors;
    }
    public Result retrieve(AdviceRequest request, List<Long> recentIds) {
        var budget = BookBudget.from(request);
        var genre = BookGenre.from(request);
        List<CatalogBook> constrainedBooks = null;
        if (genre.constrained() || budget.minimum() != null || budget.maximum() != null) {
            constrainedBooks = catalog.cachedSnapshot().stream().filter(budget::accepts).filter(genre::accepts).toList();
            if (constrainedBooks.isEmpty()) return new Result(List.of(), "catalog");
        }
        List<Long> allowedIds = constrainedBooks == null ? null : constrainedBooks.stream().map(CatalogBook::id).toList();
        String query = request.message();
        // Carry the previous reading intent into a short follow-up, never promote history to system instructions.
        if (BookBudget.normalize(query).matches(".*(?:cuon nao|cuon khac|quyen nao|re hon|goi y them|cuon thu|noi dung|sach nao).*")) {
            var previous = request.history().stream().filter(t -> t.role() == AdviceRequest.Role.USER).reduce((a, b) -> b);
            if (previous.isPresent()) query = previous.get().content().substring(0, Math.min(500, previous.get().content().length())) + "\n" + query;
        }
        var keyword = catalog.candidates(query, recentIds);
        var scores = new HashMap<Long, Double>();
        var byId = new HashMap<Long, CatalogBook>();
        for (int i = 0; i < keyword.size(); i++) { byId.put(keyword.get(i).id(), keyword.get(i)); scores.put(keyword.get(i).id(), 1.0 / (60 + i)); }
        boolean semantic = false;
        if (!query.equals(request.message())) {
            var prior = request.history().stream().filter(t -> t.role() == AdviceRequest.Role.ASSISTANT).reduce((a, b) -> b);
            if (prior.isPresent()) {
                var matcher = java.util.regex.Pattern.compile("\\[book:(\\d{1,18})\\]").matcher(prior.get().content());
                var ids = new ArrayList<Long>();
                while (matcher.find() && ids.size() < 10) ids.add(Long.parseLong(matcher.group(1)));
                var previousBooks = catalog.findBooks(ids);
                for (int i = 0; i < previousBooks.size(); i++) {
                    var book = previousBooks.get(i); byId.put(book.id(), book); scores.merge(book.id(), 1.0 / (50 + i), Double::sum);
                }
            }
        }
        if (index.ready() && System.currentTimeMillis() >= semanticRetryAfter) {
            try {
                var queryVector = embeddings.embed(List.of(query), true).getFirst();
                var hits = vectors.nearestAllowed(queryVector, embeddings.model(), embeddings.dimensions(), 40, allowedIds);
                var relevant = hits.stream().filter(hit -> hit.similarity() >= .35).toList();
                var hydrated = catalog.findBooks(relevant.stream().map(VectorRepository.Hit::bookId).toList());
                hydrated.forEach(book -> byId.put(book.id(), book));
                for (int i = 0; i < relevant.size(); i++) scores.merge(relevant.get(i).bookId(), 2.0 / (60 + i), Double::sum);
                semantic = !relevant.isEmpty();
            } catch (RuntimeException error) { semanticRetryAfter = System.currentTimeMillis() + 60000; }
        }
        // Even an unavailable/incomplete vector index must not hide books that match explicit Catalog constraints.
        if (constrainedBooks != null) for (var book : constrainedBooks) byId.putIfAbsent(book.id(), book);
        String normalizedQuery = BookBudget.normalize(query);
        byId.values().stream().filter(b -> normalizedQuery.contains(BookBudget.normalize(b.title())))
                .forEach(b -> scores.merge(b.id(), .1, Double::sum));
        var books = byId.values().stream().filter(budget::accepts).filter(genre::accepts)
                .sorted(Comparator.<CatalogBook>comparingDouble(b -> scores.getOrDefault(b.id(), 0d)).reversed().thenComparing(CatalogBook::id))
                .limit(12).toList();
        return new Result(books, semantic ? "hybrid" : "keyword", index.ready() && !"READY".equals(index.status().state()));
    }
}
