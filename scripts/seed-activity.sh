#!/usr/bin/env bash
#
# Seeds activity demo data into ClickHouse (the event stream) and Valkey (the
# retargeting hashes). Idempotent: it (re)creates the schema, truncates, then
# loads a fresh fixture. Run with the Docker stack up: `docker compose up -d`.
#
# Usage: scripts/seed-activity.sh
set -euo pipefail

CH_CONTAINER="${CH_CONTAINER:-pai-clickhouse}"
VK_CONTAINER="${VK_CONTAINER:-pai-valkey}"
CH_USER="${CH_USER:-user}"
CH_PASS="${CH_PASS:-password}"
CH_DB="${CH_DB:-activity_db}"
TTL_SECONDS="${TTL_SECONDS:-2592000}" # 30 days

ch() { docker exec -i "$CH_CONTAINER" clickhouse-client --user "$CH_USER" --password "$CH_PASS" --multiquery; }
vk() { docker exec -i "$VK_CONTAINER" valkey-cli "$@" >/dev/null; }

NOW_MS=$(( $(date +%s) * 1000 ))
DAY_MS=86400000

echo "==> ClickHouse: schema, reset & seed (db=${CH_DB})"
ch <<SQL
CREATE DATABASE IF NOT EXISTS ${CH_DB};

CREATE TABLE IF NOT EXISTS ${CH_DB}.activity_event (
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
) ENGINE = MergeTree ORDER BY (event_type, ts) PARTITION BY toYYYYMM(ts);

TRUNCATE TABLE ${CH_DB}.activity_event;

INSERT INTO ${CH_DB}.activity_event
    (ts, event_type, user_id, session_id, product_id, product_name, product_slug,
     category_id, brand_id, brand_name, offer_id, sku, price, currency,
     search_query, quantity, url, referrer, user_agent) VALUES
-- user-1042: browses, carts and buys an iPhone (today)
(now() - INTERVAL 10 MINUTE, 'VIEW',        'user-1042', 'sess-a1', 1, 'iPhone 15', 'iphone-15', 7, 3, 'Apple',   12, 'IP15-128-BLK', 3999.00, 'PLN', NULL, NULL, '/p/iphone-15',     '/c/phones',     'Mozilla/5.0'),
(now() - INTERVAL 8  MINUTE, 'CLICK',       'user-1042', 'sess-a1', 1, 'iPhone 15', 'iphone-15', 7, 3, 'Apple',   12, 'IP15-128-BLK', 3999.00, 'PLN', NULL, NULL, '/p/iphone-15',     '/p/iphone-15',  'Mozilla/5.0'),
(now() - INTERVAL 7  MINUTE, 'ADD_TO_CART', 'user-1042', 'sess-a1', 1, 'iPhone 15', 'iphone-15', 7, 3, 'Apple',   12, 'IP15-128-BLK', 3999.00, 'PLN', NULL, 1,    '/p/iphone-15',     '/p/iphone-15',  'Mozilla/5.0'),
(now() - INTERVAL 5  MINUTE, 'PURCHASE',    'user-1042', 'sess-a1', 1, 'iPhone 15', 'iphone-15', 7, 3, 'Apple',   12, 'IP15-128-BLK', 3999.00, 'PLN', NULL, 1,    '/checkout/success','/cart',         'Mozilla/5.0'),
(now() - INTERVAL 1  DAY,    'VIEW',        'user-1042', 'sess-a1', 5, 'Galaxy S24','galaxy-s24',7, 4, 'Samsung', 31, 'SGS24-256',    3499.00, 'PLN', NULL, NULL, '/p/galaxy-s24',    '/c/phones',     'Mozilla/5.0'),
-- user-2087: phones + audio, plus a search
(now() - INTERVAL 2  HOUR,   'VIEW',        'user-2087', 'sess-b2', 5, 'Galaxy S24','galaxy-s24',7, 4, 'Samsung', 31, 'SGS24-256',    3499.00, 'PLN', NULL, NULL, '/p/galaxy-s24',    '/c/phones',     'Mozilla/5.0'),
(now() - INTERVAL 1  DAY,    'SEARCH',      'user-2087', 'sess-b2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'wireless earbuds', NULL, '/search?q=wireless+earbuds', NULL, 'Mozilla/5.0'),
(now() - INTERVAL 3  DAY,    'VIEW',        'user-2087', 'sess-b2', 8, 'AirPods Pro','airpods-pro',8, 3, 'Apple',  40, 'APP-2',        1099.00, 'PLN', NULL, NULL, '/p/airpods-pro',   '/search',       'Mozilla/5.0'),
(now() - INTERVAL 5  DAY,    'PURCHASE',    'user-2087', 'sess-b2', 8, 'AirPods Pro','airpods-pro',8, 3, 'Apple',  40, 'APP-2',        1099.00, 'PLN', NULL, 2,    '/checkout/success','/cart',         'Mozilla/5.0'),
-- guest session: just browsing the iPhone
(now() - INTERVAL 2  DAY,    'VIEW',        NULL,        'sess-guest-9', 1, 'iPhone 15','iphone-15',7, 3, 'Apple', 12, 'IP15-128-BLK', 3999.00, 'PLN', NULL, NULL, '/p/iphone-15',    '/',             'Mozilla/5.0'),
(now() - INTERVAL 2  DAY,    'CLICK',       NULL,        'sess-guest-9', 1, 'iPhone 15','iphone-15',7, 3, 'Apple', 12, 'IP15-128-BLK', 3999.00, 'PLN', NULL, NULL, '/p/iphone-15',    '/p/iphone-15',  'Mozilla/5.0');
SQL

echo "==> Valkey: reset & seed retargeting hashes"
vk DEL retarget:user:user-1042 retarget:user:user-2087 retarget:sess:sess-guest-9

# user-1042 — recent iPhone interest (today) + a Galaxy view (yesterday)
vk HSET retarget:user:user-1042 category:7 "$NOW_MS" product:1 "$NOW_MS" product:5 "$(( NOW_MS - DAY_MS ))"
vk HEXPIRE retarget:user:user-1042 "$TTL_SECONDS" FIELDS 3 category:7 product:1 product:5

# user-2087 — phones + audio
vk HSET retarget:user:user-2087 \
    category:7 "$(( NOW_MS - 2 * 3600000 ))" category:8 "$(( NOW_MS - 3 * DAY_MS ))" \
    product:5 "$(( NOW_MS - 2 * 3600000 ))" product:8 "$(( NOW_MS - 3 * DAY_MS ))"
vk HEXPIRE retarget:user:user-2087 "$TTL_SECONDS" FIELDS 4 category:7 category:8 product:5 product:8

# guest session
vk HSET retarget:sess:sess-guest-9 category:7 "$(( NOW_MS - 2 * DAY_MS ))" product:1 "$(( NOW_MS - 2 * DAY_MS ))"
vk HEXPIRE retarget:sess:sess-guest-9 "$TTL_SECONDS" FIELDS 2 category:7 product:1

echo "==> Done. Verifying:"
echo -n "    ClickHouse rows: "
docker exec -i "$CH_CONTAINER" clickhouse-client --user "$CH_USER" --password "$CH_PASS" \
    --query "SELECT count() FROM ${CH_DB}.activity_event"
echo "    Valkey retarget:user:user-1042 -> $(docker exec -i "$VK_CONTAINER" valkey-cli HGETALL retarget:user:user-1042 | tr '\n' ' ')"
