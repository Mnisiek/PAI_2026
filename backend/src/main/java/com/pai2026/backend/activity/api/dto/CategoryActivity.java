package com.pai2026.backend.activity.api.dto;

/** Interaction count for a leaf category over a window. */
public record CategoryActivity(long categoryId, long count) {
}
