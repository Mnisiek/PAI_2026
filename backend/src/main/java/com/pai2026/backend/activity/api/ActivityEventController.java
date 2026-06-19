package com.pai2026.backend.activity.api;

import com.pai2026.backend.activity.api.dto.ActivityEventAck;
import com.pai2026.backend.activity.api.dto.ActivityEventInput;
import com.pai2026.backend.activity.api.dto.ActivityModuleMutation;
import com.pai2026.backend.activity.api.mapper.ActivityEventMapper;
import com.pai2026.backend.activity.service.ActivityEventService;
import java.time.Instant;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

/**
 * GraphQL entry point for the activity module, namespaced under
 * {@code Mutation.activityModule}. Events are accepted and acknowledged
 * immediately; the heavy lifting (async ClickHouse write + Redis retargeting)
 * is handled by {@link ActivityEventService}.
 */
@Controller
public class ActivityEventController {

    private final ActivityEventService activityEventService;

    public ActivityEventController(ActivityEventService activityEventService) {
        this.activityEventService = activityEventService;
    }

    /** Resolves the {@code Mutation.activityModule} namespace field. */
    @MutationMapping
    public ActivityModuleMutation activityModule() {
        return new ActivityModuleMutation();
    }

    /** Buffers the event for background persistence and acknowledges right away. */
    @SchemaMapping(typeName = "ActivityModuleMutation")
    public ActivityEventAck recordActivityEvent(@Argument ActivityEventInput input) {
        Instant receivedAt = Instant.now();
        activityEventService.ingest(ActivityEventMapper.toEvent(input, receivedAt));
        return new ActivityEventAck(true, receivedAt.toString());
    }
}
