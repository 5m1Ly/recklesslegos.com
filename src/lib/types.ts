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

// Aliases used by components (Biome formatter-stable names)
export type Event = EventBase;
export type Person = PersonBase;
export type Video = VideoBase;
export type Bodycam = BodycamBase;
export type Document = DocumentBase;
export type SocialPost = SocialPostBase;
