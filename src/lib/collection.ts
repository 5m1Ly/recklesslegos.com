// Shared, framework-free helpers for the LEGO collection. Safe to import from
// client components, server code, and the tsx seed/backfill scripts alike.
//
// The collection is modeled as CollectionItem → many CollectionItemEvaluation
// (one per price source) + many CollectionItemEntry (one per physical copy).
// Card/value math lives here so the page, the totals recompute, and the scripts
// all agree on how a per-source value and the cross-source average are derived.

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  CIDisposition,
  CIECondition,
  CIELocation,
  CIESource,
  CISubthemes,
  CIType,
} from "@/generated/prisma/enums";

// ── Display vocabularies ──────────────────────────────────────────────────────

export const SOURCE_ORDER: CIESource[] = [
  "BRICKECONOMY",
  "BRICKSET",
  "EBAY",
  "MANUAL",
  "CONTRIBUTORS",
];

export const SOURCE_LABELS: Record<CIESource, string> = {
  BRICKECONOMY: "BrickEconomy",
  BRICKSET: "Brickset",
  EBAY: "eBay (sold)",
  MANUAL: "Manual / appraisal",
  CONTRIBUTORS: "Contributors",
};

export const LOCATION_ORDER: CIELocation[] = [
  "STORE",
  "STORAGE",
  "HOME",
  "UNKNOWN",
];

export const LOCATION_LABELS: Record<CIELocation, string> = {
  HOME: "Home",
  STORE: "Store",
  STORAGE: "Storage",
  UNKNOWN: "Unknown",
};

export const DISPOSITION_ORDER: CIDisposition[] = [
  "FOR_SALE",
  "LAYAWAY",
  "SOLD",
  "RECOVERED",
  "STOLEN",
];

export const DISPOSITION_LABELS: Record<CIDisposition, string> = {
  FOR_SALE: "For Sale",
  SOLD: "Sold",
  LAYAWAY: "Layaway",
  STOLEN: "Stolen",
  RECOVERED: "Recovered",
};

// Accent tone per disposition, reusing the design-system color vars.
export const DISPOSITION_TONE: Record<CIDisposition, string> = {
  FOR_SALE: "var(--green)",
  LAYAWAY: "var(--violet)",
  SOLD: "var(--amber)",
  RECOVERED: "var(--blue)",
  STOLEN: "var(--red)",
};

export const CONDITION_LABELS: Record<CIECondition, string> = {
  BOXED: "Boxed",
  USED: "Used",
};

// ── Entry status rendering ────────────────────────────────────────────────────

export interface EntryStatusLike {
  location: CIELocation;
  isBuild: boolean;
  isBuildWOFigs: boolean;
  isCrack: boolean;
}

/** A human label combining physical location with the build/crack modifiers,
 *  e.g. "Store (build)" or "Storage (crack)". Disposition is shown separately. */
export function entryLocationLabel(e: EntryStatusLike): string {
  let label = LOCATION_LABELS[e.location];
  if (e.isBuildWOFigs) label += " (build w/o figs)";
  else if (e.isBuild) label += " (build)";
  if (e.isCrack) label += " (crack)";
  return label;
}

// ── Value math ────────────────────────────────────────────────────────────────

export interface EvalValueLike {
  source: CIESource;
  value: number;
}

/** Mean headline value per source, ignoring zero/unset readings. Several
 *  CONTRIBUTORS rows collapse to their average; single-row sources pass through. */
export function sourceValueMap(evals: EvalValueLike[]): Map<CIESource, number> {
  const acc = new Map<CIESource, { total: number; n: number }>();
  for (const e of evals) {
    if (!e.value || e.value <= 0) continue;
    const cur = acc.get(e.source) ?? { total: 0, n: 0 };
    cur.total += e.value;
    cur.n += 1;
    acc.set(e.source, cur);
  }
  const out = new Map<CIESource, number>();
  for (const [src, { total, n }] of acc) out.set(src, Math.round(total / n));
  return out;
}

