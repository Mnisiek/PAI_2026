package com.pai2026.backend.offers.repository;

import com.pai2026.backend.offers.domain.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    Optional<Brand> findBySlugAndIsActiveTrue(String slug);
}
