#!/usr/bin/env bash
#
# Applies the Postgres schema (via Liquibase, from backend/.../db/changelog) and
# seeds demo catalog + auth data (brands, categories, products, offers and the
# demo login user). Idempotent: Liquibase only runs un-applied changesets, the
# catalog tables are reset and reloaded with a fresh fixture, and the demo user
# is upserted. Run with the Docker stack up: `docker compose up -d`.
#
# This replaces the former Spring CommandLineRunner seeders (DemoUserSeeder,
# CatalogSeeder) so seeding is an explicit, out-of-band step rather than a
# side effect of booting the app. Schema stays Liquibase-managed and tracked in
# databasechangelog, so the backend's boot-time Liquibase sees it as already
# applied and runs no-op — the changelogs remain the single source of truth.
#
# Usage: scripts/seed-postgres.sh
set -euo pipefail

PG_CONTAINER="${PG_CONTAINER:-pai-postgres}"
PG_USER="${PG_USER:-user}"
PG_PASS="${PG_PASS:-password}"
PG_DB="${PG_DB:-shop_db}"
LIQUIBASE_IMAGE="${LIQUIBASE_IMAGE:-liquibase/liquibase:4.31}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Liquibase resolves includes (db/changelog/*.sql, relativeToChangelogFile=false)
# against the search path root, which is the backend resources dir.
RESOURCES_DIR="${SCRIPT_DIR}/../backend/src/main/resources"

psql() { docker exec -i "$PG_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" "$@"; }

echo "==> Postgres: apply schema via Liquibase (db=${PG_DB})"

# Reach Postgres on its own Docker network (resolved by container name) rather
# than guessing the compose project's network name. The Liquibase image bundles
# the PostgreSQL JDBC driver.
PG_NETWORK="$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' "$PG_CONTAINER" | head -n 1)"

# Mount source must be a host path Docker accepts. On Git Bash / MSYS, use the
# Windows form (pwd -W -> D:/...) and disable MSYS path conversion so the
# container-side paths (/liquibase/...) aren't rewritten into the Git install dir.
case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*)
        HOST_RESOURCES="$(cd "$RESOURCES_DIR" && pwd -W)"
        export MSYS_NO_PATHCONV=1
        ;;
    *)
        HOST_RESOURCES="$(cd "$RESOURCES_DIR" && pwd)"
        ;;
esac

docker run --rm \
    --network "$PG_NETWORK" \
    -v "${HOST_RESOURCES}:/liquibase/changelog:ro" \
    "$LIQUIBASE_IMAGE" \
    --search-path=/liquibase/changelog \
    --changelog-file=db/changelog/db.changelog-master.xml \
    --url="jdbc:postgresql://${PG_CONTAINER}:5432/${PG_DB}" \
    --username="$PG_USER" \
    --password="$PG_PASS" \
    update

echo "==> Postgres: reset catalog & seed data (db=${PG_DB})"

# FK ids are resolved by slug in subqueries, so this is order-independent and
# survives whatever IDENTITY values RESTART hands out. The demo password hash is
# produced by pgcrypto's bcrypt (gen_salt('bf', 10)) — the same $2a$/cost-10
# format Spring's BCryptPasswordEncoder verifies against.
psql <<'SQL'
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Catalog: wipe and reload a fresh demo fixture.
TRUNCATE TABLE offer_attribute_value, offer_image, offer, category_attribute,
               attribute, product, category, brand
    RESTART IDENTITY CASCADE;

-- 1. Brands
INSERT INTO brand (name, slug, logo_url, description, is_active) VALUES
    ('Apple',   'apple',   'https://logo.url/apple', 'Apple products',  TRUE),
    ('Samsung', 'samsung', NULL,                     'Samsung products', TRUE),
    ('Sony',    'sony',    NULL,                     'Sony products',    TRUE),
    ('Generic', 'generic', NULL,                     'Generic brand',    TRUE);

-- 2. Categories (top level)
INSERT INTO category (parent_id, name, slug, sort_order, is_active) VALUES
    (NULL, 'Elektronika', 'elektronika', 1, TRUE),
    (NULL, 'Dom i Ogród', 'dom-i-ogrod', 2, TRUE),
    (NULL, 'Sport',       'sport',       3, TRUE),
    (NULL, 'Moda',        'moda',        4, TRUE),
    (NULL, 'Biuro',       'biuro',       5, TRUE);

