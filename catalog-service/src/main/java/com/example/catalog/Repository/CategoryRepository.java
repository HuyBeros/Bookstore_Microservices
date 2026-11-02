package com.example.catalog.Repository;

import com.example.catalog.Model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByNormalizedNameAndIdNot(String name, Long id);
}
