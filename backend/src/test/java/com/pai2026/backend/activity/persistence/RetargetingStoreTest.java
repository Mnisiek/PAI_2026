package com.pai2026.backend.activity.persistence;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.pai2026.backend.activity.domain.ActivityEvent;
import com.pai2026.backend.activity.domain.ActivityEventType;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

@ExtendWith(MockitoExtension.class)
class RetargetingStoreTest {

    @Mock
    StringRedisTemplate redis;

    @Mock
    HashOperations<String, Object, Object> hashOps;

    private ActivityEvent event(String userId, String sessionId, Long categoryId, Long productId) {
        return new ActivityEvent(
                Instant.parse("2026-06-19T10:00:00Z"), ActivityEventType.VIEW,
                userId, sessionId, productId, "iPhone 15", "iphone-15", categoryId, 3L, "Apple",
                12L, "IP15", null, "PLN", null, null, "/p/iphone-15", null, "UA");
    }

    @Test
    void writesCategoryAndProductFieldsUnderTheUserHashWithTtl() {
        doReturn(hashOps).when(redis).opsForHash();
        RetargetingStore store = new RetargetingStore(redis, 30);

        store.record(event("user-9", "sess-1", 7L, 1L));

        String key = "retarget:user:user-9";
        verify(hashOps).put(eq(key), eq("category:7"), anyString());
        verify(hashOps).put(eq(key), eq("product:1"), anyString());
        verify(hashOps).expire(eq(key), eq(Duration.ofDays(30)), any());
    }

    @Test
    void fallsBackToTheSessionWhenThereIsNoUser() {
        doReturn(hashOps).when(redis).opsForHash();
        RetargetingStore store = new RetargetingStore(redis, 30);

        store.record(event(null, "sess-1", 7L, null));

        verify(hashOps).put(eq("retarget:sess:sess-1"), eq("category:7"), anyString());
    }

    @Test
    void skipsWhenNoSubjectCanBeResolved() {
        RetargetingStore store = new RetargetingStore(redis, 30);

        store.record(event(null, null, 7L, 1L));

        verify(redis, never()).opsForHash();
    }

    @Test
    void skipsWhenEventCarriesNoCategoryOrProduct() {
        RetargetingStore store = new RetargetingStore(redis, 30);

        store.record(event("user-9", "sess-1", null, null));

        verify(redis, never()).opsForHash();
    }
}
