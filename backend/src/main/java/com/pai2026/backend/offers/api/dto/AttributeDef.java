package com.pai2026.backend.offers.api.dto;

public record AttributeDef(
        String code,
        String name,
        String dataType, // TEXT, NUMBER, BOOL
        String unit,
        boolean isVariantAxis,
        boolean filterable
) {}
