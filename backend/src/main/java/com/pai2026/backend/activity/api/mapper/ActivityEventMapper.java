package com.pai2026.backend.activity.api.mapper;

import com.pai2026.backend.activity.api.dto.ActivityEventInput;
import com.pai2026.backend.activity.domain.ActivityEvent;
import java.math.BigDecimal;
import java.time.Instant;

/** Maps the GraphQL {@link ActivityEventInput} into the domain {@link ActivityEvent}. */
public final class ActivityEventMapper {

    private ActivityEventMapper() {
    }

    /** Normalize a client-supplied input into a storable event stamped at {@code now}. */
    public static ActivityEvent toEvent(ActivityEventInput in, Instant now) {
        return new ActivityEvent(
                now,
                in.type(),
                in.userId(),
                in.sessionId(),
                parseLong(in.productId()),
                in.productName(),
                in.productSlug(),
                parseLong(in.categoryId()),
                parseLong(in.brandId()),
                in.brandName(),
                parseLong(in.offerId()),
                in.sku(),
                in.price() == null ? null : BigDecimal.valueOf(in.price()),
                in.currency(),
                in.searchQuery(),
                in.quantity(),
                in.url(),
                in.referrer(),
                in.userAgent());
    }

    private static Long parseLong(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
