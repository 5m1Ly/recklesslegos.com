import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import { PLATFORM_META, SIDE_META, type SubmissionOp, VIDEO_TIERS } from "@/lib/types";

// Single source of truth for visitor-proposable content types. Drives the
// public compose form, the admin edit-before-accept form, validation, and the
// apply mutation that writes an accepted proposal into the real tables.

// Transaction-client type, derived from $transaction's callback so it tracks
// whatever the generated client calls it.
type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export type ProposalType =
  | "video"
  | "bodycam"
  | "document"
  | "social"
  | "person";

export const PROPOSAL_TYPE_KEYS: ProposalType[] = [
  "video",
  "bodycam",
  "document",
  "social",
  "person",
];

export function isProposalType(v: string): v is ProposalType {
  return (PROPOSAL_TYPE_KEYS as string[]).includes(v);
}

export type InputKind =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "number"
  | "boolean"
  | "tags"
  | "url";

export interface FieldDef {
  key: string;
  label: string;
  kind: InputKind;
  required?: boolean;
  options?: string[];
  maxLen?: number;
  hint?: string;
}

export interface ProposalTypeDef {
  type: ProposalType;
  label: string;
  plural: string;
  basePath: string;
  idPrefix: string;
  fields: FieldDef[];
  labelOf: (p: Record<string, unknown>) => string;
}

const TIERS = VIDEO_TIERS.map((t) => t[0]);
const SOCIAL_PLATFORMS = Object.keys(PLATFORM_META);
const VIDEO_PLATFORMS = ["YouTube", "Patreon", "X", "TikTok", "Instagram", "Facebook"];
const SIDES = Object.keys(SIDE_META);

export const PROPOSAL_TYPES: Record<ProposalType, ProposalTypeDef> = {
  video: {
    type: "video",
    label: "Video",
    plural: "Videos",
    basePath: "/videos",
    idPrefix: "v",
    labelOf: (p) => String(p.title ?? "Untitled video"),
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, maxLen: 200 },
      { key: "tier", label: "Section", kind: "select", required: true, options: TIERS, hint: "Where it appears on the videos page" },
      { key: "source", label: "Source / channel", kind: "text", required: true, maxLen: 120 },
      { key: "platform", label: "Platform", kind: "select", required: true, options: VIDEO_PLATFORMS },
      { key: "date", label: "Date", kind: "date", required: true },
      { key: "dur", label: "Duration", kind: "text", hint: "e.g. 12:34 (optional)" },
      { key: "url", label: "URL", kind: "url", hint: "Link to the video" },
      { key: "official", label: "Official footage", kind: "boolean" },
    ],
  },
  bodycam: {
    type: "bodycam",
    label: "Bodycam",
    plural: "Bodycam footage",
    basePath: "/bodycam",
    idPrefix: "bc",
    labelOf: (p) => String(p.title ?? "Untitled footage"),
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, maxLen: 200 },
      { key: "officer", label: "Officer", kind: "text" },
      { key: "unit", label: "Unit", kind: "text" },
      { key: "date", label: "Date", kind: "date", required: true },
      { key: "time", label: "Time", kind: "text", hint: "e.g. 14:32 (optional)" },
      { key: "dur", label: "Duration", kind: "text" },
      { key: "location", label: "Location", kind: "text" },
      { key: "type", label: "Footage type", kind: "text" },
      { key: "released", label: "Released", kind: "text", hint: "Release date or note" },
      { key: "url", label: "URL", kind: "url" },
    ],
  },
  document: {
    type: "document",
    label: "Document",
    plural: "Documents",
    basePath: "/documents",
    idPrefix: "d",
    labelOf: (p) => String(p.title ?? "Untitled document"),
    fields: [
      { key: "title", label: "Title", kind: "text", required: true, maxLen: 200 },
      { key: "type", label: "Document type", kind: "text", required: true, hint: "e.g. Court Filing, Police Report" },
      { key: "source", label: "Source", kind: "text", required: true },
      { key: "date", label: "Date", kind: "date", required: true },
      { key: "pages", label: "Pages", kind: "number" },
      { key: "tags", label: "Tags", kind: "tags", hint: "Comma-separated" },
      { key: "summary", label: "Summary", kind: "textarea", required: true, maxLen: 2000 },
      { key: "url", label: "URL", kind: "url" },
    ],
  },
  social: {
    type: "social",
    label: "Social post",
    plural: "Social posts",
    basePath: "/social",
    idPrefix: "s",
    labelOf: (p) => `${p.author ?? "?"} on ${p.platform ?? "?"}`,
    fields: [
      { key: "platform", label: "Platform", kind: "select", required: true, options: SOCIAL_PLATFORMS },
      { key: "author", label: "Author", kind: "text", required: true },
      { key: "handle", label: "Handle", kind: "text", hint: "@handle or account name" },
      { key: "date", label: "Date", kind: "date", required: true },
      { key: "text", label: "Post text", kind: "textarea", required: true, maxLen: 2000 },
      { key: "url", label: "URL", kind: "url" },
      { key: "verified", label: "Verified account", kind: "boolean" },
    ],
  },
  person: {
    type: "person",
    label: "Person",
    plural: "People",
    basePath: "/people",
    idPrefix: "p",
    labelOf: (p) => String(p.name ?? "Unnamed"),
    fields: [
      { key: "name", label: "Name", kind: "text", required: true, maxLen: 120 },
      { key: "role", label: "Role", kind: "text", required: true },
      { key: "org", label: "Organization", kind: "text" },
      { key: "side", label: "Side", kind: "select", required: true, options: SIDES },
      { key: "bio", label: "Bio", kind: "textarea", maxLen: 2000 },
      { key: "verified", label: "Verified", kind: "boolean" },
      { key: "orgFlag", label: "Organization account", kind: "boolean" },
    ],
  },
};

