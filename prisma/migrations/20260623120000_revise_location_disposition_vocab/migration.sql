-- Rework the entry vocabularies:
--   • CIELocation drops STOLEN (a sale state, not a place) → HOME/STORE/STORAGE/UNKNOWN
--   • CIDisposition renames HELD → FOR_SALE and adds STOLEN
-- Then reset every existing copy to Store / For Sale, as requested.
-- Enum changes use the create-new-type / cast / swap pattern so existing rows
-- survive (HELD maps to FOR_SALE; any STOLEN location maps to STORE).

-- ── CIDisposition: HELD → FOR_SALE, + STOLEN ──────────────────────────────────
ALTER TABLE "CollectionItemEntry" ALTER COLUMN "disposition" DROP DEFAULT;

CREATE TYPE "CIDisposition_new" AS ENUM ('FOR_SALE', 'SOLD', 'LAYAWAY', 'STOLEN', 'RECOVERED');

ALTER TABLE "CollectionItemEntry"
    ALTER COLUMN "disposition" TYPE "CIDisposition_new"
    USING (
        CASE
            WHEN "disposition"::text = 'HELD' THEN 'FOR_SALE'
            ELSE "disposition"::text
        END::"CIDisposition_new"
    );

ALTER TYPE "CIDisposition" RENAME TO "CIDisposition_old";
ALTER TYPE "CIDisposition_new" RENAME TO "CIDisposition";
DROP TYPE "CIDisposition_old";

ALTER TABLE "CollectionItemEntry" ALTER COLUMN "disposition" SET DEFAULT 'FOR_SALE';

-- ── CIELocation: drop STOLEN ──────────────────────────────────────────────────
ALTER TABLE "CollectionItemEntry" ALTER COLUMN "location" DROP DEFAULT;

CREATE TYPE "CIELocation_new" AS ENUM ('HOME', 'STORE', 'STORAGE', 'UNKNOWN');

ALTER TABLE "CollectionItemEntry"
    ALTER COLUMN "location" TYPE "CIELocation_new"
    USING (
        CASE
            WHEN "location"::text IN ('HOME', 'STORE', 'STORAGE', 'UNKNOWN')
                THEN "location"::text
            ELSE 'STORE'
        END::"CIELocation_new"
    );

ALTER TYPE "CIELocation" RENAME TO "CIELocation_old";
ALTER TYPE "CIELocation_new" RENAME TO "CIELocation";
DROP TYPE "CIELocation_old";

ALTER TABLE "CollectionItemEntry" ALTER COLUMN "location" SET DEFAULT 'STORE';

-- ── Reset every copy to Store / For Sale ──────────────────────────────────────
UPDATE "CollectionItemEntry" SET "location" = 'STORE', "disposition" = 'FOR_SALE';
