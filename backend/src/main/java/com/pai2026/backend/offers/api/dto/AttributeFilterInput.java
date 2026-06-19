package com.pai2026.backend.offers.api.dto;

import java.util.List;

public record AttributeFilterInput(
        String code,
        List<String> values,
        Double min,
        Double max
) {}
