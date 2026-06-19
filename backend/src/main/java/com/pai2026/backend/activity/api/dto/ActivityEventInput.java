package com.pai2026.backend.activity.api.dto;

import com.pai2026.backend.activity.domain.ActivityEventType;

/** GraphQL {@code ActivityEventInput} — the raw event as sent by a client. */
public record ActivityEventInput(
        String sessionId,
        String userId,
        ActivityEventType type,
        String productId,
        String productName,
        String productSlug,
        String categoryId,
        String brandId,
        String brandName,
        String offerId,
        String sku,
        Double price,
        String currency,
        String searchQuery,
        Integer quantity,
        String url,
        String referrer,
        String userAgent) {
}
