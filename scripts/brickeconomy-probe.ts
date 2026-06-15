import "dotenv/config";
import { brickeconomyGet, requireApiKey } from "../src/lib/brickeconomy";

// One-shot diagnostic for the BrickEconomy API. Prints the raw response from a
// known-good documented endpoint (proves auth works + shows the envelope) and
// from the two collection endpoints we're trying to seed from.
//
//   pnpm tsx scripts/brickeconomy-probe.ts
//
// Uses ~3 of your 100 daily requests.

const apiKey = requireApiKey();

async function probe(label: string, path: string) {
  console.log(`\n──────── ${label}: GET /${path} ────────`);
  try {
    const data = await brickeconomyGet(path, apiKey);
    console.log(JSON.stringify(data, null, 2).slice(0, 4000));
  } catch (err) {
    console.log("ERROR:", err instanceof Error ? err.message : err);
  }
}

async function main() {
  // 1) Documented single-set lookup (Ewok Village from the docs example).
  await probe("documented set", "set/10236-1");
  // 2) The collection endpoints we want to seed from.
  await probe("collection sets", "collection/sets");
  await probe("collection minifigs", "collection/minifigs");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
