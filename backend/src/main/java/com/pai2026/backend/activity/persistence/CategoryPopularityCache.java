package com.pai2026.backend.activity.persistence;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Read-through cache (Valkey) for a category's popular product ids. The source of
 * truth is ClickHouse engagement counts; results are cached as a CSV of ids under
 * {@code popular:category:<id>} with a short TTL so the storefront stays snappy
 * without hammering the analytics store.
 */
@Component
public class CategoryPopularityCache {

    private static final String KEY_PREFIX = "popular:category:";

    private final StringRedisTemplate redis;
    private final ActivityEventReader activityEventReader;
    private final Duration ttl;
    private final int windowDays;

    public CategoryPopularityCache(
            StringRedisTemplate redis,
            ActivityEventReader activityEventReader,
            @Value("${popular.cache-ttl-minutes:60}") long ttlMinutes,
            @Value("${popular.window-days:30}") int windowDays) {
        this.redis = redis;
        this.activityEventReader = activityEventReader;
        this.ttl = Duration.ofMinutes(ttlMinutes);
        this.windowDays = windowDays;
    }

    /** Popular product ids for the category, most-popular first, capped at {@code limit}. */
    public List<Long> popularProductIds(Long categoryId, int limit) {
        String key = KEY_PREFIX + categoryId;

        String cached = safeGet(key);
        if (cached != null) {
            return parseCsv(cached, limit);
        }

        Instant to = Instant.now();
        Instant from = to.minus(windowDays, ChronoUnit.DAYS);
        List<Long> ids = activityEventReader.topProductIdsByCategory(categoryId, from, to, limit);

        safeSet(key, ids.stream().map(String::valueOf).collect(Collectors.joining(",")));
        return ids;
    }

    private List<Long> parseCsv(String csv, int limit) {
        if (csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split(","))
                .filter(s -> !s.isBlank())
                .map(Long::valueOf)
                .limit(limit)
                .collect(Collectors.toList());
    }

    // Valkey is best-effort: a cache outage must never break the storefront.
    private String safeGet(String key) {
        try {
            return redis.opsForValue().get(key);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private void safeSet(String key, String value) {
        try {
            redis.opsForValue().set(key, value, ttl);
        } catch (RuntimeException ex) {
            // ignore — cache write is non-critical
        }
    }
}
