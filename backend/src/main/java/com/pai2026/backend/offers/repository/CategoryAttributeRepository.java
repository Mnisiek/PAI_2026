package com.pai2026.backend.offers.repository;

import com.pai2026.backend.offers.domain.CategoryAttribute;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryAttributeRepository extends JpaRepository<CategoryAttribute, Long> {

    boolean existsByCategoryIdAndAttributeId(Long categoryId, Long attributeId);

    long countByCategoryId(Long categoryId);
}
