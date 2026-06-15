import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  fetchCollectionMinifigs,
  fetchCollectionSets,
  type NormalizedMinifig,
  type NormalizedSet,
  requireApiKey,
} from "../src/lib/brickeconomy";

// ─────────────────────────────────────────────────────────────────────────────
// Import Bryan's LEGO collection from BrickEconomy into the local DB.
//
//   pnpm db:seed:lego
//
// Idempotent: each set/minifig upserts under a deterministic "be-set-…" /
// "be-mf-…" id, so re-running refreshes catalog data + current values in place.
// On update we DON'T touch status/soldPrice/notes — those are curated in-app and
// must survive a re-import. Once real sets are imported, the placeholder "ls-…"
// sets from prisma/seed.ts are removed; community proposals ("ls_…") are kept.
// ─────────────────────────────────────────────────────────────────────────────

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

/** Lowercase, hyphenated fallback id segment for rows without a catalog number. */
function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "unknown"
  );
}

function setId(s: NormalizedSet): string {
  return `be-set-${slug(s.setNumber || s.name)}`;
}

function minifigId(m: NormalizedMinifig): string {
  return `be-mf-${slug(m.minifigNumber || m.name)}`;
}

async function importSets(): Promise<number> {
  const apiKey = requireApiKey();
  const sets = await fetchCollectionSets(apiKey);
  console.log(`[brickeconomy] fetched ${sets.length} set(s)`);

  for (const s of sets) {
    const id = setId(s);
    // Catalog + market fields BrickEconomy owns. Curated fields (status,
    // soldPrice, notes) are set only on create and never overwritten on update.
    const sourced = {
      name: s.name,
      setNumber: s.setNumber,
      theme: s.theme,
      year: s.year,
      pieces: s.pieces,
      quantity: s.quantity,
      retailPrice: s.retailPrice,
      currentValue: s.currentValue,
      imageUrl: s.imageUrl,
    };
    await prisma.legoSet.upsert({
      where: { id },
      update: sourced,
      create: { id, ...sourced },
    });
  }

  // Real data has landed → drop the hardcoded placeholders from prisma/seed.ts.
  // Guarded by sets.length so a misconfigured run never empties the collection.
  if (sets.length > 0) {
    const { count } = await prisma.legoSet.deleteMany({
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
    const id = minifigId(m);
    const sourced = {
      name: m.name,
      minifigNumber: m.minifigNumber,
      theme: m.theme,
      year: m.year,
      quantity: m.quantity,
      retailPrice: m.retailPrice,
      currentValue: m.currentValue,
      imageUrl: m.imageUrl,
    };
    await prisma.legoMinifig.upsert({
      where: { id },
      update: sourced,
      create: { id, ...sourced },
    });
  }

  return minifigs.length;
}

async function main() {
  console.log("Importing collection from BrickEconomy…");
  requireApiKey(); // fail fast before any DB writes if the key is missing
  const setCount = await importSets();
  const figCount = await importMinifigs();
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
