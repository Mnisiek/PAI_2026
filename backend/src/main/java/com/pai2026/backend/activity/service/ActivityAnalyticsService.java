package com.pai2026.backend.activity.service;

import com.pai2026.backend.activity.api.dto.ActivitySummary;
import com.pai2026.backend.activity.api.dto.CategoryActivity;
import com.pai2026.backend.activity.api.dto.DailyCount;
import com.pai2026.backend.activity.api.dto.EventTypeCount;
import com.pai2026.backend.activity.api.dto.ProductActivity;
import com.pai2026.backend.activity.persistence.ActivityEventReader;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Dashboard analytics over the activity event stream. Resolves an open window:
 * a null {@code to} means "now", a null {@code from} means {@value #DEFAULT_DAYS}
 * days before {@code to}.
 */
@Service
public class ActivityAnalyticsService {

    private static final long DEFAULT_DAYS = 30;

    private final ActivityEventReader reader;

    public ActivityAnalyticsService(ActivityEventReader reader) {
        this.reader = reader;
    }

    public ActivitySummary summary(Instant from, Instant to) {
        Instant end = end(to);
        return reader.summary(start(from, end), end);
    }

    public List<EventTypeCount> eventsByType(Instant from, Instant to) {
        Instant end = end(to);
        return reader.eventsByType(start(from, end), end);
    }

    public List<ProductActivity> topProducts(Instant from, Instant to, int limit) {
        Instant end = end(to);
        return reader.topProducts(start(from, end), end, limit);
    }

    public List<CategoryActivity> topCategories(Instant from, Instant to, int limit) {
        Instant end = end(to);
        return reader.topCategories(start(from, end), end, limit);
    }

    public List<DailyCount> eventsPerDay(Instant from, Instant to) {
        Instant end = end(to);
        return reader.eventsPerDay(start(from, end), end);
    }

    private static Instant end(Instant to) {
        return to != null ? to : Instant.now();
    }

    private static Instant start(Instant from, Instant end) {
        return from != null ? from : end.minus(Duration.ofDays(DEFAULT_DAYS));
    }
}
