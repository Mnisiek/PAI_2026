package com.pai2026.backend.activity.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

import com.pai2026.backend.infrastructure.api.ActivityEventController;
import com.pai2026.backend.infrastructure.service.ActivityEventService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.graphql.test.autoconfigure.GraphQlTest;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@GraphQlTest(ActivityEventController.class)
class ActivityEventControllerTest {

    @Autowired
    GraphQlTester graphQlTester;

    @MockitoBean
    ActivityEventService activityEventService;

    @Test
    void recordActivityEventAcknowledgesAndDelegates() {
        String mutation = """
                mutation {
                  activityModule {
                    recordActivityEvent(input: {
                      sessionId: "sess-1", userId: "user-9", type: VIEW,
                      productId: "1", categoryId: "7"
                    }) {
                      accepted
                      receivedAt
                    }
                  }
                }
                """;

        graphQlTester.document(mutation)
                .execute()
                .path("activityModule.recordActivityEvent.accepted").entity(Boolean.class).isEqualTo(true);

        verify(activityEventService).ingest(any());
    }
}
