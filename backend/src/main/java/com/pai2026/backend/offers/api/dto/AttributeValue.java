package com.pai2026.backend.offers.api.dto;

public record AttributeValue(
        String code,
        String name,
        String dataType, // TEXT, NUMBER, BOOL
        String unit,
        String textValue,
        Double numValue,
        Boolean boolValue
) {}
