package com.example.catalog.Repository;

import com.example.catalog.Dto.BookFilters;
import com.example.catalog.Dto.FilterResponse.Option;
import com.example.catalog.Model.*;
import com.example.catalog.Repository.Specification.BookSearch;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.*;

@Repository
public class BookFilterRepository {
    private final EntityManager em;
    public BookFilterRepository(EntityManager em) { this.em = em; }

    // Each facet applies the other dimensions; multiple choices within one dimension use OR.
    public List<Option> options(String dimension, BookFilters filters) {
        var cb = em.getCriteriaBuilder();
        var query = cb.createTupleQuery();
        var book = query.from(Book.class);
        var relation = book.join(dimension);
        var spec = BookSearch.matchingMany(filters.q(), dimension.equals("category") ? List.of() : filters.categories(),
                dimension.equals("authors") ? List.of() : filters.authors(),
                dimension.equals("publisher") ? List.of() : filters.publishers(), filters.minPrice(), filters.maxPrice());
        query.multiselect(relation.get("id").alias("id"), cb.countDistinct(book.get("id")).alias("count"))
                .where(spec.toPredicate(book, query, cb)).groupBy(relation.get("id"));
        Map<Long, Long> counts = new HashMap<>();
        em.createQuery(query).getResultList().forEach(row -> counts.put(row.get("id", Long.class), row.get("count", Long.class)));
        var metadata = cb.createTupleQuery();
        Class<?> metadataType = switch (dimension) {
            case "category" -> Category.class;
            case "authors" -> Author.class;
            case "publisher" -> Publisher.class;
            default -> throw new IllegalArgumentException("Unknown filter dimension");
        };
        var entity = metadata.from(metadataType);
        metadata.multiselect(entity.get("id").alias("id"), entity.get("name").alias("name"))
                .orderBy(cb.asc(cb.lower(entity.get("name"))), cb.asc(entity.get("id")));
        return em.createQuery(metadata).getResultList().stream()
                .map(row -> new Option(row.get("id", Long.class), row.get("name", String.class), counts.getOrDefault(row.get("id", Long.class), 0L)))
                .toList();
    }

    public BigDecimal[] priceBounds(BookFilters filters) {
        var cb = em.getCriteriaBuilder();
        var query = cb.createTupleQuery();
        var book = query.from(Book.class);
        var spec = BookSearch.matchingMany(filters.q(), filters.categories(), filters.authors(), filters.publishers(), null, null);
        query.multiselect(cb.min(book.<BigDecimal>get("price")), cb.max(book.<BigDecimal>get("price")))
                .where(spec.toPredicate(book, query, cb));
        Tuple row = em.createQuery(query).getSingleResult();
        return new BigDecimal[]{row.get(0, BigDecimal.class), row.get(1, BigDecimal.class)};
    }
}
