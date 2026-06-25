package com.pai2026.backend.offers.api.dto;

import java.util.List;

public record UpdateOfferInput(
        String id,
        Double price,
        Integer stock,
        List<AddOfferAttributeInput> attributes,
        List<String> images
) {}