-- Subcategories (parent resolved by slug)
INSERT INTO category (parent_id, name, slug, sort_order, is_active) VALUES
    ((SELECT id FROM category WHERE slug = 'elektronika'), 'Audio',       'audio',       1, TRUE),
    ((SELECT id FROM category WHERE slug = 'elektronika'), 'Monitory',    'monitory',    2, TRUE),
    ((SELECT id FROM category WHERE slug = 'dom-i-ogrod'), 'Kuchnia',     'kuchnia',     1, TRUE),
    ((SELECT id FROM category WHERE slug = 'dom-i-ogrod'), 'Oświetlenie', 'oswietlenie', 2, TRUE),
    ((SELECT id FROM category WHERE slug = 'sport'),       'Fitness',     'fitness',     1, TRUE),
    ((SELECT id FROM category WHERE slug = 'sport'),       'Wearables',   'wearables',   2, TRUE),
    ((SELECT id FROM category WHERE slug = 'moda'),        'Okrycia',     'okrycia',     1, TRUE),
    ((SELECT id FROM category WHERE slug = 'moda'),        'Obuwie',      'obuwie',      2, TRUE),
    ((SELECT id FROM category WHERE slug = 'biuro'),       'Fotele',      'fotele',      1, TRUE),
    ((SELECT id FROM category WHERE slug = 'biuro'),       'Lampy',       'lampy',       2, TRUE);

-- 3. Products. search_text = name + description + brand + category (as the old
-- seeder built it); specs is the display blob [{key,value},...].
INSERT INTO product
    (slug, name, description, category_id, brand_id, search_text, main_image_url, status, specs, created_at, updated_at)
VALUES
    ('sluchawki-bezprzewodowe-s-900', 'Słuchawki bezprzewodowe S-900',
     'Redukcja szumu, do 40 h pracy, Bluetooth 5.3.',
     (SELECT id FROM category WHERE slug = 'audio'), (SELECT id FROM brand WHERE slug = 'sony'),
     'Słuchawki bezprzewodowe S-900 Redukcja szumu, do 40 h pracy, Bluetooth 5.3. Sony Audio',
     'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
     'ACTIVE', '[{"key":"Producent","value":"Sony"},{"key":"Kategoria","value":"Audio"}]'::jsonb, now(), now()),

    ('monitor-27-cali-qhd', 'Monitor 27 cali QHD',
     'Odświeżanie 165 Hz, panel IPS, tryb nocny.',
     (SELECT id FROM category WHERE slug = 'monitory'), (SELECT id FROM brand WHERE slug = 'samsung'),
     'Monitor 27 cali QHD Odświeżanie 165 Hz, panel IPS, tryb nocny. Samsung Monitory',
     'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80',
     'ACTIVE', '[{"key":"Producent","value":"Samsung"},{"key":"Kategoria","value":"Monitory"}]'::jsonb, now(), now()),

    ('ekspres-cisnieniowy-barista-one', 'Ekspres ciśnieniowy Barista One',
     'Młynek stalowy, 12 profilów, automatyczne czyszczenie.',
     (SELECT id FROM category WHERE slug = 'kuchnia'), (SELECT id FROM brand WHERE slug = 'generic'),
     'Ekspres ciśnieniowy Barista One Młynek stalowy, 12 profilów, automatyczne czyszczenie. Generic Kuchnia',
     'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80',
     'ACTIVE', '[{"key":"Producent","value":"Generic"},{"key":"Kategoria","value":"Kuchnia"}]'::jsonb, now(), now()),

    ('lampa-stojaca-arc-light', 'Lampa stojąca Arc Light',
     'Regulacja wysokości i ciepła barwa światła.',
     (SELECT id FROM category WHERE slug = 'oswietlenie'), (SELECT id FROM brand WHERE slug = 'generic'),
     'Lampa stojąca Arc Light Regulacja wysokości i ciepła barwa światła. Generic Oświetlenie',
     'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=900&q=80',
     'ACTIVE', '[{"key":"Producent","value":"Generic"},{"key":"Kategoria","value":"Oświetlenie"}]'::jsonb, now(), now()),

    ('mata-treningowa-pro-grip', 'Mata treningowa Pro Grip',
     'Antypoślizgowa, 6 mm grubości, materiał premium.',
     (SELECT id FROM category WHERE slug = 'fitness'), (SELECT id FROM brand WHERE slug = 'generic'),
     'Mata treningowa Pro Grip Antypoślizgowa, 6 mm grubości, materiał premium. Generic Fitness',
     'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80',
     'ACTIVE', '[{"key":"Producent","value":"Generic"},{"key":"Kategoria","value":"Fitness"}]'::jsonb, now(), now()),

    ('smartwatch-active-4', 'Smartwatch Active 4',
     'GPS, monitor snu, 7 dni pracy na baterii.',
     (SELECT id FROM category WHERE slug = 'wearables'), (SELECT id FROM brand WHERE slug = 'samsung'),
     'Smartwatch Active 4 GPS, monitor snu, 7 dni pracy na baterii. Samsung Wearables',
     'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
     'ACTIVE', '[{"key":"Producent","value":"Samsung"},{"key":"Kategoria","value":"Wearables"}]'::jsonb, now(), now()),

    ('kurtka-miejska-northline', 'Kurtka miejska Northline',
     'Wodoodporna, oddychająca, kaptur chowany w kołnierz.',
     (SELECT id FROM category WHERE slug = 'okrycia'), (SELECT id FROM brand WHERE slug = 'generic'),
     'Kurtka miejska Northline Wodoodporna, oddychająca, kaptur chowany w kołnierz. Generic Okrycia',
     'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=80',
     'ACTIVE', '[{"key":"Producent","value":"Generic"},{"key":"Kategoria","value":"Okrycia"}]'::jsonb, now(), now()),

    ('buty-biegowe-aeroflow', 'Buty biegowe AeroFlow',
     'Lekka podeszwa, amortyzacja dynamiczna.',
     (SELECT id FROM category WHERE slug = 'obuwie'), (SELECT id FROM brand WHERE slug = 'generic'),
     'Buty biegowe AeroFlow Lekka podeszwa, amortyzacja dynamiczna. Generic Obuwie',
     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
     'ACTIVE', '[{"key":"Producent","value":"Generic"},{"key":"Kategoria","value":"Obuwie"}]'::jsonb, now(), now()),

    ('fotel-ergonomiczny-office-plus', 'Fotel ergonomiczny Office Plus',
     'Regulacja 4D, siatka mesh, podparcie lędźwi.',
     (SELECT id FROM category WHERE slug = 'fotele'), (SELECT id FROM brand WHERE slug = 'generic'),
     'Fotel ergonomiczny Office Plus Regulacja 4D, siatka mesh, podparcie lędźwi. Generic Fotele',
     'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
     'ACTIVE', '[{"key":"Producent","value":"Generic"},{"key":"Kategoria","value":"Fotele"}]'::jsonb, now(), now()),

    ('lampka-biurkowa-focus-beam', 'Lampka biurkowa Focus Beam',
     'Sterowanie dotykowe, trzy temperatury światła.',
     (SELECT id FROM category WHERE slug = 'lampy'), (SELECT id FROM brand WHERE slug = 'generic'),
     'Lampka biurkowa Focus Beam Sterowanie dotykowe, trzy temperatury światła. Generic Lampy',
     'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80',
     'ACTIVE', '[{"key":"Producent","value":"Generic"},{"key":"Kategoria","value":"Lampy"}]'::jsonb, now(), now());

