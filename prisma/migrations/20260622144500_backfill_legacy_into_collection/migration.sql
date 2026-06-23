-- Data migration: move the legacy LegoSet / LegoMinifig rows into the new
-- Collection → CollectionItem (+ one BRICKECONOMY evaluation + one entry per
-- owned copy) model BEFORE the legacy tables are dropped. Runs inside the
-- migration's transaction. A no-op on a fresh database (empty legacy tables);
-- on a populated database it preserves catalog data, current values, notes,
-- statuses and sold prices, plus community-proposed (ls_*) rows.

-- Normalized snapshot of both legacy tables (session-scoped temp table).
DROP TABLE IF EXISTS _legacy;
CREATE TEMP TABLE _legacy AS
SELECT
    "id",
    'SET'::"CIType" AS "type",
    "setNumber" AS "legoRef",
    "name",
    "year",
    "pieces",
    "imageUrl",
    "notes",
    "quantity",
    "status",
    "soldPrice",
    "currentValue",
    "retailPrice"
FROM "LegoSet"
UNION ALL
SELECT
    "id",
    'MINIFIGURE'::"CIType",
    "minifigNumber",
    "name",
    "year",
    2 AS "pieces", -- minifigs have no piece count; schema default for figures
    "imageUrl",
    "notes",
    "quantity",
    "status",
    "soldPrice",
    "currentValue",
    "retailPrice"
FROM "LegoMinifig";

-- The single collection container.
INSERT INTO "Collection" (
    "id", "title", "description",
    "totalSets", "totalSetsValue", "totalFigs", "totalFigsValue",
    "createdAt", "updatedAt"
)
VALUES (
    'bryan-sw',
    'Bryan Mansell''s LEGO Star Wars Collection',
    'An itemized inventory of Bryan Mansell''s LEGO Star Wars collection.',
    0, 0, 0, 0, now(), now()
)
ON CONFLICT ("id") DO NOTHING;

-- One CollectionItem per legacy row (id preserved so seed/refresh keep matching).
INSERT INTO "CollectionItem" (
    "id", "legoRef", "type", "year", "name", "imageUrl", "notes",
    "quantity", "pieces", "collectionId", "createdAt", "updatedAt"
)
SELECT
    "id", "legoRef", "type", "year", "name", "imageUrl", "notes",
    "quantity", "pieces", 'bryan-sw', now(), now()
FROM _legacy
ON CONFLICT ("id") DO NOTHING;

-- One BRICKECONOMY evaluation per item (legacy market value + retail).
INSERT INTO "CollectionItemEvaluation" (
    "id", "itemId", "source", "value", "retail", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text, "id", 'BRICKECONOMY', "currentValue", "retailPrice",
    now(), now()
FROM _legacy;

-- Primary entry per item, carrying the legacy status → disposition + sold price.
INSERT INTO "CollectionItemEntry" (
    "id", "itemId", "disposition", "sellPrice", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    "id",
    CASE
        WHEN lower(trim("status")) LIKE 'sold%' THEN 'SOLD'
        WHEN lower(trim("status")) LIKE 'recovered%' THEN 'RECOVERED'
        WHEN lower("status") LIKE '%layaway%' THEN 'LAYAWAY'
        ELSE 'HELD'
    END::"CIDisposition",
    "soldPrice",
    now(), now()
FROM _legacy;

-- Additional copies (quantity - 1): same disposition, prices left at 0.
INSERT INTO "CollectionItemEntry" (
    "id", "itemId", "disposition", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    l."id",
    CASE
        WHEN lower(trim(l."status")) LIKE 'sold%' THEN 'SOLD'
        WHEN lower(trim(l."status")) LIKE 'recovered%' THEN 'RECOVERED'
        WHEN lower(l."status") LIKE '%layaway%' THEN 'LAYAWAY'
        ELSE 'HELD'
    END::"CIDisposition",
    now(), now()
FROM _legacy l
JOIN generate_series(2, GREATEST(l."quantity", 1)) AS gs ON true;

-- Denormalized totals (cross-source average × copies; here just the BE value).
UPDATE "Collection" c SET
    "totalSets" = COALESCE(s.cnt, 0),
    "totalSetsValue" = COALESCE(s.val, 0),
    "totalFigs" = COALESCE(f.cnt, 0),
    "totalFigsValue" = COALESCE(f.val, 0)
FROM
    (SELECT COALESCE(sum("quantity"), 0) AS cnt,
            COALESCE(sum("currentValue" * "quantity"), 0) AS val
       FROM _legacy WHERE "type" = 'SET') s,
    (SELECT COALESCE(sum("quantity"), 0) AS cnt,
            COALESCE(sum("currentValue" * "quantity"), 0) AS val
       FROM _legacy WHERE "type" = 'MINIFIGURE') f
WHERE c."id" = 'bryan-sw';

DROP TABLE IF EXISTS _legacy;
