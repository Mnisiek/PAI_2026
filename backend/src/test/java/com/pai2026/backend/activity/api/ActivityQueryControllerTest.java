package com.pai2026.backend.activity.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.pai2026.backend.activity.api.dto.ActivitySummary;
import com.pai2026.backend.activity.api.dto.EventTypeCount;
import com.pai2026.backend.activity.service.ActivityAnalyticsService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.graphql.test.autoconfigure.GraphQlTest;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@GraphQlTest(ActivityQueryController.class)
@org.springframework.context.annotation.Import(com.pai2026.backend.config.SecurityConfig.class)
class ActivityQueryControllerTest {

    @Autowired
    GraphQlTester graphQlTester;

    @MockitoBean
    ActivityAnalyticsService analytics;

    @MockitoBean
    com.pai2026.backend.config.JwtFilter jwtFilter;

    @Test
    @WithMockUser(roles = "ADMIN")
    void summaryReturnsTotals() {
        when(analytics.summary(any(), any())).thenReturn(new ActivitySummary(42, 10, 7));

        graphQlTester.document("{ activityModule { summary { totalEvents uniqueSessions uniqueUsers } } }")
                .execute()
                .path("activityModule.summary.totalEvents").entity(Integer.class).isEqualTo(42);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void eventsByTypeReturnsRows() {
        when(analytics.eventsByType(any(), any()))
                .thenReturn(List.of(new EventTypeCount("VIEW", 5), new EventTypeCount("PURCHASE", 2)));

        graphQlTester.document("{ activityModule { eventsByType { type count } } }")
                .execute()
                .path("activityModule.eventsByType[0].type").entity(String.class).isEqualTo("VIEW");
    }
}
