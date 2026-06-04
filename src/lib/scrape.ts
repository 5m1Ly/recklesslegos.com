import "server-only";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";

// Scrapes two public case-archive sites for legal documents and bodycam videos,
// then upserts them into the Document / Bodycam tables. Files are linked by
// their source URL (not downloaded). Scraped rows use "ext-" IDs so they are
// deduped on re-run and preserved across reseeds (see prisma/seed.ts).
//
//   bamsucks.com            — a flat page linking legal PDFs at the site root
//   recklessben.tufo.dev    — a recursive directory listing of docs + media
//
// Disable by setting SCRAPE_ENABLED=false.

const UA = "recklessbricks.com archive bot (+https://recklessbricks.com)";
const BAMSUCKS = "https://bamsucks.com/";
const TUFO = "https://recklessben.tufo.dev/";

// Bound the directory crawl so a deep/looping listing can't run away.
const MAX_DEPTH = 5;
const MAX_DIRS = 80;
const FETCH_TIMEOUT_MS = 15000;

const DOC_EXTS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".doc",
  ".docx",
  ".txt",
  ".xlsx",
]);
const VIDEO_EXTS = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"]);

interface ScrapedDoc {
  id: string;
  title: string;
  type: string;
  source: string;
  date: string;
  pages: number;
  tags: string[];
  summary: string;
  url: string;
}

interface ScrapedCam {
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
  url: string;
}

// ─── helpers ───────────────────────────────────────────────────────────────

async function getHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.error(`[scrape] fetch failed for ${url}:`, err);
    return null;
  }
}

function extOf(pathname: string): string {
  const last = pathname.split("/").pop() ?? "";
  const dot = last.lastIndexOf(".");
  return dot >= 0 ? last.slice(dot).toLowerCase() : "";
}

