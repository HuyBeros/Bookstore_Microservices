package com.example.catalog.Service;
import com.example.catalog.Dto.*;
import com.example.catalog.Repository.*;
import com.example.catalog.Repository.Specification.BookSearch;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@Transactional(readOnly = true)
public class BookFilterService {
    private final BookFilterRepository filters;
    private final BookRepository books;
    public BookFilterService(BookFilterRepository filters, BookRepository books) { this.filters = filters; this.books = books; }
    public FilterResponse get(BookFilters request) {
        if (request.minPrice() != null && request.maxPrice() != null && request.minPrice().compareTo(request.maxPrice()) > 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá tối thiểu phải <= giá tối đa.");
        var bounds = filters.priceBounds(request);
        return new FilterResponse(filters.options("category", request), filters.options("authors", request),
                filters.options("publisher", request), bounds[0], bounds[1], books.count(BookSearch.matchingMany(
                request.q(), request.categories(), request.authors(), request.publishers(), request.minPrice(), request.maxPrice())));
    }
}
