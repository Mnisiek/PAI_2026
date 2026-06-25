package com.pai2026.backend.offers.api.dto;

import java.util.List;

public record AddProductInput(
        String name,
        String description,
        String categoryId,
        Double price,
        String imageUrl,
        String brandName,
        String sku,
        Integer stock,
        List<AddOfferAttributeInput> attributes
) {}
