import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  fetchCollectionMinifigs,
  fetchCollectionSets,
  requireApiKey,
} from "../src/lib/brickeconomy";
import {
  brickeconomyMinifigId,
  brickeconomySetId,
  COLLECTION_DESCRIPTION,
  COLLECTION_ID,
  COLLECTION_TITLE,
  recomputeCollectionTotals,
} from "../src/lib/collection";

// ─────────────────────────────────────────────────────────────────────────────
// Import Bryan's LEGO collection from BrickEconomy into the local DB.
//
//   pnpm db:seed:lego
//
// Idempotent: each set/minifig upserts a CollectionItem under a deterministic
// "be-set-…" / "be-mf-…" id and refreshes its BRICKECONOMY evaluation in place.
// We DON'T touch curated data on re-import: notes, entries, and non-BrickEconomy
// evaluations all survive. Each item is guaranteed at least one entry. Once real
// sets land, the "ls-…" placeholders from prisma/seed.ts are removed; community
// proposals ("ls_…") are kept.
// ─────────────────────────────────────────────────────────────────────────────

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

/** Upsert the single BRICKECONOMY evaluation for an item. */
async function upsertBrickeconomyEval(
  itemId: string,
  value: number,
  retail: number,
): Promise<void> {
  const data = { value, retail };
  const existing = await prisma.collectionItemEvaluation.findFirst({
    where: { itemId, source: "BRICKECONOMY" },
    select: { id: true },
  });
  if (existing) {
    await prisma.collectionItemEvaluation.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.collectionItemEvaluation.create({
      data: { itemId, source: "BRICKECONOMY", ...data },
    });
  }
}

/**
 * Ensure the item carries one entry per owned copy. Top-up only: never deletes
 * or overwrites curated per-copy entries, so re-imports are safe.
 */
async function ensureEntryCount(itemId: string, copies: number): Promise<void> {
  const want = Math.max(1, copies);
  const have = await prisma.collectionItemEntry.count({ where: { itemId } });
  for (let n = have; n < want; n++) {
    await prisma.collectionItemEntry.create({ data: { itemId } });
  }
}

async function importSets(): Promise<number> {
  const apiKey = requireApiKey();
  const sets = await fetchCollectionSets(apiKey);
  console.log(`[brickeconomy] fetched ${sets.length} set(s)`);

  for (const s of sets) {
    const id = brickeconomySetId(s.setNumber, s.name);
    // Catalog fields BrickEconomy owns; market value goes to the evaluation.
    const sourced = {
      name: s.name,
      legoRef: s.setNumber,
      type: "SET" as const,
      year: s.year,
      pieces: s.pieces,
      imageUrl: s.imageUrl,
    };
    await prisma.collectionItem.upsert({
      where: { id },
      update: sourced,
      create: { id, collectionId: COLLECTION_ID, ...sourced },
    });
    await upsertBrickeconomyEval(id, s.currentValue, s.retailPrice);
    await ensureEntryCount(id, s.quantity);
  }

  // Real data has landed → drop the hardcoded placeholders from prisma/seed.ts.
  // Guarded by sets.length so a misconfigured run never empties the collection.
  if (sets.length > 0) {
    const { count } = await prisma.collectionItem.deleteMany({
      where: { id: { startsWith: "ls-" } },
    });
    if (count)
      console.log(`[brickeconomy] removed ${count} placeholder set(s)`);
  }

  return sets.length;
}

async function importMinifigs(): Promise<number> {
  const apiKey = requireApiKey();
  const minifigs = await fetchCollectionMinifigs(apiKey);
  console.log(`[brickeconomy] fetched ${minifigs.length} minifig(s)`);

  for (const m of minifigs) {
    const id = brickeconomyMinifigId(m.minifigNumber, m.name);
    const sourced = {
      name: m.name,
      legoRef: m.minifigNumber,
      type: "MINIFIGURE" as const,
      year: m.year,
      imageUrl: m.imageUrl,
    };
    await prisma.collectionItem.upsert({
      where: { id },
      update: sourced,
      create: { id, collectionId: COLLECTION_ID, ...sourced },
    });
    await upsertBrickeconomyEval(id, m.currentValue, m.retailPrice);
    await ensureEntryCount(id, m.quantity);
  }

  return minifigs.length;
}

async function ensureCollection(): Promise<void> {
  await prisma.collection.upsert({
    where: { id: COLLECTION_ID },
    update: { title: COLLECTION_TITLE, description: COLLECTION_DESCRIPTION },
    create: {
      id: COLLECTION_ID,
      title: COLLECTION_TITLE,
      description: COLLECTION_DESCRIPTION,
    },
  });
}

async function main() {
  console.log("Importing collection from BrickEconomy…");
  requireApiKey(); // fail fast before any DB writes if the key is missing
  await ensureCollection();
  const setCount = await importSets();
  const figCount = await importMinifigs();
  await recomputeCollectionTotals(prisma, COLLECTION_ID);
  console.log(`✓ Imported ${setCount} set(s) and ${figCount} minifig(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
