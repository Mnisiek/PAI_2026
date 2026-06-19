package com.pai2026.backend.activity.domain;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Normalized activity event ready for the ClickHouse sink: catalog ids as
 * numbers, price as {@link BigDecimal}, and a server-stamped {@code ts}.
 *
 * <p>Pure domain model — mapping from the GraphQL input lives in the api layer.
 */
public record ActivityEvent(
        Instant ts,
        ActivityEventType type,
        String userId,
        String sessionId,
        Long productId,
        String productName,
        String productSlug,
        Long categoryId,
        Long brandId,
        String brandName,
        Long offerId,
        String sku,
        BigDecimal price,
        String currency,
        String searchQuery,
        Integer quantity,
        String url,
        String referrer,
        String userAgent) {
}
