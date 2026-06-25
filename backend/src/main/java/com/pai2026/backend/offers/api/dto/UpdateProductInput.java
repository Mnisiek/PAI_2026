package com.pai2026.backend.offers.api.dto;

public record UpdateProductInput(
        String id,
        String name,
        String description,
        String categoryId,
        String brandName,
        String imageUrl
) {}
