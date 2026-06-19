package com.pai2026.backend.activity.domain;

/** Kind of user activity. Stored as a LowCardinality(String) in ClickHouse. */
public enum ActivityEventType {
    VIEW,
    CLICK,
    ADD_TO_CART,
    PURCHASE,
    SEARCH,
    PRODUCT_DETAIL
}
