package com.pai2026.backend.offers.repository;

import com.pai2026.backend.offers.domain.Attribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AttributeRepository extends JpaRepository<Attribute, Long> {
    Optional<Attribute> findByCode(String code);
    boolean existsByCode(String code);
}
