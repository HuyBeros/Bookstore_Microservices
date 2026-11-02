package com.example.catalog.Service;

import com.example.catalog.Dto.BookRequest;
import com.example.catalog.Dto.BookResponse;
import com.example.catalog.Dto.PageResponse;
import com.example.catalog.Model.Author;
import com.example.catalog.Model.Book;
import com.example.catalog.Model.Category;
import com.example.catalog.Model.Publisher;
import com.example.catalog.Repository.AuthorRepository;
import com.example.catalog.Repository.BookRepository;
import com.example.catalog.Repository.CategoryRepository;
import com.example.catalog.Repository.PublisherRepository;
import com.example.catalog.Repository.Specification.BookSearch;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class BookService {
    private final BookRepository books;
    private final CategoryRepository categories;
    private final AuthorRepository authors;
    private final PublisherRepository publishers;

    public BookService(BookRepository books, CategoryRepository categories,
                       AuthorRepository authors, PublisherRepository publishers) {
        this.books = books; this.categories = categories; this.authors = authors; this.publishers = publishers;
    }

    public PageResponse<BookResponse> search(String q, Long categoryId, Long authorId, Long publisherId,
                                             BigDecimal min, BigDecimal max, int page, int size, String sort) {
        return searchFiltered(q, categoryId == null ? List.of() : List.of(categoryId),
                authorId == null ? List.of() : List.of(authorId),
                publisherId == null ? List.of() : List.of(publisherId), min, max, page, size, sort);
    }

    public PageResponse<BookResponse> searchFiltered(String q, List<Long> categoryIds, List<Long> authorIds,
            List<Long> publisherIds, BigDecimal min, BigDecimal max, int page, int size, String sort) {
        if (min != null && max != null && min.compareTo(max) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá tối thiểu phải <= giá tối đa.");
        }
        Sort order = switch (sort) {
            case "title" -> Sort.by("title").ascending().and(Sort.by("id"));
            case "price-asc" -> Sort.by("price").ascending().and(Sort.by("id"));
            case "price-desc" -> Sort.by("price").descending().and(Sort.by("id"));
            case "newest" -> Sort.by("id").descending();
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kiểu sắp xếp không hợp lệ.");
        };
        return PageResponse.from(books.findAll(BookSearch.matchingMany(q, categoryIds, authorIds, publisherIds, min, max),
                PageRequest.of(page, size, order)).map(BookResponse::from));
    }

    public BookResponse get(long id) { return BookResponse.from(find(id)); }

    public List<BookResponse> batch(List<Long> ids) {
        return ids.stream().distinct().map(books::findByIdAndActiveTrue)
                .flatMap(java.util.Optional::stream).map(BookResponse::from).toList();
    }

    @Transactional
    public BookResponse create(BookRequest request) { return save(new Book(), request); }

    @Transactional
    public BookResponse update(long id, BookRequest request) { return save(find(id), request); }

    @Transactional
    public void delete(long id) {
        // Keep the identifier stable for order/history references owned by other services.
        find(id).deactivate();
    }

    private BookResponse save(Book book, BookRequest request) {
        if (new HashSet<>(request.authorIds()).size() != request.authorIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh sách tác giả không được trùng.");
        }
        Category category = categories.findById(request.categoryId()).orElseThrow(() -> missing("Thể loại"));
        Publisher publisher = publishers.findById(request.publisherId()).orElseThrow(() -> missing("Nhà xuất bản"));
        List<Author> orderedAuthors = request.authorIds().stream()
                .map(id -> authors.findById(id).orElseThrow(() -> missing("Tác giả"))).toList();
        book.update(request, category, publisher, orderedAuthors);
        return BookResponse.from(books.saveAndFlush(book));
    }

    private Book find(long id) { return books.findByIdAndActiveTrue(id).orElseThrow(() -> missing("Sách")); }
    static ResponseStatusException missing(String type) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, type + " không tồn tại.");
    }
}