/** Average market value across the distinct sources that have a reading. This is
 *  the headline figure shown on each card and summed into the page/collection totals. */
export function avgValue(evals: EvalValueLike[]): number {
  const perSource = [...sourceValueMap(evals).values()];
  if (perSource.length === 0) return 0;
  return Math.round(perSource.reduce((a, b) => a + b, 0) / perSource.length);
}

// ── Collection totals ─────────────────────────────────────────────────────────

/** Recompute the denormalized Collection.total* fields from its items + their
 *  evaluations. Value totals use the same cross-source average the cards show. */
export async function recomputeCollectionTotals(
  db: Pick<PrismaClient, "collectionItem" | "collection">,
  collectionId: string,
): Promise<void> {
  const items = await db.collectionItem.findMany({
    where: { collectionId },
    select: {
      type: true,
      evaluations: { select: { source: true, value: true } },
      _count: { select: { entries: true } },
    },
  });

  let totalSets = 0;
  let totalSetsValue = 0;
  let totalFigs = 0;
  let totalFigsValue = 0;
  for (const it of items) {
    const qty = it._count.entries; // one entry per owned copy
    const lineValue = avgValue(it.evaluations) * qty;
    if (it.type === "MINIFIGURE") {
      totalFigs += qty;
      totalFigsValue += lineValue;
    } else {
      totalSets += qty;
      totalSetsValue += lineValue;
    }
  }

  await db.collection.update({
    where: { id: collectionId },
    data: { totalSets, totalSetsValue, totalFigs, totalFigsValue },
  });
}

// ── Editor form flattening ────────────────────────────────────────────────────
// The proposal/admin editor (src/lib/proposal-types.ts) is a flat field list, so
// an item + its primary entry + a single price reading round-trip through these.

/** Map a legacy free-text LegoSet/LegoMinifig status to the disposition enum. */
export function legacyDisposition(status: string): CIDisposition {
  const s = status.trim().toLowerCase();
  if (s.startsWith("sold")) return "SOLD";
  if (s.startsWith("recovered")) return "RECOVERED";
  if (s.startsWith("stolen")) return "STOLEN";
  if (s.includes("layaway")) return "LAYAWAY";
  return "FOR_SALE";
}

export interface ItemEntryLike {
  condition: CIECondition;
  location: CIELocation;
  disposition: CIDisposition;
  isCrack: boolean;
  isBuild: boolean;
  isBuildWOFigs: boolean;
  costPrice: number;
  displayPrice: number;
  sellPrice: number;
}

export interface ItemEvalLike {
  source: CIESource;
  value: number;
  valueLow: number;
  valueHigh: number;
  note: string;
}

export interface ItemFormLike {
  name: string;
  legoRef: string;
  type: CIType;
  subtheme: CISubthemes;
  year: number;
  pieces: number;
  imageUrl: string | null;
  notes: string;
  entries: ItemEntryLike[];
  evaluations: ItemEvalLike[];
}

/** The evaluation the editor prefills/edits by default: BrickEconomy if present. */
export function preferredEvaluation<T extends { source: CIESource }>(
  evals: T[],
): T | undefined {
  return evals.find((e) => e.source === "BRICKECONOMY") ?? evals[0];
}

/** Flatten an item (+ primary entry + preferred evaluation) to editor form values. */
export function itemToFormValues(item: ItemFormLike): Record<string, string> {
  const e = item.entries[0];
  const ev = preferredEvaluation(item.evaluations);
  const s = (v: unknown): string => (v == null ? "" : String(v));
  const b = (v: boolean | undefined): string => (v ? "true" : "false");
  return {
    name: s(item.name),
    legoRef: s(item.legoRef),
    type: s(item.type),
    subtheme: s(item.subtheme),
    year: s(item.year),
    pieces: s(item.pieces),
    imageUrl: s(item.imageUrl),
    notes: s(item.notes),
    condition: s(e?.condition ?? "USED"),
    location: s(e?.location ?? "STORE"),
    disposition: s(e?.disposition ?? "FOR_SALE"),
    isCrack: b(e?.isCrack),
    isBuild: b(e?.isBuild),
    isBuildWOFigs: b(e?.isBuildWOFigs),
    costPrice: s(e?.costPrice ?? 0),
    displayPrice: s(e?.displayPrice ?? 0),
    sellPrice: s(e?.sellPrice ?? 0),
    evalSource: s(ev?.source ?? "BRICKECONOMY"),
    value: s(ev?.value ?? 0),
    valueLow: s(ev?.valueLow ?? 0),
    valueHigh: s(ev?.valueHigh ?? 0),
    evalNote: s(ev?.note ?? ""),
  };
}

