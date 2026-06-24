package com.pai2026.backend.offers.api.dto;

import java.util.List;

public record Facet(
        String code,
        String name,
        String dataType, // TEXT, NUMBER, BOOL
        String unit,
        List<FacetOption> options,
        Double min,
        Double max
) {}
