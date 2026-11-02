package com.example.catalog.Service;

import com.example.catalog.Dto.MetadataRequest;
import com.example.catalog.Dto.MetadataResponse;
import com.example.catalog.Dto.PageResponse;
import com.example.catalog.Model.Author;
import com.example.catalog.Repository.AuthorRepository;
import com.example.catalog.Repository.BookRepository;

import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AuthorService {
    private final AuthorRepository repository;
    private final BookRepository books;

    public AuthorService(AuthorRepository repository, BookRepository books) {
        this.repository = repository;
        this.books = books;
    }

    public PageResponse<MetadataResponse> list(int page, int size) {
        return PageResponse.from(repository.findAll(
                PageRequest.of(page, size, Sort.by("name").and(Sort.by("id")))).map(this::response));
    }

    public MetadataResponse get(long id) {
        return response(find(id));
    }

    @Transactional
    public MetadataResponse create(MetadataRequest request) {
        return save(new Author(), request);
    }

    @Transactional
    public MetadataResponse update(long id, MetadataRequest request) {
        return save(find(id), request);
    }

    @Transactional
    public void delete(long id) {
        Author item = find(id);
        if (books.existsByAuthorsId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa vì đang có sách tham chiếu.");
        }
        repository.delete(item);
    }

    private MetadataResponse save(Author item, MetadataRequest request) {
        String name = request.name().trim();
        if (name.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên tối đa 100 ký tự.");
        }
        item.setName(name);
        item.setBio(request.bio());
        return response(repository.saveAndFlush(item));
    }

    private Author find(long id) {
        return repository.findById(id).orElseThrow(() -> BookService.missing("Tác giả"));
    }

    private MetadataResponse response(Author item) {
        return new MetadataResponse(item.getId(), item.getName(), null, item.getBio());
    }
}
