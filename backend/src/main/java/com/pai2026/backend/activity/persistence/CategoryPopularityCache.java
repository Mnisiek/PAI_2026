package com.pai2026.backend.activity.persistence;

import com.pai2026.backend.activity.api.dto.CategoryActivity;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Popularity cache (Valkey), sourced from ClickHouse engagement. To keep
 * recommendations varied between users and refreshes, each key holds a large
 * pool (e.g. top 100) and callers receive a rotating random sample of it.
 *
 * Keys:
 *   popular:products:&lt;categoryId&gt;  — popular product ids within a category
 *   popular:categories               — popular category ids overall
 */
@Component
public class CategoryPopularityCache {

    private static final String PRODUCTS_KEY_PREFIX = "popular:products:";
    private static final String CATEGORIES_KEY = "popular:categories";

    private final StringRedisTemplate redis;
    private final ActivityEventReader activityEventReader;
    private final Duration ttl;
    private final int windowDays;
    private final int poolSize;

    public CategoryPopularityCache(
            StringRedisTemplate redis,
            ActivityEventReader activityEventReader,
            @Value("${popular.cache-ttl-minutes:60}") long ttlMinutes,
            @Value("${popular.window-days:30}") int windowDays,
            @Value("${popular.pool-size:100}") int poolSize) {
        this.redis = redis;
        this.activityEventReader = activityEventReader;
        this.ttl = Duration.ofMinutes(ttlMinutes);
        this.windowDays = windowDays;
        this.poolSize = poolSize;
    }

    /** A rotating random sample (size {@code limit}) of a category's popular products. */
    public List<Long> popularProductIds(Long categoryId, int limit) {
        List<Long> pool = cachedPool(PRODUCTS_KEY_PREFIX + categoryId, () -> {
            Instant to = Instant.now();
            return activityEventReader.topProductIdsByCategory(
                    categoryId, to.minus(windowDays, ChronoUnit.DAYS), to, poolSize);
        });
        return sample(pool, limit);
    }

    /** A rotating random sample (size {@code limit}) of the most popular categories. */
    public List<Long> popularCategoryIds(int limit) {
        List<Long> pool = cachedPool(CATEGORIES_KEY, () -> {
            Instant to = Instant.now();
            return activityEventReader
                    .topCategories(to.minus(windowDays, ChronoUnit.DAYS), to, poolSize)
                    .stream()
                    .map(CategoryActivity::categoryId)
                    .collect(Collectors.toList());
        });
        return sample(pool, limit);
    }

    // Caches the full popularity pool (up to poolSize). Rotation happens at read time.
    private List<Long> cachedPool(String key, Supplier<List<Long>> loader) {
        String cached = safeGet(key);
        if (cached != null) {
            return parseCsv(cached);
        }
        List<Long> ids = loader.get();
        safeSet(key, ids.stream().map(String::valueOf).collect(Collectors.joining(",")));
        return ids;
    }

    private List<Long> sample(List<Long> pool, int limit) {
        if (pool.size() <= limit) {
            return new ArrayList<>(pool);
        }
        List<Long> copy = new ArrayList<>(pool);
        Collections.shuffle(copy);
        return new ArrayList<>(copy.subList(0, limit));
    }

    private List<Long> parseCsv(String csv) {
        if (csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split(","))
                .filter(s -> !s.isBlank())
                .map(Long::valueOf)
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
