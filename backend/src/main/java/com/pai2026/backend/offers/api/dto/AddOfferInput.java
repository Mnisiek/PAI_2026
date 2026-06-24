package com.pai2026.backend.offers.api.dto;

import java.util.List;

public record AddOfferInput(
        String productId,
        String sku,
        Double price,
        Integer stock,
        String attributeName,
        String attributeValue,
        List<AddOfferAttributeInput> attributes
) {}
