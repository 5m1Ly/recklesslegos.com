import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  brickeconomySetId,
  COLLECTION_DESCRIPTION,
  COLLECTION_ID,
  COLLECTION_TITLE,
  recomputeCollectionTotals,
} from "../src/lib/collection";

// ─────────────────────────────────────────────────────────────────────────────
// Seed the curated set inventory from data/collection-import.csv (the transport
// file built by scripts/build-collection-import.py from the xlsx + pdf exports).
//
//   pnpm db:seed:collection
//
// The CSV is the source of truth for SET copies: for every set it covers we
// re-create the per-copy CollectionItemEntry rows (cost / display / sell price,
// location, disposition, build & crack flags) and upsert ONE MANUAL evaluation
// from the spreadsheet's low/high values. It never touches the BRICKECONOMY
// evaluation (so the cron's market value survives), minifigs, or admin-added
// items. Idempotent: re-running re-syncs the covered sets to match the CSV.
// ─────────────────────────────────────────────────────────────────────────────

const CSV_PATH = "data/collection-import.csv";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

/** Minimal RFC-4180 CSV parser (handles quoted fields + doubled quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const money = (s: string | undefined): number => {
  const n = Number((s ?? "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

type CIEntry = {
  condition: "BOXED" | "USED";
  location: "HOME" | "STORE" | "STORAGE" | "UNKNOWN";
  disposition: "FOR_SALE" | "SOLD" | "LAYAWAY" | "STOLEN" | "RECOVERED";
  isCrack: boolean;
  isBuild: boolean;
  isBuildWOFigs: boolean;
  costPrice: number;
  displayPrice: number;
  sellPrice: number;
};

async function ensureCollection(): Promise<void> {
  await prisma.collection.upsert({
    where: { id: COLLECTION_ID },
    update: {},
    create: {
      id: COLLECTION_ID,
      title: COLLECTION_TITLE,
      description: COLLECTION_DESCRIPTION,
    },
  });
}

// BrickEconomy keys sets by number WITH a variant suffix ("75192-1"); the
// spreadsheet uses the bare number ("75192"). Match on the base so the CSV lands
// on the existing item instead of creating a duplicate.
const baseRef = (s: string) => s.replace(/-\d+$/, "");

/** Find the existing item for a set number (by base), or create one. */
async function resolveItemId(
  ref: string,
  name: string,
  baseToId: Map<string, string>,
): Promise<string> {
  const hit = baseToId.get(baseRef(ref));
  if (hit) return hit;
  const id = brickeconomySetId(ref, name);
  await prisma.collectionItem.upsert({
    where: { id },
    update: {},
    create: {
      id,
      collectionId: COLLECTION_ID,
      type: "SET",
      legoRef: ref,
      name,
    },
  });
  baseToId.set(baseRef(ref), id);
  return id;
}

async function main() {
  const text = readFileSync(CSV_PATH, "utf8");
  const table = parseCsv(text).filter((r) => r.length > 1);
  const header = table.shift();
  if (!header) throw new Error(`${CSV_PATH} is empty`);
  const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  const get = (r: string[], k: string) => (r[col[k]] ?? "").trim();

  // Group rows by set number.
  const bySet = new Map<string, { name: string; rows: string[][] }>();
  for (const r of table) {
    const ref = get(r, "legoRef");
    if (!ref) continue;
    const g = bySet.get(ref) ?? {
      name: get(r, "canonicalName") || get(r, "name"),
      rows: [],
    };
    g.rows.push(r);
    bySet.set(ref, g);
  }

  await ensureCollection();

  // Index existing SET items by their base set number (ignoring the -N variant).
  const existing = await prisma.collectionItem.findMany({
    where: { type: "SET" },
    select: { id: true, legoRef: true },
  });
  const baseToId = new Map<string, string>();
  for (const it of existing) {
    const b = baseRef(it.legoRef);
    if (b && !baseToId.has(b)) baseToId.set(b, it.id);
  }

  let items = 0;
  let entries = 0;
  let evals = 0;
  for (const [ref, { name, rows }] of bySet) {
    const itemId = await resolveItemId(ref, name, baseToId);

    // CSV owns this set's copies → replace its entries wholesale.
    await prisma.collectionItemEntry.deleteMany({ where: { itemId } });
    const entryData: CIEntry[] = rows.map((r) => ({
      condition: "USED",
      location: (get(r, "location") || "UNKNOWN") as CIEntry["location"],
      disposition: (get(r, "disposition") ||
        "FOR_SALE") as CIEntry["disposition"],
      isCrack: get(r, "isCrack") === "true",
      isBuild: get(r, "isBuild") === "true",
      isBuildWOFigs: get(r, "isBuildWOFigs") === "true",
      costPrice: money(get(r, "costPrice")),
      displayPrice: money(get(r, "displayPrice")),
      sellPrice: money(get(r, "sellPrice")),
    }));
    await prisma.collectionItemEntry.createMany({
      data: entryData.map((e) => ({ itemId, ...e })),
    });
    entries += entryData.length;

    // One MANUAL evaluation from the spreadsheet's value range.
    const lows = rows
      .map((r) => money(get(r, "valueLow")))
      .filter((n) => n > 0);
    const highs = rows
      .map((r) => money(get(r, "valueHigh")))
      .filter((n) => n > 0);
    const valueLow = lows.length ? Math.max(...lows) : 0;
    const valueHigh = highs.length ? Math.max(...highs) : 0;
    if (valueLow || valueHigh) {
      const value = Math.round(
        valueLow && valueHigh
          ? (valueLow + valueHigh) / 2
          : valueHigh || valueLow,
      );
      const data = { value, valueLow, valueHigh };
      const existing = await prisma.collectionItemEvaluation.findFirst({
        where: { itemId, source: "MANUAL" },
        select: { id: true },
      });
      if (existing)
        await prisma.collectionItemEvaluation.update({
          where: { id: existing.id },
          data,
        });
      else
        await prisma.collectionItemEvaluation.create({
          data: { itemId, source: "MANUAL", ...data },
        });
      evals++;
    }
    items++;
  }

  await recomputeCollectionTotals(prisma, COLLECTION_ID);
  console.log(
    `✓ Seeded ${items} set(s), ${entries} copy entr(ies), ${evals} MANUAL evaluation(s) from ${CSV_PATH}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
