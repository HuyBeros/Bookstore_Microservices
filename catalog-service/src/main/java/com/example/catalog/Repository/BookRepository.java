package com.example.catalog.Repository;

import com.example.catalog.Model.Book;

import java.util.Optional;
import org.springframework.data.jpa.repository.*;

public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {
    Optional<Book> findByIdAndActiveTrue(Long id);
    boolean existsByCategoryId(Long categoryId);
    boolean existsByPublisherId(Long publisherId);
    boolean existsByAuthorsId(Long authorId);
}