-- 4. Offers (one per product, resolved by product slug)
INSERT INTO offer (product_id, sku, price, price_currency, stock, status, created_at, updated_at) VALUES
    ((SELECT id FROM product WHERE slug = 'sluchawki-bezprzewodowe-s-900'), 'S900-BLK',     349.99,  'PLN', 15, 'ACTIVE', now(), now()),
    ((SELECT id FROM product WHERE slug = 'monitor-27-cali-qhd'),           'MON-27-QHD',   1199.00, 'PLN', 8,  'ACTIVE', now(), now()),
    ((SELECT id FROM product WHERE slug = 'ekspres-cisnieniowy-barista-one'),'EXP-BAR-ONE', 1899.50, 'PLN', 5,  'ACTIVE', now(), now()),
    ((SELECT id FROM product WHERE slug = 'lampa-stojaca-arc-light'),       'LMP-ARC-LGT',  429.00,  'PLN', 20, 'ACTIVE', now(), now()),
    ((SELECT id FROM product WHERE slug = 'mata-treningowa-pro-grip'),      'MAT-PRO-GRP',  159.00,  'PLN', 30, 'ACTIVE', now(), now()),
    ((SELECT id FROM product WHERE slug = 'smartwatch-active-4'),           'SMW-ACT-4',    799.00,  'PLN', 12, 'ACTIVE', now(), now()),
    ((SELECT id FROM product WHERE slug = 'kurtka-miejska-northline'),      'JAC-NLINE-M',  569.00,  'PLN', 6,  'ACTIVE', now(), now()),
    ((SELECT id FROM product WHERE slug = 'buty-biegowe-aeroflow'),         'SHO-AFLOW-42', 499.00,  'PLN', 18, 'ACTIVE', now(), now()),
    ((SELECT id FROM product WHERE slug = 'fotel-ergonomiczny-office-plus'),'CHR-OFF-PLUS', 1350.00, 'PLN', 4,  'ACTIVE', now(), now()),
    ((SELECT id FROM product WHERE slug = 'lampka-biurkowa-focus-beam'),    'LMP-FCS-BM',   189.00,  'PLN', 25, 'ACTIVE', now(), now());

