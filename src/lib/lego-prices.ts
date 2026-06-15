import "server-only";
import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// BrickEconomy current-value refresh.
//
// ⚠️ IMPORTANT: BrickEconomy's API contract is only available once your access
// request is approved, and the exact base URL / auth header / response shape
// are NOT publicly documented. The plumbing below (batching, DB writes, cron,
// gating) is correct as-is — but you MUST confirm two things against the docs
// you receive and adjust `fetchSetValue` accordingly:
//   1. The request: endpoint path + how the API key is sent (header name).
//   2. The response: which JSON field holds the current market value (USD).
// Everything else can stay untouched.
// ─────────────────────────────────────────────────────────────────────────────

// Adjust to the base URL in your BrickEconomy API docs.
const API_BASE = "https://www.brickeconomy.com/api/v1";

export interface LegoRefreshResult {
  updated: number;
  total: number;
  missing: string[]; // set numbers the API didn't return a value for
}

/**
 * BrickEconomy keys sets by number with a variant suffix (e.g. "75192-1").
 * If the stored number has no suffix, assume the "-1" base variant.
 */
function normalizeSetNumber(setNumber: string): string {
  const n = setNumber.trim();
  return /-\d+$/.test(n) ? n : `${n}-1`;
}

/**
 * Fetch the current market value (whole USD) for one set, or null if the API
 * has no value for it. THIS is the function to reconcile with the real docs.
 */
async function fetchSetValue(
  setNumber: string,
  apiKey: string,
): Promise<number | null> {
  const url = `${API_BASE}/set/${encodeURIComponent(normalizeSetNumber(setNumber))}`;

  const res = await fetch(url, {
    headers: {
      // BrickEconomy may expect "x-apikey", "Authorization: Bearer …", or a
      // query param — confirm and adjust this single header.
      "x-apikey": apiKey,
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`BrickEconomy responded ${res.status}`);

  const data: unknown = await res.json();

  // Pull the current value out of the payload. The candidate keys below cover
  // the likely shapes; keep whichever your docs confirm and drop the rest.
  const value = extractValue(data);
  return value;
}

/** Defensive extraction of a USD value from an unknown JSON payload. */
function extractValue(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const candidates = [
    obj.currentValueNew,
    obj.current_value_new,
    obj.valueNew,
    obj.value_new,
    obj.currentValue,
    obj.retailPrice,
  ];
  for (const c of candidates) {
    const n = typeof c === "string" ? Number(c.replace(/[^0-9.]/g, "")) : c;
    if (typeof n === "number" && Number.isFinite(n) && n > 0) {
      return Math.round(n);
    }
  }
  return null;
}

/**
 * Refresh `currentValue` for every set that has a set number. Best-effort: a
 * failure on one set is recorded in `missing` and never aborts the batch.
 */
export async function refreshLegoValues(): Promise<LegoRefreshResult> {
  const apiKey = process.env.BRICKECONOMY_API_KEY?.trim();
  if (!apiKey) throw new Error("BRICKECONOMY_API_KEY is not configured");

  const sets = await prisma.legoSet.findMany({
    where: { setNumber: { not: "" } },
    select: { id: true, setNumber: true },
  });

  const missing: string[] = [];
  let updated = 0;

  for (const s of sets) {
    try {
      const value = await fetchSetValue(s.setNumber, apiKey);
      if (value == null) {
        missing.push(s.setNumber);
        continue;
      }
      await prisma.legoSet.update({
        where: { id: s.id },
        data: { currentValue: value },
      });
      updated++;
    } catch (err) {
      console.error(`[lego-prices] ${s.setNumber} failed:`, err);
      missing.push(s.setNumber);
    }
    // Be polite to the API between requests.
    await new Promise((r) => setTimeout(r, 250));
  }

  return { updated, total: sets.length, missing };
}
