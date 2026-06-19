package com.pai2026.backend.activity.persistence;

import com.pai2026.backend.activity.domain.ActivityEvent;
import jakarta.annotation.PreDestroy;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Async, batched sink for activity events. {@link #enqueue} is non-blocking
 * (the GraphQL request returns immediately); a single-threaded scheduled
 * {@link #flush} drains the buffer and batch-inserts into ClickHouse via Spring
 * JDBC, re-queuing a batch if the write fails rather than losing it.
 *
 * <p>The {@code activity_event} table is provisioned by the ClickHouse compose
 * init script — this writer only inserts.
 */
@Component
public class ActivityEventWriter {

    private static final Logger log = LoggerFactory.getLogger(ActivityEventWriter.class);
    private static final int MAX_BATCH = 500;

    private static final String INSERT_SQL = """
            INSERT INTO activity_event
                (ts, event_type, user_id, session_id, product_id, product_name, product_slug,
                 category_id, brand_id, brand_name, offer_id, sku, price, currency,
                 search_query, quantity, url, referrer, user_agent)
            VALUES (:ts, :eventType, :userId, :sessionId, :productId, :productName, :productSlug,
                    :categoryId, :brandId, :brandName, :offerId, :sku, :price, :currency,
                    :searchQuery, :quantity, :url, :referrer, :userAgent)
            """;

    private final NamedParameterJdbcTemplate clickHouseJdbc;
    private final Queue<ActivityEvent> buffer = new ConcurrentLinkedQueue<>();

    public ActivityEventWriter(@Qualifier("clickHouseJdbc") NamedParameterJdbcTemplate clickHouseJdbc) {
        this.clickHouseJdbc = clickHouseJdbc;
    }

    /** Non-blocking enqueue — the event is persisted by the background flusher. */
    public void enqueue(ActivityEvent event) {
        buffer.add(event);
    }

    @Scheduled(fixedDelayString = "${clickhouse.flush-interval-ms:1000}")
    void flush() {
        if (buffer.isEmpty()) {
            return;
        }
        List<ActivityEvent> batch = new ArrayList<>();
        ActivityEvent event;
        while (batch.size() < MAX_BATCH && (event = buffer.poll()) != null) {
            batch.add(event);
        }
        if (batch.isEmpty()) {
            return;
        }
        try {
            clickHouseJdbc.batchUpdate(INSERT_SQL, toParams(batch));
            log.debug("Flushed {} activity event(s) to ClickHouse", batch.size());
        } catch (DataAccessException e) {
            log.error("Failed to flush {} activity event(s) to ClickHouse: {}", batch.size(), e.getMessage());
            buffer.addAll(batch); // best-effort: re-queue for the next flush
        }
    }

    @PreDestroy
    void drainOnShutdown() {
        flush();
    }

    private static SqlParameterSource[] toParams(List<ActivityEvent> batch) {
        return batch.stream().map(ActivityEventWriter::toParams).toArray(SqlParameterSource[]::new);
    }

    private static SqlParameterSource toParams(ActivityEvent e) {
        return new MapSqlParameterSource()
                .addValue("ts", Timestamp.from(e.ts()))
                .addValue("eventType", e.type().name())
                .addValue("userId", e.userId())
                .addValue("sessionId", e.sessionId())
                .addValue("productId", e.productId())
                .addValue("productName", e.productName())
                .addValue("productSlug", e.productSlug())
                .addValue("categoryId", e.categoryId())
                .addValue("brandId", e.brandId())
                .addValue("brandName", e.brandName())
                .addValue("offerId", e.offerId())
                .addValue("sku", e.sku())
                .addValue("price", e.price())
                .addValue("currency", e.currency())
                .addValue("searchQuery", e.searchQuery())
                .addValue("quantity", e.quantity())
                .addValue("url", e.url())
                .addValue("referrer", e.referrer())
                .addValue("userAgent", e.userAgent());
    }
}