// ─── validation ────────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns an error string, or null when the payload is valid for (type, op). */
export function validateProposal(
  type: ProposalType,
  op: SubmissionOp,
  payload: Record<string, unknown>,
): string | null {
  if (op === "remove") return null; // only targetId matters; checked by caller
  const def = PROPOSAL_TYPES[type];

  for (const f of def.fields) {
    const raw = payload[f.key];
    const val = typeof raw === "string" ? raw.trim() : raw;
    const empty = val === undefined || val === null || val === "";

    if (f.required && empty && f.kind !== "boolean")
      return `${f.label} is required.`;
    if (empty) continue;

    if (f.kind === "date" && !DATE_RE.test(String(val)))
      return `${f.label} must be a date (YYYY-MM-DD).`;
    if (f.kind === "select" && f.options && !f.options.includes(String(val)))
      return `${f.label} must be one of: ${f.options.join(", ")}.`;
    if (f.kind === "number" && !Number.isFinite(Number(val)))
      return `${f.label} must be a number.`;
    if (
      f.kind === "url" &&
      !/^https?:\/\//i.test(String(val))
    )
      return `${f.label} must be a valid http(s) URL.`;
    if (f.maxLen && String(val).length > f.maxLen)
      return `${f.label} is too long (max ${f.maxLen}).`;
  }
  return null;
}

// ─── coercion + apply ────────────────────────────────────────────────────────

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : v == null ? "" : String(v));
const strOrDash = (v: unknown): string => str(v) || "—";
const bool = (v: unknown): boolean => v === true || v === "true";
const nurl = (v: unknown): string | null => str(v) || null;
const int = (v: unknown): number => {
  const n = Number(str(v));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};
const tags = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String);
  return str(v)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
};

/** Generate a collision-safe id for a newly created content row. */
function genId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/**
 * Apply an accepted proposal to the real content tables, inside the caller's
 * transaction. An explicit per-type switch keeps Prisma's create/update typing.
 */
