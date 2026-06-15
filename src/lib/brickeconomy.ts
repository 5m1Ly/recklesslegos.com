// ─────────────────────────────────────────────────────────────────────────────
// BrickEconomy API client (api/v1).
//
// Per the official API reference:
//   • Auth: `x-apikey: <key>` header. `Accept: application/json` and a
//     `User-Agent` are ALSO required — omitting either yields an auth error.
//   • Every response is wrapped as `{ "data": <object|list> }`; errors are
//     `{ "error": "<CodeName>" }` (e.g. WrongCredentialsError, QuotaExceededError).
//   • Values default to USD; pass `currency` (ISO 4217) to change.
//   • RATE LIMIT: 100 requests/day per key, reset 00:00 UTC → 429 on exceed.
//     Keep request counts low; the fetch loop below is quota-safe (it stops as
//     soon as a page yields no new rows rather than walking blindly).
//
// Field names below match the documented `/set` + `/minifig` objects. The set
// object has no image field, so imageUrl stays null. The collection endpoints'
// list-item shape is verified at runtime — set BRICKECONOMY_DEBUG=1 to log one.
//
// Framework-free (no "server-only") so the tsx seed script can import it too.
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

// ── Authentication ───────────────────────────────────────────────────────────
// BrickEconomy authenticates with an `x-apikey: <key>` header (per their API
// docs). That's the default below; the scheme stays CONFIGURABLE in case the
// contract changes. Override in .env:
//
//   BRICKECONOMY_AUTH_SCHEME = header | bearer | query   (default: header)
//   BRICKECONOMY_AUTH_NAME   = header/query param name
//                              (defaults: header→"x-apikey", query→"apikey")
//   BRICKECONOMY_AUTH_PREFIX = value prefix for the "header" scheme (e.g. none,
//                              or "Token "); ignored for bearer/query.
//
// header → `<NAME>: <PREFIX><key>`        (default: `x-apikey: <key>`)
// bearer → `Authorization: Bearer <key>`
// query  → `?<NAME>=<key>`                (e.g. `?apikey=<key>`)

type AuthScheme = "bearer" | "header" | "query";

function authScheme(): AuthScheme {
  const s = process.env.BRICKECONOMY_AUTH_SCHEME?.trim().toLowerCase();
  return s === "bearer" || s === "query" ? s : "header";
}

// BrickEconomy's example request lists `User-Agent` as a required header, and
// Cloudflare rejects the default Node/undici agent — so always send a real one.
// Override with BRICKECONOMY_USER_AGENT if needed. (Host is set by fetch.)
function userAgent(): string {
  return (
    process.env.BRICKECONOMY_USER_AGENT?.trim() ||
    "recklessbricks.com/1.0 (+https://recklessbricks.com)"
  );
}

/** Header(s) carrying the API key, per the configured scheme. */
export function authHeaders(apiKey: string): Record<string, string> {
  const base = {
    Host: "www.brickeconomy.com",
    Accept: "application/json",
    "User-Agent": userAgent(),
  };
  const scheme = authScheme();
  if (scheme === "bearer") {
    return { ...base, Authorization: `Bearer ${apiKey}` };
  }
  if (scheme === "header") {
    const name = process.env.BRICKECONOMY_AUTH_NAME?.trim() || "x-apikey";
    const prefix = process.env.BRICKECONOMY_AUTH_PREFIX ?? "";
    return { ...base, [name]: `${prefix}${apiKey}` };
  }
  return base; // query scheme carries the key in the URL, not a header
}

/** Query param(s) carrying the API key — only populated for the query scheme. */
export function authQuery(apiKey: string): Record<string, string> {
  if (authScheme() !== "query") return {};
  const name = process.env.BRICKECONOMY_AUTH_NAME?.trim() || "apikey";
  return { [name]: apiKey };
}

const DEBUG = () => process.env.BRICKECONOMY_DEBUG === "1";

