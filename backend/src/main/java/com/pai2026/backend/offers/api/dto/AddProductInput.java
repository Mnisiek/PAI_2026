package com.pai2026.backend.offers.api.dto;

public record AddProductInput(
        String name,
        String description,
        String categoryId,
        Double price,
        String imageUrl,
        String brandName,
        String sku,
        Integer stock
) {}
