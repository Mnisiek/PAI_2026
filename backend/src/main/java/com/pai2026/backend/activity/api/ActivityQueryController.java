package com.pai2026.backend.activity.api;

import com.pai2026.backend.activity.api.dto.ActivityModuleQuery;
import com.pai2026.backend.activity.api.dto.ActivitySummary;
import com.pai2026.backend.activity.api.dto.CategoryActivity;
import com.pai2026.backend.activity.api.dto.DailyCount;
import com.pai2026.backend.activity.api.dto.EventTypeCount;
import com.pai2026.backend.activity.api.dto.ProductActivity;
import com.pai2026.backend.activity.service.ActivityAnalyticsService;
import java.time.Instant;
import java.util.List;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

/**
 * GraphQL read entry point for the activity module, namespaced under
 * {@code Query.activityModule}. Serves dashboard aggregates from ClickHouse.
 */
@Controller
public class ActivityQueryController {

    private final ActivityAnalyticsService analytics;

    public ActivityQueryController(ActivityAnalyticsService analytics) {
        this.analytics = analytics;
    }

    /** Resolves the {@code Query.activityModule} namespace field. */
    @QueryMapping
    public ActivityModuleQuery activityModule() {
        return new ActivityModuleQuery();
    }

    @SchemaMapping(typeName = "ActivityModuleQuery")
    public ActivitySummary summary(@Argument String from, @Argument String to) {
        return analytics.summary(parse(from), parse(to));
    }

    @SchemaMapping(typeName = "ActivityModuleQuery")
    public List<EventTypeCount> eventsByType(@Argument String from, @Argument String to) {
        return analytics.eventsByType(parse(from), parse(to));
    }

    @SchemaMapping(typeName = "ActivityModuleQuery")
    public List<ProductActivity> topProducts(@Argument String from, @Argument String to, @Argument int limit) {
        return analytics.topProducts(parse(from), parse(to), limit);
    }

    @SchemaMapping(typeName = "ActivityModuleQuery")
    public List<CategoryActivity> topCategories(@Argument String from, @Argument String to, @Argument int limit) {
        return analytics.topCategories(parse(from), parse(to), limit);
    }

    @SchemaMapping(typeName = "ActivityModuleQuery")
    public List<DailyCount> eventsPerDay(@Argument String from, @Argument String to) {
        return analytics.eventsPerDay(parse(from), parse(to));
    }

    /** ISO-8601 instant, or null (→ service default window). */
    private static Instant parse(String value) {
        return (value == null || value.isBlank()) ? null : Instant.parse(value);
    }
}
