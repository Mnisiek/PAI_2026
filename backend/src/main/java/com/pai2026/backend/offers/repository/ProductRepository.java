package com.pai2026.backend.offers.repository;

import com.pai2026.backend.offers.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.brand LEFT JOIN FETCH p.category WHERE p.slug = :slug AND p.status = 'ACTIVE'")
    Optional<Product> findBySlugAndStatusActive(@Param("slug") String slug);
}
