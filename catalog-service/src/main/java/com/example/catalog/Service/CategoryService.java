package com.example.catalog.Service;

import com.example.catalog.Dto.MetadataRequest;
import com.example.catalog.Dto.MetadataResponse;
import com.example.catalog.Dto.PageResponse;
import com.example.catalog.Model.Category;
import com.example.catalog.Repository.BookRepository;
import com.example.catalog.Repository.CategoryRepository;

import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class CategoryService {
    private final CategoryRepository repository;
    private final BookRepository books;

    public CategoryService(CategoryRepository repository, BookRepository books) {
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
        return save(new Category(), request);
    }

    @Transactional
    public MetadataResponse update(long id, MetadataRequest request) {
        return save(find(id), request);
    }

    @Transactional
    public void delete(long id) {
        Category item = find(id);
        if (books.existsByCategoryId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa vì đang có sách tham chiếu.");
        }
        repository.delete(item);
    }

    private MetadataResponse save(Category item, MetadataRequest request) {
        String name = request.name().trim();
        if (name.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên tối đa 100 ký tự.");
        }
        String normalized = name.toLowerCase(Locale.ROOT);
        long currentId = item.getId() == null ? 0L : item.getId();
        if (repository.existsByNormalizedNameAndIdNot(normalized, currentId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên danh mục đã tồn tại.");
        }
        item.setNormalizedName(normalized);
        item.setName(name);
        item.setDescription(request.description());
        return response(repository.saveAndFlush(item));
    }

    private Category find(long id) {
        return repository.findById(id).orElseThrow(() -> BookService.missing("Thể loại"));
    }

    private MetadataResponse response(Category item) {
        return new MetadataResponse(item.getId(), item.getName(), item.getDescription(), null);
    }
}
