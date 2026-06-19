package com.pai2026.backend.offers.api.dto;

import com.pai2026.backend.offers.domain.Product;
import java.util.List;

public record ProductPage(
        List<Product> items,
        long total,
        int page,
        int size,
        boolean hasNext
) {}
