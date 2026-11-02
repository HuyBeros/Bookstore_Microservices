package com.example.catalog.Service;

import com.example.catalog.Dto.MetadataRequest;
import com.example.catalog.Dto.MetadataResponse;
import com.example.catalog.Dto.PageResponse;
import com.example.catalog.Model.Publisher;
import com.example.catalog.Repository.BookRepository;
import com.example.catalog.Repository.PublisherRepository;

import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class PublisherService {
    private final PublisherRepository repository;
    private final BookRepository books;

    public PublisherService(PublisherRepository repository, BookRepository books) {
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
        return save(new Publisher(), request);
    }

    @Transactional
    public MetadataResponse update(long id, MetadataRequest request) {
        return save(find(id), request);
    }

    @Transactional
    public void delete(long id) {
        Publisher item = find(id);
        if (books.existsByPublisherId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa vì đang có sách tham chiếu.");
        }
        repository.delete(item);
    }

    private MetadataResponse save(Publisher item, MetadataRequest request) {
        String name = request.name().trim();
        item.setName(name);
        return response(repository.saveAndFlush(item));
    }

    private Publisher find(long id) {
        return repository.findById(id).orElseThrow(() -> BookService.missing("Nhà xuất bản"));
    }

    private MetadataResponse response(Publisher item) {
        return new MetadataResponse(item.getId(), item.getName(), null, null);
    }
}
