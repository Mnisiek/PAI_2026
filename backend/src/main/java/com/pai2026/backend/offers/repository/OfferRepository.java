package com.pai2026.backend.offers.repository;

import com.pai2026.backend.offers.domain.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByProductIdInAndStatus(List<Long> productIds, String status);
    List<Offer> findByProductIdOrderById(Long productId);
    boolean existsBySku(String sku);
}
