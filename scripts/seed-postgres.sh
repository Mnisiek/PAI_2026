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

-- 5b. Extra demo catalog: a fuller shop with 2 products per leaf category and
-- varied attribute values, so filters have multiple options to narrow on.
INSERT INTO brand (name, slug, logo_url, description, is_active) VALUES
    ('LG',   'lg',   NULL, 'LG products',     TRUE),
    ('Bose', 'bose', NULL, 'Bose audio',      TRUE),
    ('Nike', 'nike', NULL, 'Nike sportswear', TRUE),
    ('IKEA', 'ikea', NULL, 'IKEA home',       TRUE);

INSERT INTO product (slug, name, description, category_id, brand_id, search_text, main_image_url, status, specs, created_at, updated_at)
SELECT x.slug, x.name, x.descr, c.id, b.id,
       lower(x.name || ' ' || x.descr || ' ' || b.name || ' ' || c.name),
       x.img, 'ACTIVE',
       jsonb_build_array(
           jsonb_build_object('key', 'Producent', 'value', b.name),
           jsonb_build_object('key', 'Kategoria', 'value', c.name)
       ),
       now(), now()
FROM (VALUES
    ('sluchawki-przewodowe-clear', 'Słuchawki przewodowe Clear', 'Czysty dźwięk, kabel 2 m.',        'audio',       'sony',    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80'),
    ('sluchawki-dokanalowe-air',   'Słuchawki dokanałowe Air',   'Bluetooth 5.3, etui ładujące.',    'audio',       'bose',    'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=900&q=80'),
    ('monitor-24-cali-fhd',        'Monitor 24 cale FHD',        'Panel IPS, 75 Hz.',                'monitory',    'lg',      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'),
    ('monitor-32-cali-4k',         'Monitor 32 cale 4K',         'UHD, 144 Hz, HDR.',                'monitory',    'samsung', 'https://images.unsplash.com/photo-1593640495253-23196b27a87f?auto=format&fit=crop&w=900&q=80'),
    ('blender-turbo',              'Blender Turbo',              'Kielich 1,5 l, mocny silnik.',     'kuchnia',     'generic', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=80'),
    ('czajnik-speed',              'Czajnik Speed',              'Szybkie gotowanie wody.',          'kuchnia',     'generic', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=900&q=80'),
    ('plafon-led-sky',             'Plafon LED Sky',             'Jasne, zimne światło.',            'oswietlenie', 'generic', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80'),
    ('kinkiet-loft',               'Kinkiet Loft',               'Industrialny styl.',               'oswietlenie', 'generic', 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80'),
    ('mata-eco',                   'Mata Eco',                   'Cienka mata, lekka.',              'fitness',     'generic', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80'),
    ('mata-comfort',               'Mata Comfort',               'Gruba, maksimum amortyzacji.',     'fitness',     'generic', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80'),
    ('opaska-fit-lite',            'Opaska Fit Lite',            'Lekka opaska sportowa.',           'wearables',   'samsung', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'),
    ('smartwatch-pro-x',           'Smartwatch Pro X',           'GPS, EKG, ekran AMOLED.',          'wearables',   'samsung', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=900&q=80'),
    ('kurtka-puchowa-alpine',      'Kurtka puchowa Alpine',      'Ciepła kurtka na zimę.',           'okrycia',     'nike',    'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=900&q=80'),
    ('plaszcz-miejski-rain',       'Płaszcz miejski Rain',       'Wodoodporny płaszcz.',             'okrycia',     'generic', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80'),
    ('sneakersy-street',           'Sneakersy Street',           'Miejski styl na co dzień.',        'obuwie',      'nike',    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=80'),
    ('buty-trekkingowe-trail',     'Buty trekkingowe Trail',     'Na szlak i trudny teren.',         'obuwie',      'generic', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80'),
    ('fotel-skora-lux',            'Fotel Skóra Lux',            'Skórzany fotel premium.',          'fotele',      'generic', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80'),
    ('fotel-tkanina-soft',         'Fotel Tkanina Soft',         'Miękka tapicerka.',                'fotele',      'ikea',    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80'),
    ('lampa-biurkowa-klasik',      'Lampa biurkowa Klasik',      'Klasyczny włącznik.',              'lampy',       'ikea',    'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80'),
    ('lampa-smart-voice',          'Lampa Smart Voice',          'Sterowanie głosem.',               'lampy',       'generic', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80')
) AS x(slug, name, descr, cat_slug, brand_slug, img)
JOIN category c ON c.slug = x.cat_slug
JOIN brand    b ON b.slug = x.brand_slug;

INSERT INTO offer (product_id, sku, price, price_currency, stock, status, created_at, updated_at)
SELECT p.id, x.sku, x.price, 'PLN', x.stock, 'ACTIVE', now(), now()
FROM (VALUES
    ('sluchawki-przewodowe-clear', 'HP-CLEAR',     149.00,  20),
    ('sluchawki-dokanalowe-air',   'HP-AIR',       399.00,  15),
    ('monitor-24-cali-fhd',        'MON-24-FHD',   699.00,  10),
    ('monitor-32-cali-4k',         'MON-32-4K',    2199.00, 6),
    ('blender-turbo',              'BLEND-TURBO',  199.00,  25),
    ('czajnik-speed',              'KETTLE-SPEED', 129.00,  30),
    ('plafon-led-sky',             'PLAF-SKY',     159.00,  18),
    ('kinkiet-loft',               'KINK-LOFT',    119.00,  14),
    ('mata-eco',                   'MAT-ECO',      99.00,   40),
    ('mata-comfort',               'MAT-COMF',     219.00,  22),
    ('opaska-fit-lite',            'BAND-LITE',    249.00,  35),
    ('smartwatch-pro-x',           'SMW-PRO-X',    1099.00, 9),
    ('kurtka-puchowa-alpine',      'JAC-ALPINE',   899.00,  8),
    ('plaszcz-miejski-rain',       'COAT-RAIN',    459.00,  12),
    ('sneakersy-street',           'SHO-STREET',   329.00,  26),
    ('buty-trekkingowe-trail',     'SHO-TRAIL',    549.00,  14),
    ('fotel-skora-lux',            'CHR-LUX',      1899.00, 5),
    ('fotel-tkanina-soft',         'CHR-SOFT',     990.00,  11),
    ('lampa-biurkowa-klasik',      'LMP-KLASIK',   99.00,   28),
    ('lampa-smart-voice',          'LMP-VOICE',    259.00,  16)
) AS x(slug, sku, price, stock)
JOIN product p ON p.slug = x.slug;

INSERT INTO offer_attribute_value (offer_id, attribute_id, text_value, num_value, bool_value)
SELECT o.id, a.id, x.text_value, x.num_value, x.bool_value
FROM (VALUES
    ('HP-CLEAR',     'lacznosc',       'Kabel',     NULL::numeric, NULL::boolean),
    ('HP-CLEAR',     'redukcja-szumu', NULL,        NULL,          FALSE),
    ('HP-AIR',       'lacznosc',       'Bluetooth', NULL,          NULL),
    ('HP-AIR',       'redukcja-szumu', NULL,        NULL,          TRUE),
    ('MON-24-FHD',   'przekatna',      NULL,        24,            NULL),
    ('MON-24-FHD',   'odswiezanie',    NULL,        75,            NULL),
    ('MON-32-4K',    'przekatna',      NULL,        32,            NULL),
    ('MON-32-4K',    'odswiezanie',    NULL,        144,           NULL),
    ('BLEND-TURBO',  'moc',            NULL,        800,           NULL),
    ('KETTLE-SPEED', 'moc',            NULL,        2200,          NULL),
    ('PLAF-SKY',     'barwa-swiatla',  'Zimna',     NULL,          NULL),
    ('KINK-LOFT',    'barwa-swiatla',  'Neutralna', NULL,          NULL),
    ('MAT-ECO',      'grubosc',        NULL,        4,             NULL),
    ('MAT-COMF',     'grubosc',        NULL,        10,            NULL),
    ('BAND-LITE',    'gps',            NULL,        NULL,          FALSE),
    ('SMW-PRO-X',    'gps',            NULL,        NULL,          TRUE),
    ('JAC-ALPINE',   'rozmiar',        'L',         NULL,          NULL),
    ('JAC-ALPINE',   'wodoodporna',    NULL,        NULL,          FALSE),
    ('COAT-RAIN',    'rozmiar',        'S',         NULL,          NULL),
    ('COAT-RAIN',    'wodoodporna',    NULL,        NULL,          TRUE),
    ('SHO-STREET',   'rozmiar',        '44',        NULL,          NULL),
    ('SHO-TRAIL',    'rozmiar',        '41',        NULL,          NULL),
    ('CHR-LUX',      'material',       'Skóra',     NULL,          NULL),
    ('CHR-SOFT',     'material',       'Tkanina',   NULL,          NULL),
    ('LMP-KLASIK',   'sterowanie',     'Przycisk',  NULL,          NULL),
    ('LMP-VOICE',    'sterowanie',     'Głos',      NULL,          NULL)
) AS x(sku, attr_code, text_value, num_value, bool_value)
JOIN offer     o ON o.sku  = x.sku
JOIN attribute a ON a.code = x.attr_code;

-- 5c. Variant-image demo: products with several offers, each its own colour +
-- its own image, so the product page's variant gallery has something to show.
INSERT INTO attribute (code, name, data_type, unit, is_variant_axis) VALUES
    ('kolor', 'Kolor', 'TEXT', NULL, TRUE);

INSERT INTO category_attribute (category_id, attribute_id, filterable, required, sort_order)
SELECT c.id, a.id, TRUE, FALSE, 5
FROM (VALUES ('wearables'), ('obuwie')) AS x(cat_slug)
JOIN category  c ON c.slug = x.cat_slug
JOIN attribute a ON a.code = 'kolor';

INSERT INTO product (slug, name, description, category_id, brand_id, search_text, main_image_url, status, specs, created_at, updated_at)
SELECT x.slug, x.name, x.descr, c.id, b.id,
       lower(x.name || ' ' || x.descr || ' ' || b.name || ' ' || c.name),
       x.img, 'ACTIVE',
       jsonb_build_array(
           jsonb_build_object('key', 'Producent', 'value', b.name),
           jsonb_build_object('key', 'Kategoria', 'value', c.name)
       ),
       now(), now()
FROM (VALUES
    ('smartwatch-color-x',  'Smartwatch Color X',  'Smartwatch w trzech kolorach do wyboru.', 'wearables', 'samsung', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80'),
    ('sneakersy-color-run', 'Sneakersy Color Run', 'Sneakersy dostępne w trzech kolorach.',   'obuwie',    'nike',    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80')
) AS x(slug, name, descr, cat_slug, brand_slug, img)
JOIN category c ON c.slug = x.cat_slug
JOIN brand    b ON b.slug = x.brand_slug;

INSERT INTO offer (product_id, sku, price, price_currency, stock, status, created_at, updated_at)
SELECT p.id, x.sku, x.price, 'PLN', x.stock, 'ACTIVE', now(), now()
FROM (VALUES
    ('smartwatch-color-x',  'SCX-BLK', 799.00, 10),
    ('smartwatch-color-x',  'SCX-SLV', 799.00, 8),
    ('smartwatch-color-x',  'SCX-GLD', 849.00, 5),
    ('sneakersy-color-run', 'SCR-BLK', 329.00, 12),
    ('sneakersy-color-run', 'SCR-WHT', 329.00, 15),
    ('sneakersy-color-run', 'SCR-RED', 349.00, 7)
) AS x(slug, sku, price, stock)
JOIN product p ON p.slug = x.slug;

INSERT INTO offer_attribute_value (offer_id, attribute_id, text_value, num_value, bool_value)
SELECT o.id, a.id, x.text_value, NULL::numeric, NULL::boolean
FROM (VALUES
    ('SCX-BLK', 'Czarny'), ('SCX-SLV', 'Srebrny'), ('SCX-GLD', 'Złoty'),
    ('SCR-BLK', 'Czarny'), ('SCR-WHT', 'Biały'),   ('SCR-RED', 'Czerwony')
) AS x(sku, text_value)
JOIN offer     o ON o.sku  = x.sku
JOIN attribute a ON a.code = 'kolor';

INSERT INTO offer_image (offer_id, url, alt, sort_order)
SELECT o.id, x.url, x.alt, 0
FROM (VALUES
    ('SCX-BLK', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80', 'Smartwatch czarny'),
    ('SCX-SLV', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', 'Smartwatch srebrny'),
    ('SCX-GLD', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=900&q=80', 'Smartwatch złoty'),
    ('SCR-BLK', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', 'Sneakersy czarne'),
    ('SCR-WHT', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=80', 'Sneakersy białe'),
    ('SCR-RED', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80', 'Sneakersy czerwone')
) AS x(sku, url, alt)
JOIN offer o ON o.sku = x.sku;

-- 6. Demo admin user (jan@example.com / demo1234). Upserts and (re)asserts the
-- ADMIN role so the demo account can reach the admin panel.
INSERT INTO users (username, password_hash, role)
VALUES ('jan@example.com', crypt('demo1234', gen_salt('bf', 10)), 'ADMIN')
ON CONFLICT (username) DO UPDATE SET role = 'ADMIN';

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
