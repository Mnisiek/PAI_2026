package com.pai2026.backend.offers.api.dto;

/** A filter (attribute) the admin declares as available for a category. */
public record CategoryAttributeInput(
        String name,
        String dataType,
        String unit
) {}
