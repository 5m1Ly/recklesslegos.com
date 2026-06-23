export type Side = "creator" | "business" | "official" | "press";
export type CatKey =
  | "video"
  | "document"
  | "police"
  | "legal"
  | "social"
  | "press";

export const CATS: Record<CatKey, { label: string; cls: string }> = {
  video: { label: "Videos", cls: "video" },
  document: { label: "Documents", cls: "document" },
  police: { label: "Police Activity", cls: "police" },
  legal: { label: "Legal Filings", cls: "legal" },
  social: { label: "Social Media", cls: "social" },
  press: { label: "Press Coverage", cls: "press" },
};

export const SIDE_META: Record<Side, { label: string; tone: string }> = {
  creator: { label: "Creator side", tone: "var(--blue)" },
  business: { label: "Business side", tone: "var(--amber)" },
  official: { label: "Officials", tone: "var(--red)" },
  press: { label: "Press", tone: "var(--tx-1)" },
};

export const PLATFORM_META: Record<string, { abbr: string; tone: string }> = {
  X: { abbr: "X", tone: "var(--tx-0)" },
  Reddit: { abbr: "R", tone: "var(--red)" },
  TikTok: { abbr: "TT", tone: "var(--violet)" },
  Instagram: { abbr: "IG", tone: "var(--amber)" },
  Facebook: { abbr: "f", tone: "var(--blue)" },
  YouTube: { abbr: "YT", tone: "var(--red)" },
};

export const VIDEO_TIERS: [string, string, string][] = [
  [
    "creator",
    "Reckless Ben videos",
    "Videos from Ben Schneider's YouTube channels documenting the incident.",
  ],
  [
    "official",
    "Official sources",
    "American Fork Police Department and other official footage.",
  ],
  [
    "business",
    "Bricks and Minifigs",
    "Statements and responses from the franchise and corporate.",
  ],
  [
    "coverage",
    "Coverage & commentary",
    "News outlets, journalists, and other independent creators.",
  ],
];

// LEGO collection status/location/source vocabularies + display helpers now live
// in src/lib/collection.ts (alongside the value math), keyed by the Prisma enums.

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Format a whole-dollar amount, e.g. 12999 → "$12,999". */
export function fmtMoney(value: number): string {
  return usd.format(value);
}

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const mon = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][m - 1];
  return `${mon} ${d}, ${y}`;
}

// Minimal shape types used by components (no required relations)
export interface EventBase {
  id: string;
  date: string;
  title: string;
  cats: string[];
  desc: string;
  ongoing: boolean;
  relVideos: number;
  relDocs: number;
  relBodycam: number;
  relSocial: number;
}

export interface PersonBase {
  id: string;
  name: string;
  role: string;
  org: string;
  side: string;
  verified: boolean;
  orgFlag: boolean;
  bio: string;
}

export interface VideoBase {
  id: string;
  tier: string;
  title: string;
  source: string;
  platform: string;
  date: string;
  dur: string;
  views: string;
  official: boolean;
  url: string | null;
  eventId: string | null;
}

export interface BodycamBase {
  id: string;
  title: string;
  officer: string;
  unit: string;
  date: string;
  time: string;
  dur: string;
  location: string;
  type: string;
  released: string;
  url: string | null;
  eventId: string | null;
}

export interface DocumentBase {
  id: string;
  title: string;
  type: string;
  source: string;
  date: string;
  pages: number;
  tags: string[];
  summary: string;
  url: string | null;
  eventId: string | null;
}

export interface SocialPostBase {
  id: string;
  platform: string;
  author: string;
  handle: string;
  date: string;
  text: string;
  likes: string;
  reposts: string;
  replies: string;
  verified: boolean;
  url: string | null;
  eventId: string | null;
}

// --- Community-editable timeline ---

export type RefType = "video" | "bodycam" | "document" | "social" | "person";

export const REF_TYPES: Record<
  RefType,
  { label: string; plural: string; href: (id: string) => string }
> = {
  video: { label: "Video", plural: "Videos", href: () => "/videos" },
  bodycam: { label: "Bodycam", plural: "Bodycam", href: () => "/bodycam" },
  document: {
    label: "Document",
    plural: "Documents",
    href: () => "/documents",
  },
  social: { label: "Social post", plural: "Social", href: () => "/social" },
  person: { label: "Person", plural: "People", href: (id) => `/people/${id}` },
};

export const REF_TYPE_KEYS: RefType[] = [
  "video",
  "bodycam",
  "document",
  "social",
  "person",
];

export interface TimelineRefBase {
  refType: RefType;
  refId: string;
  // Resolved display fields (filled in when rendering)
  label?: string;
  href?: string;
}

export interface TimelineEntryBase {
  id: string;
  date: string;
  title: string;
  description: string;
  ongoing: boolean;
  refs: TimelineRefBase[];
}

// A picker option for an existing content item that can be referenced.
export interface RefOption {
  refType: RefType;
  refId: string;
  label: string;
  meta: string;
  date: string;
}

export type SubmissionOp = "add" | "edit" | "remove";

// Aliases used by components (Biome formatter-stable names)
export type Event = EventBase;
export type Person = PersonBase;
export type Video = VideoBase;
export type Bodycam = BodycamBase;
export type Document = DocumentBase;
export type SocialPost = SocialPostBase;
