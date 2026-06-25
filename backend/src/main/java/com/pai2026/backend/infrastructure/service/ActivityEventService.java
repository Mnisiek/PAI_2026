package com.pai2026.backend.infrastructure.service;

import com.pai2026.backend.activity.domain.ActivityEvent;
import com.pai2026.backend.activity.persistence.ActivityEventWriter;
import com.pai2026.backend.activity.persistence.RetargetingStore;
import org.springframework.stereotype.Service;

/**
 * Orchestrates ingestion of an activity event across its sinks: the durable
 * ClickHouse event log (async) and the hot Redis retargeting state. Keeps the
 * GraphQL controller thin.
 */
@Service
public class ActivityEventService {

    private final ActivityEventWriter writer;
    private final RetargetingStore retargetingStore;

    public ActivityEventService(ActivityEventWriter writer, RetargetingStore retargetingStore) {
        this.writer = writer;
        this.retargetingStore = retargetingStore;
    }

    /** Accept an event: queue it for ClickHouse and refresh the user's retargeting state. */
    public void ingest(ActivityEvent event) {
        writer.enqueue(event);          // async, batched → ClickHouse
        retargetingStore.record(event); // best-effort → Redis
    }
}
