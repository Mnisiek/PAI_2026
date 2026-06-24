package com.pai2026.backend.user.api.dto;

public record AuthPayload(String token, UserDto user) {}