/** GET a BrickEconomy path and return the parsed JSON (or throw). */
export async function brickeconomyGet(
  path: string,
  apiKey: string,
  searchParams: Record<string, string | number> = {},
): Promise<unknown> {
  const url = new URL(`${API_BASE}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries({
    ...searchParams,
    ...authQuery(apiKey),
  })) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: authHeaders(apiKey),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.text().catch(() => "")).trim();
    // Documented errors are JSON: { "error": "<CodeName>" }. A WAF/Cloudflare
    // rejection (before the API is reached) comes back as an HTML page instead.
    let code = "";
    try {
      const parsed = JSON.parse(body) as { error?: unknown };
      if (typeof parsed.error === "string") code = parsed.error;
    } catch {
      /* not JSON (e.g. HTML challenge page) */
    }
    let hint = "";
    if (res.status === 429) {
      hint =
        " — daily quota exceeded (100 requests/day, resets 00:00 UTC). " +
        "Re-run tomorrow.";
    } else if (res.status === 401 || res.status === 403) {
      hint =
        " — the API key was rejected. Confirm BRICKECONOMY_API_KEY is valid " +
        "and that the x-apikey/User-Agent/Accept headers are present " +
        `(scheme "${authScheme()}").`;
    }
    throw new Error(
      `BrickEconomy GET ${path} → ${res.status} ${res.statusText}` +
        (code ? ` [${code}]` : "") +
        hint,
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

/**
 * A collection response is `{ data: { <listKey>: [...], <listKey>_count: N } }`.
 * Return the row array plus the declared physical total, so we can detect an
 * incomplete import. The list is one ROW PER OWNED COPY (duplicates are how the
 * API expresses quantity), so we keep duplicates here and aggregate them later.
 */
function readCollectionPage(
  payload: unknown,
  listKey: string,
): { rows: unknown[]; total: number } {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root ?? {};
  const rows = Array.isArray(data[listKey]) ? (data[listKey] as unknown[]) : [];
  const total = pickInt(data, [`${listKey}_count`]);
  return { rows, total };
}

// ── Normalized shapes (match the Prisma models) ─────────────────────────────
// `quantity` is the number of copies owned, derived by aggregating the repeated
// rows the collection endpoint returns.

export interface NormalizedSet {
  setNumber: string;
  name: string;
  theme: string;
  year: number;
  pieces: number;
  quantity: number;
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

// One row = one owned copy → quantity starts at 1 and is summed in aggregate().
function normalizeSet(item: unknown): NormalizedSet | null {
  const o = flatten(item, ["set", "item"]);
  const setNumber = pickString(o, ["set_number", "setNumber", "number"]);
  const name = pickString(o, ["name", "title", "setName"]);
  if (!setNumber && !name) return null;
  const image = pickString(o, ["image", "image_url", "imageUrl", "thumbnail"]);
  return {
    setNumber,
    name: name || setNumber,
    theme: pickString(o, ["theme", "themeName", "theme_name"]) || "Star Wars",
    year: pickInt(o, ["year", "yearReleased", "year_released"]),
    pieces: pickInt(o, ["pieces_count", "pieces", "pieceCount", "piece_count"]),
    quantity: 1,
    // Collection rows use `retail_price`; the single-set endpoint uses
    // `retail_price_us`. Both are the USD MSRP (default currency).
    retailPrice: pickInt(o, ["retail_price", "retail_price_us", "msrp"]),
    // Collection rows give a single `current_value`; the single-set endpoint
    // splits new/used. Prefer new-sealed, fall back to used / generic.
    currentValue: pickInt(o, [
      "current_value",
      "current_value_new",
      "current_value_used",
      "value",
    ]),
    imageUrl: image || null,
  };
}

function normalizeMinifig(item: unknown): NormalizedMinifig | null {
  const o = flatten(item, ["minifig", "minifigure", "item"]);
  const minifigNumber = pickString(o, [
    "minifig_number",
    "minifigNumber",
    "number",
  ]);
  const name = pickString(o, ["name", "title", "minifigName"]);
  if (!minifigNumber && !name) return null;
  const image = pickString(o, ["image", "image_url", "imageUrl", "thumbnail"]);
  return {
    minifigNumber,
    name: name || minifigNumber,
    // Minifig collection rows carry only number/name/value, so theme + year are
    // not provided; keep the Star Wars default for this collection.
    theme: pickString(o, ["theme", "themeName", "theme_name"]) || "Star Wars",
    year: pickInt(o, ["year", "yearReleased", "year_released"]),
    quantity: 1,
    retailPrice: pickInt(o, ["retail_price", "retail_price_us"]),
    currentValue: pickInt(o, [
      "current_value",
      "current_value_new",
      "current_value_used",
      "value",
    ]),
    imageUrl: image || null,
  };
}

/** Collapse the per-copy rows into one entry per number, summing quantity. */
function aggregate<T extends { quantity: number }>(
  rows: T[],
  keyOf: (row: T) => string,
): T[] {
  const byKey = new Map<string, T>();
  for (const row of rows) {
    const key = keyOf(row);
    const existing = byKey.get(key);
    if (existing) existing.quantity += row.quantity;
    else byKey.set(key, { ...row });
  }
  return [...byKey.values()];
}

// ── Collection fetch ─────────────────────────────────────────────────────────

const PAGE_SIZE = 100;
// Low cap on purpose: the daily quota is 100 requests, so an import must never
// spend more than a handful of them.
const MAX_PAGES = 20;

/**
 * Fetch a full collection endpoint and aggregate the per-copy rows by number.
 *
 * The endpoint returns summary counts plus the row array. We page until we've
 * collected the declared total, a short/empty page arrives, or a page repeats
 * (some deployments ignore the page param and return everything each time — the
 * repeat guard stops us after one extra request instead of into the rate limit).
 * If we still fall short of the declared total, we warn rather than silently
 * importing a partial collection.
 */
async function fetchCollection<T extends { quantity: number }>(
  path: string,
  apiKey: string,
  listKey: string,
  normalize: (item: unknown) => T | null,
  rawNumberKeys: string[],
  keyOf: (row: T) => string,
): Promise<T[]> {
  const rows: T[] = [];
  let declaredTotal = 0;
  let prevSig = "";

  for (let page = 1; page <= MAX_PAGES; page++) {
    const payload = await brickeconomyGet(path, apiKey, {
      page,
      pageSize: PAGE_SIZE,
    });
    if (DEBUG() && page === 1) {
      console.log(
        `[brickeconomy] raw ${path} page 1:`,
        JSON.stringify(payload, null, 2).slice(0, 2000),
      );
    }
    const { rows: raw, total } = readCollectionPage(payload, listKey);
    if (total) declaredTotal = total;
    if (raw.length === 0) break;

    // Signature of this page's contents; if identical to the previous page the
    // endpoint isn't honoring `page`, so we already have everything.
    const first = pickString(asRecord(raw[0]) ?? {}, rawNumberKeys);
    const last = pickString(asRecord(raw[raw.length - 1]) ?? {}, rawNumberKeys);
    const sig = `${raw.length}|${first}|${last}`;
    if (sig === prevSig) break;
    prevSig = sig;

    for (const item of raw) {
      const n = normalize(item);
      if (n) rows.push(n);
    }

    if (raw.length < PAGE_SIZE) break;
    if (declaredTotal && rows.length >= declaredTotal) break;
  }

  if (declaredTotal && rows.length < declaredTotal) {
    console.warn(
      `[brickeconomy] ${path}: collected ${rows.length} of ${declaredTotal} ` +
        "rows — import may be incomplete (pagination not as expected).",
    );
  }

  return aggregate(rows, keyOf);
}

/** Fetch + aggregate the authenticated account's set collection. */
export function fetchCollectionSets(apiKey: string): Promise<NormalizedSet[]> {
  return fetchCollection(
    "collection/sets",
    apiKey,
    "sets",
    normalizeSet,
    ["set_number"],
    (s) => s.setNumber || s.name,
  );
}

/** Fetch + aggregate the authenticated account's minifig collection. */
export function fetchCollectionMinifigs(
  apiKey: string,
): Promise<NormalizedMinifig[]> {
  return fetchCollection(
    "collection/minifigs",
    apiKey,
    "minifigs",
    normalizeMinifig,
    ["minifig_number"],
    (m) => m.minifigNumber || m.name,
  );
}
