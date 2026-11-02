package com.example.catalog.Repository.Specification;

import com.example.catalog.Model.Book;

import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Locale;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class BookSearch {
    private BookSearch() {}

    public static Specification<Book> matching(String query, Long categoryId, Long authorId, Long publisherId,
                                        BigDecimal minPrice, BigDecimal maxPrice) {
        return matchingMany(query, categoryId == null ? List.of() : List.of(categoryId),
                authorId == null ? List.of() : List.of(authorId),
                publisherId == null ? List.of() : List.of(publisherId), minPrice, maxPrice);
    }

    public static Specification<Book> matchingMany(String query, List<Long> categoryIds, List<Long> authorIds,
                                                   List<Long> publisherIds, BigDecimal minPrice, BigDecimal maxPrice) {
        return (root, criteria, cb) -> {
            criteria.distinct(true);
            var predicates = new ArrayList<Predicate>();
            predicates.add(cb.isTrue(root.get("active")));
            if (!categoryIds.isEmpty()) predicates.add(root.get("category").get("id").in(categoryIds));
            if (!publisherIds.isEmpty()) predicates.add(root.get("publisher").get("id").in(publisherIds));
            if (!authorIds.isEmpty()) predicates.add(root.join("authors").get("id").in(authorIds));
            if (minPrice != null) predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            if (maxPrice != null) predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            if (query != null && !query.isBlank()) {
                String pattern = "%" + escape(normalize(query)) + "%";
                predicates.add(cb.or(
                        cb.like(fold(cb, root.get("title")), pattern, '\\'),
                        cb.like(fold(cb, root.get("description")), pattern, '\\'),
                        cb.like(fold(cb, root.get("category").get("name")), pattern, '\\'),
                        cb.like(fold(cb, root.get("publisher").get("name")), pattern, '\\'),
                        cb.like(fold(cb, root.join("authors", JoinType.LEFT).get("name")), pattern, '\\')));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static jakarta.persistence.criteria.Expression<String> fold(
            jakarta.persistence.criteria.CriteriaBuilder cb, jakarta.persistence.criteria.Expression<String> value) {
        return cb.function("translate", String.class, cb.lower(value),
                cb.literal("àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ"), cb.literal("aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd"));
    }
    public static String normalize(String value) {
        return java.text.Normalizer.normalize(value.trim().toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").replace('đ', 'd').replaceAll("\\s+", " ");
    }

    private static String escape(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
