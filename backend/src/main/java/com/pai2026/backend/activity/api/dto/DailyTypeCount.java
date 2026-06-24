package com.pai2026.backend.activity.api.dto;

/** Event count for a single UTC day and event type, for multi-series charts. */
public record DailyTypeCount(String day, String type, long count) {
}
