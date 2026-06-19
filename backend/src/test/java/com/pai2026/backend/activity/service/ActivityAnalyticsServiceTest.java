package com.pai2026.backend.activity.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pai2026.backend.activity.api.dto.ActivitySummary;
import com.pai2026.backend.activity.persistence.ActivityEventReader;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ActivityAnalyticsServiceTest {

    @Mock
    ActivityEventReader reader;

    @InjectMocks
    ActivityAnalyticsService service;

    @Test
    void passesAnExplicitWindowStraightThrough() {
        Instant from = Instant.parse("2026-06-01T00:00:00Z");
        Instant to = Instant.parse("2026-06-02T00:00:00Z");
        when(reader.summary(from, to)).thenReturn(new ActivitySummary(0, 0, 0));

        service.summary(from, to);

        verify(reader).summary(from, to);
    }

    @Test
    void defaultsToTheLast30DaysWhenBoundsAreNull() {
        when(reader.summary(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(new ActivitySummary(0, 0, 0));
        ArgumentCaptor<Instant> from = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> to = ArgumentCaptor.forClass(Instant.class);

        service.summary(null, null);

        verify(reader).summary(from.capture(), to.capture());
        assertEquals(30, Duration.between(from.getValue(), to.getValue()).toDays());
    }
}
