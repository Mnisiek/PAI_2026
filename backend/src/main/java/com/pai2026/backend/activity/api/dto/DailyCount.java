package com.pai2026.backend.activity.api.dto;

/** Event count for a single UTC day, for time-series charts. */
public record DailyCount(String day, long count) {
}
