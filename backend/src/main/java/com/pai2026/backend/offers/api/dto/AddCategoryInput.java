package com.pai2026.backend.offers.api.dto;

public record AddCategoryInput(
        String name,
        String parentId
) {}
