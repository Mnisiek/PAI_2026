package com.pai2026.backend.activity.api.dto;

/** Interaction count for a product over a window (with its snapshot name). */
public record ProductActivity(long productId, String productName, long count) {
}
