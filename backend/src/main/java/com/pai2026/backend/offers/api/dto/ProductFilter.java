package com.pai2026.backend.offers.api.dto;

import java.util.List;

public record ProductFilter(
        String categorySlug,
        List<String> brandSlugs,
        Double priceMin,
        Double priceMax,
        Boolean inStock,
        List<AttributeFilterInput> attributes
) {}