-- 5. Attributes, per-leaf-category filter sets, and the offers' values.
-- Codes are stable slugs; admin-entered attributes resolve to the same code.
INSERT INTO attribute (code, name, data_type, unit, is_variant_axis) VALUES
    ('lacznosc',       'Łączność',       'TEXT',   NULL,   FALSE),
    ('redukcja-szumu', 'Redukcja szumu', 'BOOL',   NULL,   FALSE),
    ('przekatna',      'Przekątna',      'NUMBER', 'cale', FALSE),
    ('odswiezanie',    'Odświeżanie',    'NUMBER', 'Hz',   FALSE),
    ('moc',            'Moc',            'NUMBER', 'W',    FALSE),
    ('barwa-swiatla',  'Barwa światła',  'TEXT',   NULL,   FALSE),
    ('grubosc',        'Grubość',        'NUMBER', 'mm',   FALSE),
    ('gps',            'GPS',            'BOOL',   NULL,   FALSE),
    ('rozmiar',        'Rozmiar',        'TEXT',   NULL,   FALSE),
    ('wodoodporna',    'Wodoodporna',    'BOOL',   NULL,   FALSE),
    ('material',       'Materiał',       'TEXT',   NULL,   FALSE),
    ('sterowanie',     'Sterowanie',     'TEXT',   NULL,   FALSE);

-- Which attributes are filterable on each leaf category (category_attribute).
INSERT INTO category_attribute (category_id, attribute_id, filterable, required, sort_order)
SELECT c.id, a.id, TRUE, FALSE, x.sort_order
FROM (VALUES
    ('audio',       'lacznosc',       0),
    ('audio',       'redukcja-szumu', 1),
    ('monitory',    'przekatna',      0),
    ('monitory',    'odswiezanie',    1),
    ('kuchnia',     'moc',            0),
    ('oswietlenie', 'barwa-swiatla',  0),
    ('fitness',     'grubosc',        0),
    ('wearables',   'gps',            0),
    ('okrycia',     'rozmiar',        0),
    ('okrycia',     'wodoodporna',    1),
    ('obuwie',      'rozmiar',        0),
    ('fotele',      'material',       0),
    ('lampy',       'sterowanie',     0)
) AS x(cat_slug, attr_code, sort_order)
JOIN category  c ON c.slug = x.cat_slug
JOIN attribute a ON a.code = x.attr_code;

-- The seeded offers' concrete attribute values (offer_attribute_value).
INSERT INTO offer_attribute_value (offer_id, attribute_id, text_value, num_value, bool_value)
SELECT o.id, a.id, x.text_value, x.num_value, x.bool_value
FROM (VALUES
    ('S900-BLK',     'lacznosc',       'Bluetooth', NULL::numeric, NULL::boolean),
    ('S900-BLK',     'redukcja-szumu', NULL,        NULL,          TRUE),
    ('MON-27-QHD',   'przekatna',      NULL,        27,            NULL),
    ('MON-27-QHD',   'odswiezanie',    NULL,        165,           NULL),
    ('EXP-BAR-ONE',  'moc',            NULL,        1500,          NULL),
    ('LMP-ARC-LGT',  'barwa-swiatla',  'Ciepła',    NULL,          NULL),
    ('MAT-PRO-GRP',  'grubosc',        NULL,        6,             NULL),
    ('SMW-ACT-4',    'gps',            NULL,        NULL,          TRUE),
    ('JAC-NLINE-M',  'rozmiar',        'M',         NULL,          NULL),
    ('JAC-NLINE-M',  'wodoodporna',    NULL,        NULL,          TRUE),
    ('SHO-AFLOW-42', 'rozmiar',        '42',        NULL,          NULL),
    ('CHR-OFF-PLUS', 'material',       'Mesh',      NULL,          NULL),
    ('LMP-FCS-BM',   'sterowanie',     'Dotykowe',  NULL,          NULL)
) AS x(sku, attr_code, text_value, num_value, bool_value)
JOIN offer     o ON o.sku  = x.sku
JOIN attribute a ON a.code = x.attr_code;

-- 6. Demo login user (jan@example.com / demo1234). Upsert so existing rows and
-- real registrations are left untouched.
INSERT INTO users (username, password_hash)
VALUES ('jan@example.com', crypt('demo1234', gen_salt('bf', 10)))
ON CONFLICT (username) DO NOTHING;

COMMIT;
SQL

echo "==> Done. Verifying:"
psql -t -c "SELECT
    (SELECT count(*) FROM brand)                 AS brands,
    (SELECT count(*) FROM category)              AS categories,
    (SELECT count(*) FROM product)               AS products,
    (SELECT count(*) FROM offer)                 AS offers,
    (SELECT count(*) FROM attribute)             AS attributes,
    (SELECT count(*) FROM category_attribute)    AS cat_attrs,
    (SELECT count(*) FROM offer_attribute_value) AS offer_vals,
    (SELECT count(*) FROM users)                 AS users;"
