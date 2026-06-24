package com.pai2026.backend.offers.repository;

import com.pai2026.backend.offers.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlugAndIsActiveTrue(String slug);
    Optional<Category> findByIdAndIsActiveTrue(Long id);
    boolean existsBySlug(String slug);
    
    @Query("SELECT c FROM Category c WHERE c.parent IS NULL AND c.isActive = true ORDER BY c.sortOrder ASC")
    List<Category> findRootCategories();

    @Query("SELECT COALESCE(MAX(c.sortOrder), -1) FROM Category c WHERE ((:parentId IS NULL AND c.parent IS NULL) OR c.parent.id = :parentId)")
    int findMaxSortOrderByParentId(@Param("parentId") Long parentId);
}
