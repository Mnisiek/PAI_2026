-- Runs once on ClickHouse first-init (mounted into /docker-entrypoint-initdb.d/).
-- Provisions the activity-event stream written to asynchronously by the backend.
CREATE TABLE IF NOT EXISTS activity_db.activity_event (
    ts            DateTime64(3),
    event_type    LowCardinality(String),
    user_id       Nullable(String),
    session_id    String,
    product_id    Nullable(Int64),
    product_name  Nullable(String),
    product_slug  Nullable(String),
    category_id   Nullable(Int64),
    brand_id      Nullable(Int64),
    brand_name    Nullable(String),
    offer_id      Nullable(Int64),
    sku           Nullable(String),
    price         Nullable(Decimal(12, 2)),
    currency      LowCardinality(Nullable(String)),
    search_query  Nullable(String),
    quantity      Nullable(Int32),
    url           Nullable(String),
    referrer      Nullable(String),
    user_agent    Nullable(String)
)
ENGINE = MergeTree
ORDER BY (event_type, ts)
PARTITION BY toYYYYMM(ts);
