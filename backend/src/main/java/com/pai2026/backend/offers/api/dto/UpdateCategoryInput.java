package com.pai2026.backend.offers.api.dto;

import java.util.List;

public record UpdateCategoryInput(
        String id,
        String name,
        String parentId,
        List<CategoryAttributeInput> attributes
) {}
