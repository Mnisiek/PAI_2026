package com.pai2026.backend.offers.api.dto;

import java.math.BigDecimal;

public record Money(double amount, String currency) {
    public Money(BigDecimal amount, String currency) {
        this(amount != null ? amount.doubleValue() : 0.0, currency);
    }
}