export async function applyProposal(
  tx: Tx,
  type: ProposalType,
  op: SubmissionOp,
  targetId: string | null,
  payload: Record<string, unknown>,
): Promise<void> {
  const p = payload;

  switch (type) {
    case "video": {
      if (op === "remove") {
        if (targetId) await tx.video.delete({ where: { id: targetId } });
        return;
      }
      const data = {
        tier: str(p.tier),
        title: str(p.title),
        source: str(p.source),
        platform: str(p.platform),
        date: str(p.date),
        dur: strOrDash(p.dur),
        official: bool(p.official),
        url: nurl(p.url),
      };
      if (op === "add")
        await tx.video.create({ data: { id: genId("v"), views: "—", ...data } });
      else if (targetId)
        await tx.video.update({ where: { id: targetId }, data });
      return;
    }
    case "bodycam": {
      if (op === "remove") {
        if (targetId) await tx.bodycam.delete({ where: { id: targetId } });
        return;
      }
      const data = {
        title: str(p.title),
        officer: strOrDash(p.officer),
        unit: strOrDash(p.unit),
        date: str(p.date),
        time: strOrDash(p.time),
        dur: strOrDash(p.dur),
        location: strOrDash(p.location),
        type: strOrDash(p.type),
        released: strOrDash(p.released),
        url: nurl(p.url),
      };
      if (op === "add")
        await tx.bodycam.create({ data: { id: genId("bc"), ...data } });
      else if (targetId)
        await tx.bodycam.update({ where: { id: targetId }, data });
      return;
    }
    case "document": {
      if (op === "remove") {
        if (targetId) await tx.document.delete({ where: { id: targetId } });
        return;
      }
      const data = {
        title: str(p.title),
        type: str(p.type),
        source: str(p.source),
        date: str(p.date),
        pages: int(p.pages),
        tags: tags(p.tags),
        summary: str(p.summary),
        url: nurl(p.url),
      };
      if (op === "add")
        await tx.document.create({ data: { id: genId("d"), ...data } });
      else if (targetId)
        await tx.document.update({ where: { id: targetId }, data });
      return;
    }
    case "social": {
      if (op === "remove") {
        if (targetId) await tx.socialPost.delete({ where: { id: targetId } });
        return;
      }
      const data = {
        platform: str(p.platform),
        author: str(p.author),
        handle: strOrDash(p.handle),
        date: str(p.date),
        text: str(p.text),
        verified: bool(p.verified),
        url: nurl(p.url),
      };
      if (op === "add")
        await tx.socialPost.create({
          data: { id: genId("s"), likes: "—", reposts: "—", replies: "—", ...data },
        });
      else if (targetId)
        await tx.socialPost.update({ where: { id: targetId }, data });
      return;
    }
    case "person": {
      if (op === "remove") {
        if (targetId) await tx.person.delete({ where: { id: targetId } });
        return;
      }
      const data = {
        name: str(p.name),
        role: str(p.role),
        org: str(p.org),
        side: str(p.side),
        bio: str(p.bio),
        verified: bool(p.verified),
        orgFlag: bool(p.orgFlag),
      };
      if (op === "add")
        await tx.person.create({ data: { id: genId("p"), ...data } });
      else if (targetId)
        await tx.person.update({ where: { id: targetId }, data });
      return;
    }
  }
}

/**
 * Load an existing content row as a flat payload, for prefilling edit/remove
 * proposals. Returns null if the row doesn't exist.
 */
export async function loadContentRow(
  prisma: PrismaClient,
  type: ProposalType,
  id: string,
): Promise<Record<string, unknown> | null> {
  switch (type) {
    case "video":
      return prisma.video.findUnique({ where: { id } });
    case "bodycam":
      return prisma.bodycam.findUnique({ where: { id } });
    case "document":
      return prisma.document.findUnique({ where: { id } });
    case "social":
      return prisma.socialPost.findUnique({ where: { id } });
    case "person":
      return prisma.person.findUnique({ where: { id } });
  }
}
