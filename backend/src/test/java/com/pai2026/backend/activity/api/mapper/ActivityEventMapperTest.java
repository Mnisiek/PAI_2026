package com.pai2026.backend.activity.api.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.pai2026.backend.activity.api.dto.ActivityEventInput;
import com.pai2026.backend.activity.domain.ActivityEvent;
import com.pai2026.backend.activity.domain.ActivityEventType;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ActivityEventMapperTest {

    private static final Instant NOW = Instant.parse("2026-06-19T10:15:30Z");

    @Test
    void mapsEveryFieldAndParsesNumericIds() {
        ActivityEventInput input = new ActivityEventInput(
                "sess-1", "user-9", ActivityEventType.PURCHASE,
                "1", "iPhone 15", "iphone-15", "7", "3", "Apple",
                "12", "IP15-128-BLK", 3999.0, "PLN", null, 1,
                "/p/iphone-15", "/cart", "UA");

        ActivityEvent event = ActivityEventMapper.toEvent(input, NOW);

        assertEquals(NOW, event.ts());
        assertEquals(ActivityEventType.PURCHASE, event.type());
        assertEquals("user-9", event.userId());
        assertEquals("sess-1", event.sessionId());
        assertEquals(1L, event.productId());
        assertEquals("iPhone 15", event.productName());
        assertEquals(7L, event.categoryId());
        assertEquals(3L, event.brandId());
        assertEquals("Apple", event.brandName());
        assertEquals(12L, event.offerId());
        assertEquals(0, BigDecimal.valueOf(3999.0).compareTo(event.price()));
        assertEquals("PLN", event.currency());
        assertEquals(1, event.quantity());
    }

    @Test
    void leavesNullAndBlankIdsNull_andNullPrice() {
        ActivityEventInput input = new ActivityEventInput(
                "sess-1", null, ActivityEventType.SEARCH,
                null, null, null, "   ", null, null,
                null, null, null, null, "shoes", null, null, null, null);

        ActivityEvent event = ActivityEventMapper.toEvent(input, NOW);

        assertNull(event.productId());
        assertNull(event.categoryId());
        assertNull(event.price());
        assertEquals("shoes", event.searchQuery());
    }

    @Test
    void nonNumericIdBecomesNull() {
        ActivityEventInput input = new ActivityEventInput(
                "sess-1", null, ActivityEventType.VIEW,
                "abc", null, null, null, null, null,
                null, null, null, null, null, null, null, null, null);

        assertNull(ActivityEventMapper.toEvent(input, NOW).productId());
    }
}
