import "server-only";
import {
  fetchCollectionMinifigs,
  fetchCollectionSets,
  requireApiKey,
} from "@/lib/brickeconomy";
import {
  brickeconomyMinifigId,
  brickeconomySetId,
  COLLECTION_ID,
  recomputeCollectionTotals,
} from "@/lib/collection";
import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// BrickEconomy value refresh.
//
// Runs on a cron (see src/lib/lego-cron.ts). Instead of one request per set, we
// fetch the WHOLE collection in a couple of paged calls (the same endpoints the
// seed uses) and upsert each item's BRICKECONOMY evaluation. Items flagged
// `autoEvaluate = false` (a manual admin valuation) are skipped, and only the
// BRICKECONOMY evaluation is touched — manual / contributor / other-source
// evaluations and all entries are left untouched.
// ─────────────────────────────────────────────────────────────────────────────

export interface LegoRefreshResult {
  updated: number;
  total: number;
  missing: string[]; // catalog refs with no matching item or no value
}

interface RefreshRow {
  id: string;
  ref: string;
  value: number;
  retail: number;
}

/** Upsert the single BRICKECONOMY evaluation for one item. */
async function applyBrickeconomyValue(row: RefreshRow): Promise<void> {
  const data = { value: row.value, retail: row.retail };
  const existing = await prisma.collectionItemEvaluation.findFirst({
    where: { itemId: row.id, source: "BRICKECONOMY" },
    select: { id: true },
  });
  if (existing) {
    await prisma.collectionItemEvaluation.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.collectionItemEvaluation.create({
      data: { itemId: row.id, source: "BRICKECONOMY", ...data },
    });
  }
}

/**
 * Refresh BrickEconomy values for every auto-evaluated item. Best-effort: a row
 * with no matching item or no value is recorded in `missing`, never fatal.
 */
export async function refreshLegoValues(): Promise<LegoRefreshResult> {
  const apiKey = requireApiKey();

  const [sets, minifigs] = await Promise.all([
    fetchCollectionSets(apiKey),
    fetchCollectionMinifigs(apiKey),
  ]);

  const rows: RefreshRow[] = [
    ...sets.map((s) => ({
      id: brickeconomySetId(s.setNumber, s.name),
      ref: s.setNumber || s.name,
      value: s.currentValue,
      retail: s.retailPrice,
    })),
    ...minifigs.map((m) => ({
      id: brickeconomyMinifigId(m.minifigNumber, m.name),
      ref: m.minifigNumber || m.name,
      value: m.currentValue,
      retail: m.retailPrice,
    })),
  ];

  const missing: string[] = [];
  let updated = 0;

  for (const row of rows) {
    const item = await prisma.collectionItem.findUnique({
      where: { id: row.id },
      select: { autoEvaluate: true },
    });
    if (!item) {
      missing.push(row.ref);
      continue;
    }
    if (!item.autoEvaluate) continue; // manual valuation → leave it alone
    if (row.value <= 0) {
      missing.push(row.ref);
      continue;
    }
    try {
      await applyBrickeconomyValue(row);
      updated++;
    } catch (err) {
      console.error(`[lego-prices] ${row.ref} failed:`, err);
      missing.push(row.ref);
    }
  }

  await recomputeCollectionTotals(prisma, COLLECTION_ID);

  return { updated, total: rows.length, missing };
}