function slugify(s: string): string {
  return decodeURIComponent(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function titleFromPath(pathname: string): string {
  const base = decodeURIComponent(pathname.split("/").pop() ?? "");
  return base
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function classifyDocType(text: string): string {
  const s = text.toLowerCase();
  if (
    /warrant|booking|probable cause|incident report|trespass|harassment|stalking|police/.test(
      s,
    )
  )
    return "Police Record";
  if (
    /complaint|motion|order|tro|restraining|judgment|claim|errata|docket|filing|consent|mediation|hearing|response|notice/.test(
      s,
    )
  )
    return "Court Filing";
  if (/fdd|franchise agreement|disclosure/.test(s)) return "Franchise Document";
  return "Legal Document";
}

function parsePages(text: string): number {
  const m = text.match(/\((\d+)\s*pages?\)/i);
  return m ? Number(m[1]) : 1;
}

function makeDoc(
  url: string,
  linkText: string,
  host: string,
  idPrefix: string,
): ScrapedDoc {
  const pathname = new URL(url).pathname;
  const title = linkText.trim() || titleFromPath(pathname);
  const type = classifyDocType(`${title} ${pathname}`);
  return {
    id: `ext-doc-${idPrefix}-${slugify(pathname)}`,
    title,
    type,
    source: host,
    date: "—",
    pages: parsePages(linkText),
    tags: [type.toLowerCase().replace(/\s+/g, "-")],
    summary: `${title} (${type}) — archived from ${host}.`,
    url,
  };
}

function makeCam(url: string, host: string, idPrefix: string): ScrapedCam {
  const pathname = new URL(url).pathname;
  const decoded = decodeURIComponent(pathname);
  const isAfpd = /american fork police|afpd/i.test(decoded);
  // Folder the file lives in, used as a location hint.
  const parts = decoded.split("/").filter(Boolean);
  const folder = parts.length > 1 ? parts[parts.length - 2] : host;
  return {
    id: `ext-bc-${idPrefix}-${slugify(pathname)}`,
    title: titleFromPath(pathname),
    officer: isAfpd ? "American Fork PD" : "—",
    unit: isAfpd ? "AFPD" : "—",
    date: "—",
    time: "—",
    dur: "—",
    location: folder,
    type: isAfpd ? "Police video" : "Video",
    released: "—",
    url,
  };
}

// ─── bamsucks.com (flat link page) ─────────────────────────────────────────

async function scrapeBamsucks(): Promise<{
  docs: ScrapedDoc[];
  cams: ScrapedCam[];
}> {
  const html = await getHtml(BAMSUCKS);
  if (!html) return { docs: [], cams: [] };

  const $ = cheerio.load(html);
  const docs = new Map<string, ScrapedDoc>();
  const cams = new Map<string, ScrapedCam>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#")) return;
    let abs: URL;
    try {
      abs = new URL(href, BAMSUCKS);
    } catch {
      return;
    }
    if (abs.host !== new URL(BAMSUCKS).host) return;
    const ext = extOf(abs.pathname);
    const text = $(el).text();
    if (DOC_EXTS.has(ext)) {
      const d = makeDoc(abs.toString(), text, "bamsucks.com", "bam");
      docs.set(d.id, d);
    } else if (VIDEO_EXTS.has(ext)) {
      const c = makeCam(abs.toString(), "bamsucks.com", "bam");
      cams.set(c.id, c);
    }
  });

  return { docs: [...docs.values()], cams: [...cams.values()] };
}

// ─── recklessben.tufo.dev (recursive directory listing) ────────────────────

async function scrapeTufo(): Promise<{
  docs: ScrapedDoc[];
  cams: ScrapedCam[];
}> {
  const base = new URL(TUFO);
  const docs = new Map<string, ScrapedDoc>();
  const cams = new Map<string, ScrapedCam>();
  const visited = new Set<string>();
  let dirCount = 0;

  async function walk(dirUrl: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH || dirCount >= MAX_DIRS || visited.has(dirUrl))
      return;
    visited.add(dirUrl);
    dirCount++;

    const html = await getHtml(dirUrl);
    if (!html) return;
    const $ = cheerio.load(html);

    const hrefs: string[] = [];
    $("a[href]").each((_, el) => {
      const h = $(el).attr("href");
      if (h) hrefs.push(h);
    });

    for (const href of hrefs) {
      // Skip sort/query links, anchors, and parent-directory links.
      if (href.startsWith("?") || href.startsWith("#") || href === "../")
        continue;
      let abs: URL;
      try {
        abs = new URL(href, dirUrl);
      } catch {
        continue;
      }
      // Stay on-host and at or below the archive root.
      if (abs.host !== base.host || !abs.pathname.startsWith(base.pathname))
        continue;

      const url = abs.toString();
      if (url.endsWith("/")) {
        if (url !== dirUrl) await walk(url, depth + 1);
        continue;
      }
      const ext = extOf(abs.pathname);
      if (VIDEO_EXTS.has(ext)) {
        const c = makeCam(url, "recklessben.tufo.dev", "tufo");
        cams.set(c.id, c);
      } else if (DOC_EXTS.has(ext)) {
        const d = makeDoc(url, "", "recklessben.tufo.dev", "tufo");
        docs.set(d.id, d);
      }
    }
  }

  await walk(TUFO, 0);
  return { docs: [...docs.values()], cams: [...cams.values()] };
}

// ─── orchestration + persistence ───────────────────────────────────────────

export interface ScrapeResult {
  documents: number;
  bodycams: number;
}

/** Scrape both sources and upsert results. Safe to run repeatedly. */
export async function runScrape(): Promise<ScrapeResult> {
  if (process.env.SCRAPE_ENABLED === "false") {
    return { documents: 0, bodycams: 0 };
  }

  const results = await Promise.all([
    scrapeBamsucks().catch((e) => {
      console.error("[scrape] bamsucks failed:", e);
      return { docs: [], cams: [] };
    }),
    scrapeTufo().catch((e) => {
      console.error("[scrape] tufo failed:", e);
      return { docs: [], cams: [] };
    }),
  ]);

  const docs = new Map<string, ScrapedDoc>();
  const cams = new Map<string, ScrapedCam>();
  for (const r of results) {
    for (const d of r.docs) docs.set(d.id, d);
    for (const c of r.cams) cams.set(c.id, c);
  }

  for (const d of docs.values()) {
    const { id, ...rest } = d;
    await prisma.document.upsert({
      where: { id },
      create: { id, ...rest },
      // Keep stable; only refresh the title/type in case classification changed.
      update: { title: rest.title, type: rest.type },
    });
  }

  for (const c of cams.values()) {
    const { id, ...rest } = c;
    await prisma.bodycam.upsert({
      where: { id },
      create: { id, ...rest },
      update: { title: rest.title, type: rest.type },
    });
  }

  return { documents: docs.size, bodycams: cams.size };
}
