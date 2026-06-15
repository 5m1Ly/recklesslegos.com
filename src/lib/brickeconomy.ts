// ─────────────────────────────────────────────────────────────────────────────
// BrickEconomy API client.
//
// Base URL and bearer-token auth are confirmed (see dlthub.com BrickEconomy
// source + the API reference you receive on approval). The exact JSON FIELD
// NAMES of the collection endpoints are not publicly documented, so the
// normalizers below probe several candidate keys for each value. After your
// first successful run, log one raw item (BRICKECONOMY_DEBUG=1) and trim the
// candidate lists to the keys your account actually returns.
//
// This module is intentionally framework-free (no "server-only") so it can be
// imported from both the Next.js runtime and the plain tsx seed script.
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = "https://www.brickeconomy.com/api/v1";

/** Read + validate the API key, throwing a clear error if it's missing. */
export function requireApiKey(): string {
  const key = process.env.BRICKECONOMY_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "BRICKECONOMY_API_KEY is not configured. Set it in .env (request access at brickeconomy.com).",
    );
  }
  return key;
}

/** Auth headers for a BrickEconomy request. Auth is a bearer token. */
export function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    accept: "application/json",
  };
}

const DEBUG = () => process.env.BRICKECONOMY_DEBUG === "1";

/** GET a BrickEconomy path and return the parsed JSON (or throw). */
async function get(
  path: string,
  apiKey: string,
  searchParams: Record<string, string | number> = {},
): Promise<unknown> {
  const url = new URL(`${API_BASE}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: authHeaders(apiKey),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `BrickEconomy GET ${path} → ${res.status} ${res.statusText}${
        body ? `: ${body.slice(0, 300)}` : ""
      }`,
    );
  }
  return res.json();
}

// ── Defensive field extraction ──────────────────────────────────────────────

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/** First non-empty string found under any of the candidate keys. */
function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

/** First finite, non-negative integer found under any candidate key. */
function pickInt(obj: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const raw = obj[k];
    const n =
      typeof raw === "string" ? Number(raw.replace(/[^0-9.]/g, "")) : raw;
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) {
      return Math.round(n);
    }
  }
  return 0;
}

/**
 * A collection row can be flat, or nest the catalog object under `set` /
 * `minifig` / `item` with collection metadata (quantity, paid price) alongside.
 * Merge both layers so a single record covers every candidate key.
 */
function flatten(item: unknown, nestedKeys: string[]): Record<string, unknown> {
  const top = asRecord(item) ?? {};
  let merged: Record<string, unknown> = { ...top };
  for (const k of nestedKeys) {
    const nested = asRecord(top[k]);
    if (nested) merged = { ...merged, ...nested };
  }
  return merged;
}

/** Pull the array of rows out of whatever envelope the endpoint returns. */
function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const obj = asRecord(payload);
  if (!obj) return [];
  for (const k of ["data", "items", "results", "sets", "minifigs", "rows"]) {
    if (Array.isArray(obj[k])) return obj[k] as unknown[];
  }
  return [];
}

// ── Normalized shapes (match the Prisma models) ─────────────────────────────

export interface NormalizedSet {
  setNumber: string;
  name: string;
  theme: string;
  year: number;
  pieces: number;
  retailPrice: number;
  currentValue: number;
  imageUrl: string | null;
}

export interface NormalizedMinifig {
  minifigNumber: string;
  name: string;
  theme: string;
  year: number;
  quantity: number;
  retailPrice: number;
  currentValue: number;
  imageUrl: string | null;
}

function normalizeSet(item: unknown): NormalizedSet | null {
  const o = flatten(item, ["set", "item"]);
  const setNumber = pickString(o, ["number", "setNumber", "set_number"]);
  const name = pickString(o, ["name", "title", "setName"]);
  if (!setNumber && !name) return null;
  const image = pickString(o, [
    "image",
    "imageUrl",
    "image_url",
    "thumbnail",
    "img",
  ]);
  return {
    setNumber,
    name: name || setNumber,
    theme: pickString(o, ["theme", "themeName", "theme_name"]) || "Star Wars",
    year: pickInt(o, ["year", "yearReleased", "year_released"]),
    pieces: pickInt(o, ["pieces", "pieceCount", "piece_count", "parts"]),
    retailPrice: pickInt(o, [
      "retailPrice",
      "retail_price",
      "retailPriceUS",
      "msrp",
    ]),
    currentValue: pickInt(o, [
      "currentValueNew",
      "current_value_new",
      "valueNew",
      "value_new",
      "currentValue",
      "current_value",
      "marketValue",
      "market_value",
      "value",
    ]),
    imageUrl: image || null,
  };
}

function normalizeMinifig(item: unknown): NormalizedMinifig | null {
  const o = flatten(item, ["minifig", "minifigure", "item"]);
  const minifigNumber = pickString(o, [
    "number",
    "minifigNumber",
    "minifig_number",
  ]);
  const name = pickString(o, ["name", "title", "minifigName"]);
  if (!minifigNumber && !name) return null;
  const image = pickString(o, [
    "image",
    "imageUrl",
    "image_url",
    "thumbnail",
    "img",
  ]);
  return {
    minifigNumber,
    name: name || minifigNumber,
    theme: pickString(o, ["theme", "themeName", "theme_name"]) || "Star Wars",
    year: pickInt(o, ["year", "yearReleased", "year_released"]),
    quantity: Math.max(1, pickInt(o, ["quantity", "qty", "count", "owned"])),
    retailPrice: pickInt(o, ["retailPrice", "retail_price"]),
    currentValue: pickInt(o, [
      "currentValueNew",
      "current_value_new",
      "valueNew",
      "value_new",
      "currentValue",
      "current_value",
      "valueUsed",
      "value_used",
      "marketValue",
      "market_value",
      "value",
    ]),
    imageUrl: image || null,
  };
}

// ── Paginated collection fetch ──────────────────────────────────────────────

const PAGE_SIZE = 100;
const MAX_PAGES = 200; // hard safety cap (≈20k items)

/**
 * Walk every page of a collection endpoint, normalizing as we go. Stops when a
 * page comes back empty or shorter than PAGE_SIZE. Page/size param names aren't
 * documented, so we send the common ones; extra params are harmless.
 */
async function fetchAllPages<T>(
  path: string,
  apiKey: string,
  normalize: (item: unknown) => T | null,
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const payload = await get(path, apiKey, {
      page,
      pageSize: PAGE_SIZE,
      limit: PAGE_SIZE,
    });
    const list = extractList(payload);
    if (DEBUG() && page === 1 && list[0]) {
      console.log(
        `[brickeconomy] sample ${path} item:`,
        JSON.stringify(list[0], null, 2),
      );
    }
    if (list.length === 0) break;
    for (const item of list) {
      const n = normalize(item);
      if (n) out.push(n);
    }
    if (list.length < PAGE_SIZE) break;
  }
  return out;
}

/** Fetch the authenticated account's full set collection. */
export function fetchCollectionSets(apiKey: string): Promise<NormalizedSet[]> {
  return fetchAllPages("collection/sets", apiKey, normalizeSet);
}

/** Fetch the authenticated account's full minifig collection. */
export function fetchCollectionMinifigs(
  apiKey: string,
): Promise<NormalizedMinifig[]> {
  return fetchAllPages("collection/minifigs", apiKey, normalizeMinifig);
}
