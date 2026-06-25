package com.pai2026.backend.offers.api.dto;

public record UpdateCategoryInput(
        String id,
        String name,
        String parentId
) {}
