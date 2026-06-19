package com.pai2026.backend.activity.api.dto;

/** GraphQL {@code ActivityEventAck} — returned immediately; persistence is async. */
public record ActivityEventAck(boolean accepted, String receivedAt) {
}
