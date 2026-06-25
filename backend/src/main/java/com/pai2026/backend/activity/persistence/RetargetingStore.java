package com.pai2026.backend.activity.persistence;

import com.pai2026.backend.activity.domain.ActivityEvent;
import com.pai2026.backend.activity.domain.ActivityEventType;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
 * {@code category:<id>} / {@code product:<id>} mapped to the latest meaningful
 * event as {@code <EVENT_TYPE>:<epochMillis>}. Only product-detail views, cart
 * adds and purchases are recorded — searches and plain clicks are ignored. A
 * single {@code HGETALL} yields the user's whole retargeting profile.
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

    // Only product-detail views, cart adds and purchases are meaningful retargeting signals.
    private static final Set<ActivityEventType> RETARGETING_TYPES =
            EnumSet.of(ActivityEventType.PRODUCT_DETAIL, ActivityEventType.ADD_TO_CART, ActivityEventType.PURCHASE);

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
        if (!RETARGETING_TYPES.contains(event.type())) {
            return;
        }
        String subject = subjectOf(event);
        if (subject == null) {
            return;
        }
        String key = KEY_PREFIX + subject;
        // Records WHAT happened and WHEN, e.g. "PURCHASE:1718800000000" (latest event wins).
        String value = event.type().name() + ":" + event.ts().toEpochMilli();
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
                redis.opsForHash().put(key, field, value);
            }
            // Per-field TTL (HEXPIRE): each interest ages out independently of the rest.
            redis.opsForHash().expire(key, ttl, touchedFields);
        } catch (DataAccessException e) {
            log.warn("Skipped retargeting update for {} (Valkey unavailable): {}", subject, e.getMessage());
        }
    }

    public record RetargetingSignal(String targetType, Long targetId, String eventType, java.time.Instant timestamp) {}

    public List<RetargetingSignal> getSignals(String userId, String sessionId) {
        String subject = null;
        if (userId != null && !userId.isBlank()) {
            subject = "user:" + userId;
        } else if (sessionId != null && !sessionId.isBlank()) {
            subject = "sess:" + sessionId;
        }

        if (subject == null) {
            return Collections.emptyList();
        }

        String key = KEY_PREFIX + subject;
        try {
            Map<Object, Object> entries = redis.opsForHash().entries(key);
            if (entries == null || entries.isEmpty()) {
                return Collections.emptyList();
            }

            List<RetargetingSignal> signals = new ArrayList<>();
            for (Map.Entry<Object, Object> entry : entries.entrySet()) {
                String field = (String) entry.getKey();
                String val = (String) entry.getValue();

                if (field == null || val == null) {
                    continue;
                }

                String[] valParts = val.split(":");
                if (valParts.length < 2) {
                    continue;
                }

                String eventType = valParts[0];
                long timestamp;
                try {
                    timestamp = Long.parseLong(valParts[1]);
                } catch (NumberFormatException e) {
                    continue;
                }

                String[] fieldParts = field.split(":");
                if (fieldParts.length < 2) {
                    continue;
                }
                String targetType = fieldParts[0];
                String targetIdStr = fieldParts[1];
                long targetId;
                try {
                    targetId = Long.parseLong(targetIdStr);
                } catch (NumberFormatException e) {
                    continue;
                }

                signals.add(new RetargetingSignal(targetType, targetId, eventType, java.time.Instant.ofEpochMilli(timestamp)));
            }

            // Sort by timestamp desc (most recent first)
            signals.sort((a, b) -> b.timestamp().compareTo(a.timestamp()));
            return signals;
        } catch (Exception e) {
            log.warn("Failed to retrieve retargeting signals for {}: {}", subject, e.getMessage());
            return Collections.emptyList();
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
