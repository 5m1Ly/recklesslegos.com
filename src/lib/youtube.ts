import "server-only";
import { prisma } from "@/lib/db";

const API_URL = "https://www.googleapis.com/youtube/v3/videos";

/** Extract the 11-char video ID from a YouTube watch / youtu.be / embed URL. */
export function extractYouTubeId(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  // youtu.be/<id>
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  // youtube.com/watch?v=<id>
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watch) return watch[1];
  // youtube.com/embed/<id> or /shorts/<id>
  const path = url.match(/youtube\.com\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
  if (path) return path[1];
  return null;
}

/** Convert an ISO-8601 duration ("PT1H25M10S") to "1:25:10" / "47:59". */
export function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "—";
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
}

/** Format a raw view count ("4096582") with thousands separators. */
export function formatViews(count: string | number): string {
  const n = Number(count);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "—";
}

export interface YouTubeStats {
  publishedAt: string; // YYYY-MM-DD (empty string if absent)
  duration: string; // formatted, or "—"
  views: string; // formatted, or "—"
}

interface ApiItem {
  id: string;
  snippet?: { publishedAt?: string };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
}

/**
 * Fetch stats for video IDs, batching in groups of 50 (the API's per-request
 * max). Returns a map keyed by video ID; IDs the API doesn't return (private,
 * deleted, or invalid) are simply absent from the map.
 */
export async function fetchVideoStats(
  ids: string[],
  apiKey: string,
): Promise<Map<string, YouTubeStats>> {
  const out = new Map<string, YouTubeStats>();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const params = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      id: chunk.join(","),
      key: apiKey,
    });
    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`YouTube API ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as { items?: ApiItem[] };
    for (const item of data.items ?? []) {
      out.set(item.id, {
        publishedAt: (item.snippet?.publishedAt ?? "").slice(0, 10),
        duration: item.contentDetails?.duration
          ? formatDuration(item.contentDetails.duration)
          : "—",
        views: item.statistics?.viewCount
          ? formatViews(item.statistics.viewCount)
          : "—",
      });
    }
  }
  return out;
}

export interface RefreshResult {
  total: number; // videos with a parseable YouTube URL
  updated: number; // rows written
  missing: string[]; // YouTube IDs the API didn't return
}

/**
 * Refresh date / duration / views for every Video row whose url is a YouTube
 * link. Editorial titles, source, and tier are left untouched — only the live
 * stats are overwritten. Requires YOUTUBE_API_KEY in the environment.
 */
export async function refreshYouTubeStats(): Promise<RefreshResult> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const videos = await prisma.video.findMany({
    select: { id: true, url: true },
  });

  // Map each row to its YouTube ID, dropping rows without a parseable URL
  // (Patreon links, coverage placeholders with url=null, etc.).
  const rows = videos
    .map((v) => ({ rowId: v.id, ytId: extractYouTubeId(v.url) }))
    .filter((r): r is { rowId: string; ytId: string } => r.ytId !== null);

  const stats = await fetchVideoStats(
    [...new Set(rows.map((r) => r.ytId))],
    apiKey,
  );

  let updated = 0;
  const missing: string[] = [];
  for (const { rowId, ytId } of rows) {
    const s = stats.get(ytId);
    if (!s) {
      missing.push(ytId);
      continue;
    }
    await prisma.video.update({
      where: { id: rowId },
      data: {
        // Only overwrite the date when the API actually returned one.
        ...(s.publishedAt ? { date: s.publishedAt } : {}),
        dur: s.duration,
        views: s.views,
      },
    });
    updated++;
  }

  return { total: rows.length, updated, missing };
}
