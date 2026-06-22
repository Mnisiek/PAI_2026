package com.pai2026.backend.activity.persistence;

import com.pai2026.backend.activity.api.dto.ActivitySummary;
import com.pai2026.backend.activity.api.dto.CategoryActivity;
import com.pai2026.backend.activity.api.dto.DailyCount;
import com.pai2026.backend.activity.api.dto.DailyTypeCount;
import com.pai2026.backend.activity.api.dto.EventTypeCount;
import com.pai2026.backend.activity.api.dto.ProductActivity;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

/** Reads dashboard aggregates from the ClickHouse {@code activity_event} stream. */
@Component
public class ActivityEventReader {

    private static final String SUMMARY_SQL = """
            SELECT count()           AS total_events,
                   uniq(session_id)  AS unique_sessions,
                   uniq(user_id)     AS unique_users
            FROM activity_event
            WHERE ts >= :from AND ts < :to
            """;

    private static final String EVENTS_BY_TYPE_SQL = """
            SELECT event_type AS type, count() AS count
            FROM activity_event
            WHERE ts >= :from AND ts < :to
            GROUP BY event_type
            ORDER BY count DESC
            """;

    private static final String TOP_PRODUCTS_SQL = """
            SELECT product_id, any(product_name) AS product_name, count() AS count
            FROM activity_event
            WHERE ts >= :from AND ts < :to AND product_id IS NOT NULL
            GROUP BY product_id
            ORDER BY count DESC
            LIMIT :limit
            """;

    private static final String TOP_CATEGORIES_SQL = """
            SELECT category_id, count() AS count
            FROM activity_event
            WHERE ts >= :from AND ts < :to AND category_id IS NOT NULL
            GROUP BY category_id
            ORDER BY count DESC
            LIMIT :limit
            """;

    private static final String EVENTS_PER_DAY_SQL = """
            SELECT toString(toDate(ts)) AS day, count() AS count
            FROM activity_event
            WHERE ts >= :from AND ts < :to
            GROUP BY day
            ORDER BY day
            """;

    private static final String EVENTS_PER_DAY_BY_TYPE_SQL = """
            SELECT toString(toDate(ts)) AS day, event_type AS type, count() AS count
            FROM activity_event
            WHERE ts >= :from AND ts < :to
            GROUP BY day, event_type
            ORDER BY day, event_type
            """;

    private final NamedParameterJdbcTemplate clickHouseJdbc;

    public ActivityEventReader(@Qualifier("clickHouseJdbc") NamedParameterJdbcTemplate clickHouseJdbc) {
        this.clickHouseJdbc = clickHouseJdbc;
    }

    public ActivitySummary summary(Instant from, Instant to) {
        return clickHouseJdbc.queryForObject(SUMMARY_SQL, window(from, to), (rs, n) ->
                new ActivitySummary(
                        rs.getLong("total_events"),
                        rs.getLong("unique_sessions"),
                        rs.getLong("unique_users")));
    }

    public List<EventTypeCount> eventsByType(Instant from, Instant to) {
        return clickHouseJdbc.query(EVENTS_BY_TYPE_SQL, window(from, to), (rs, n) ->
                new EventTypeCount(rs.getString("type"), rs.getLong("count")));
    }

    public List<ProductActivity> topProducts(Instant from, Instant to, int limit) {
        return clickHouseJdbc.query(TOP_PRODUCTS_SQL, window(from, to).addValue("limit", limit), (rs, n) ->
                new ProductActivity(rs.getLong("product_id"), rs.getString("product_name"), rs.getLong("count")));
    }

    public List<CategoryActivity> topCategories(Instant from, Instant to, int limit) {
        return clickHouseJdbc.query(TOP_CATEGORIES_SQL, window(from, to).addValue("limit", limit), (rs, n) ->
                new CategoryActivity(rs.getLong("category_id"), rs.getLong("count")));
    }

    public List<DailyCount> eventsPerDay(Instant from, Instant to) {
        return clickHouseJdbc.query(EVENTS_PER_DAY_SQL, window(from, to), (rs, n) ->
                new DailyCount(rs.getString("day"), rs.getLong("count")));
    }

    public List<DailyTypeCount> eventsPerDayByType(Instant from, Instant to) {
        return clickHouseJdbc.query(EVENTS_PER_DAY_BY_TYPE_SQL, window(from, to), (rs, n) ->
                new DailyTypeCount(rs.getString("day"), rs.getString("type"), rs.getLong("count")));
    }

    private static MapSqlParameterSource window(Instant from, Instant to) {
        return new MapSqlParameterSource()
                .addValue("from", Timestamp.from(from))
                .addValue("to", Timestamp.from(to));
    }
}
