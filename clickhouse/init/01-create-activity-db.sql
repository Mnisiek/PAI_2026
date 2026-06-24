-- Runs once on ClickHouse first-init (mounted into /docker-entrypoint-initdb.d/).
-- Idempotent so scripts/seed-activity.sh can re-apply the same files standalone.
CREATE DATABASE IF NOT EXISTS activity_db;