// ── Structured editor data (admin multi-row editor) ───────────────────────────

export interface EditEntry {
  id: string; // "" for a not-yet-saved row
  condition: CIECondition;
  location: CIELocation;
  disposition: CIDisposition;
  isCrack: boolean;
  isBuild: boolean;
  isBuildWOFigs: boolean;
  costPrice: number;
  displayPrice: number;
  sellPrice: number;
}

export interface EditEvaluation {
  id: string;
  source: CIESource;
  value: number;
  valueLow: number;
  valueHigh: number;
  retail: number;
  note: string;
}

export interface ItemEditData {
  id: string;
  autoEvaluate: boolean;
  name: string;
  legoRef: string;
  type: CIType;
  subtheme: CISubthemes;
  year: number;
  pieces: number;
  imageUrl: string;
  notes: string;
  entries: EditEntry[];
  evaluations: EditEvaluation[];
}

interface FullItemLike extends ItemFormLike {
  id: string;
  autoEvaluate: boolean;
  entries: (ItemEntryLike & { id: string })[];
  evaluations: (ItemEvalLike & {
    id: string;
    valueLow: number;
    valueHigh: number;
    retail: number;
  })[];
}

/** Full structured snapshot of an item for the admin editor (every entry + source). */
export function itemToEditData(item: FullItemLike): ItemEditData {
  return {
    id: item.id,
    autoEvaluate: item.autoEvaluate,
    name: item.name,
    legoRef: item.legoRef,
    type: item.type,
    subtheme: item.subtheme,
    year: item.year,
    pieces: item.pieces,
    imageUrl: item.imageUrl ?? "",
    notes: item.notes,
    entries: item.entries.map((e) => ({
      id: e.id,
      condition: e.condition,
      location: e.location,
      disposition: e.disposition,
      isCrack: e.isCrack,
      isBuild: e.isBuild,
      isBuildWOFigs: e.isBuildWOFigs,
      costPrice: e.costPrice,
      displayPrice: e.displayPrice,
      sellPrice: e.sellPrice,
    })),
    evaluations: item.evaluations.map((v) => ({
      id: v.id,
      source: v.source,
      value: v.value,
      valueLow: v.valueLow,
      valueHigh: v.valueHigh,
      retail: v.retail,
      note: v.note,
    })),
  };
}

// ── Deterministic BrickEconomy ids ────────────────────────────────────────────
// The seed and the refresh must derive the SAME CollectionItem id for a given
// catalog row so values land on the existing item instead of creating duplicates.

/** Lowercase, hyphenated fallback id segment for rows without a catalog number. */
export function slugRef(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "unknown"
  );
}

export function brickeconomySetId(setNumber: string, name: string): string {
  return `be-set-${slugRef(setNumber || name)}`;
}

export function brickeconomyMinifigId(
  minifigNumber: string,
  name: string,
): string {
  return `be-mf-${slugRef(minifigNumber || name)}`;
}

// The single collection this site tracks. Backfill/seed upsert it; refresh reads it.
export const COLLECTION_ID = "bryan-sw";
export const COLLECTION_TITLE = "Bryan Mansell's LEGO Star Wars Collection";
export const COLLECTION_DESCRIPTION =
  "An itemized inventory of Bryan Mansell's LEGO Star Wars collection.";
