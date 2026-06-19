package com.pai2026.backend.activity.persistence;

import com.pai2026.backend.activity.domain.ActivityEvent;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Maintains hot user-retargeting state in Valkey as one hash per subject
 * (logged-in user, or else the session): {@code retarget:<subject>} with fields
 * {@code category:<id>} / {@code product:<id>} mapped to the last-interaction
 * timestamp. A single {@code HGETALL} yields the user's whole retargeting
 * profile, sortable by recency.
 *
 * <p>Each field carries its own TTL ({@code HEXPIRE}, Valkey 9.0+), so an
 * interest ages out independently of the rest of the profile; the key is
 * dropped once its last field expires.
 *
 * <p>Runs {@link Async} (off the request thread) and is best-effort — a Valkey
 * outage never fails event ingestion.
 */
@Component
public class RetargetingStore {

    private static final Logger log = LoggerFactory.getLogger(RetargetingStore.class);
    private static final String KEY_PREFIX = "retarget:";

    private final StringRedisTemplate redis;
    private final Duration ttl;

    public RetargetingStore(
            StringRedisTemplate redis,
            @Value("${retargeting.ttl-days:30}") long ttlDays) {
        this.redis = redis;
        this.ttl = Duration.ofDays(ttlDays);
    }

    /** Record the event's category/product interest into the subject's hash, scored by recency. */
    @Async
    public void record(ActivityEvent event) {
        String subject = subjectOf(event);
        if (subject == null) {
            return;
        }
        String key = KEY_PREFIX + subject;
        String lastSeen = Long.toString(event.ts().toEpochMilli());
        List<Object> touchedFields = new ArrayList<>(2);
        if (event.categoryId() != null) {
            touchedFields.add("category:" + event.categoryId());
        }
        if (event.productId() != null) {
            touchedFields.add("product:" + event.productId());
        }
        if (touchedFields.isEmpty()) {
            return;
        }
        try {
            for (Object field : touchedFields) {
                redis.opsForHash().put(key, field, lastSeen);
            }
            // Per-field TTL (HEXPIRE): each interest ages out independently of the rest.
            redis.opsForHash().expire(key, ttl, touchedFields);
        } catch (DataAccessException e) {
            log.warn("Skipped retargeting update for {} (Valkey unavailable): {}", subject, e.getMessage());
        }
    }

    /** Logged-in user takes precedence; fall back to the anonymous session. */
    private static String subjectOf(ActivityEvent event) {
        if (event.userId() != null && !event.userId().isBlank()) {
            return "user:" + event.userId();
        }
        if (event.sessionId() != null && !event.sessionId().isBlank()) {
            return "sess:" + event.sessionId();
        }
        return null;
    }
}
