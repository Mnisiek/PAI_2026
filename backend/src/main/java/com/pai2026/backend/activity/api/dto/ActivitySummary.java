package com.pai2026.backend.activity.api.dto;

/** Dashboard totals over a time window. */
public record ActivitySummary(long totalEvents, long uniqueSessions, long uniqueUsers) {
}
