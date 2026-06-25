package com.pai2026.backend.activity.service;

import static org.mockito.Mockito.verify;

import com.pai2026.backend.activity.domain.ActivityEvent;
import com.pai2026.backend.infrastructure.service.ActivityEventService;
import com.pai2026.backend.activity.domain.ActivityEventType;
import com.pai2026.backend.activity.persistence.ActivityEventWriter;
import com.pai2026.backend.activity.persistence.RetargetingStore;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ActivityEventServiceTest {

    @Mock
    ActivityEventWriter writer;

    @Mock
    RetargetingStore retargetingStore;

    @InjectMocks
    ActivityEventService service;

    @Test
    void ingestFansOutToBothSinks() {
        ActivityEvent event = new ActivityEvent(
                Instant.parse("2026-06-19T10:00:00Z"), ActivityEventType.VIEW,
                "user-1", "sess-1", 1L, "iPhone 15", "iphone-15", 7L, 3L, "Apple",
                12L, "IP15", null, "PLN", null, null, "/p/iphone-15", null, "UA");

        service.ingest(event);

        verify(writer).enqueue(event);
        verify(retargetingStore).record(event);
    }
}
