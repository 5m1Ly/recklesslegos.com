import "server-only";
import { prisma } from "@/lib/db";

// Realtime ingestion of public posts/videos from official platform APIs.
//
// Everything here is env-gated: a source runs only when its credentials AND
// at least one query/target are configured. With nothing set, runIngestion()
// is a no-op. Ingested rows use "ext-" prefixed IDs so they can be upserted
// (deduped) and are preserved across reseeds (see prisma/seed.ts).
//
// Coverage by platform (official APIs only):
//   YouTube  — Data API v3 search.list           (needs YOUTUBE_API_KEY)
//   Reddit   — userless OAuth + search            (needs REDDIT_CLIENT_ID/SECRET)
//   X        — API v2 recent search (PAID access) (needs X_BEARER_TOKEN)
//   TikTok / Instagram / Facebook — no official public-post discovery exists,
//     so they cannot be ingested without scrapers (out of scope) or
//     research/owned-account access. Intentionally unimplemented.

const UA = "recklessbricks.com ingestion bot (+https://recklessbricks.com)";

/** Split a comma/newline separated env var into trimmed, non-empty entries. */
function list(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface IngestedPost {
  id: string;
  platform: string;
  author: string;
  handle: string;
  date: string; // YYYY-MM-DD
  text: string;
  likes: string;
  reposts: string;
  replies: string;
  verified: boolean;
  url: string;
}

interface IngestedVideo {
  id: string;
  title: string;
  source: string;
  date: string; // YYYY-MM-DD
  url: string;
}

function epochToDate(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function truncate(text: string, max = 600): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// ─── Reddit (official, free: userless OAuth) ───────────────────────────────

interface RedditChild {
  data: {
    id: string;
    author: string;
    subreddit: string;
    title: string;
    selftext?: string;
    score: number;
    num_comments: number;
    created_utc: number;
    permalink: string;
  };
}

async function redditToken(id: string, secret: string): Promise<string> {
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(
      `Reddit auth ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Reddit auth: no access_token");
  return json.access_token;
}

async function fetchReddit(): Promise<IngestedPost[]> {
  const id = process.env.REDDIT_CLIENT_ID?.trim();
  const secret = process.env.REDDIT_CLIENT_SECRET?.trim();
  const queries = list(process.env.INGEST_REDDIT_QUERIES);
  const subs = list(process.env.INGEST_REDDIT_SUBREDDITS);
  if (!id || !secret || (queries.length === 0 && subs.length === 0)) return [];

  const token = await redditToken(id, secret);
  const headers = { Authorization: `bearer ${token}`, "User-Agent": UA };

  // Global keyword searches + per-subreddit searches (or "new" if no query).
  const urls: string[] = [];
  for (const q of queries) {
    urls.push(
      `https://oauth.reddit.com/search?q=${encodeURIComponent(q)}&sort=new&limit=25&type=link`,
    );
  }
  for (const sub of subs) {
    const s = sub.replace(/^r\//, "");
    for (const q of queries.length ? queries : [""]) {
      urls.push(
        q
          ? `https://oauth.reddit.com/r/${s}/search?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&limit=25`
          : `https://oauth.reddit.com/r/${s}/new?limit=25`,
      );
    }
  }

  const out = new Map<string, IngestedPost>();
  for (const url of urls) {
    const res = await fetch(url, { headers });
    if (!res.ok) continue;
    const json = (await res.json()) as { data?: { children?: RedditChild[] } };
    for (const { data: p } of json.data?.children ?? []) {
      out.set(p.id, {
        id: `ext-reddit-${p.id}`,
        platform: "Reddit",
        author: `u/${p.author}`,
        handle: `r/${p.subreddit}`,
        date: epochToDate(p.created_utc),
        text: truncate(p.selftext ? `${p.title} — ${p.selftext}` : p.title),
        likes: String(p.score),
        reposts: "—",
        replies: String(p.num_comments),
        verified: false,
        url: `https://www.reddit.com${p.permalink}`,
      });
    }
  }
  return [...out.values()];
}

// ─── X / Twitter (official API v2 — requires PAID read access) ─────────────

interface XTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
}
interface XUser {
  id: string;
  username: string;
  name: string;
  verified?: boolean;
}

async function fetchX(): Promise<IngestedPost[]> {
  const token = process.env.X_BEARER_TOKEN?.trim();
  const queries = list(process.env.INGEST_X_QUERIES);
  if (!token || queries.length === 0) return [];

  const out = new Map<string, IngestedPost>();
  for (const q of queries) {
    const params = new URLSearchParams({
      query: q,
      max_results: "25",
      "tweet.fields": "created_at,public_metrics",
      expansions: "author_id",
      "user.fields": "username,name,verified",
    });
    const res = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) continue;
    const json = (await res.json()) as {
      data?: XTweet[];
      includes?: { users?: XUser[] };
    };
    const users = new Map((json.includes?.users ?? []).map((u) => [u.id, u]));
    for (const t of json.data ?? []) {
      const u = users.get(t.author_id);
      out.set(t.id, {
        id: `ext-x-${t.id}`,
        platform: "X",
        author: u ? `@${u.username}` : "@unknown",
        handle: u?.name ?? "X user",
        date: t.created_at.slice(0, 10),
        text: truncate(t.text),
        likes: String(t.public_metrics?.like_count ?? 0),
        reposts: String(t.public_metrics?.retweet_count ?? 0),
        replies: String(t.public_metrics?.reply_count ?? 0),
        verified: u?.verified ?? false,
        url: u
          ? `https://x.com/${u.username}/status/${t.id}`
          : `https://x.com/i/status/${t.id}`,
      });
    }
  }
  return [...out.values()];
}

// ─── YouTube (official Data API v3 search.list) ────────────────────────────

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: { title?: string; channelTitle?: string; publishedAt?: string };
}

async function fetchYouTubeVideos(): Promise<IngestedVideo[]> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  const queries = list(process.env.INGEST_YOUTUBE_QUERIES);
  if (!key || queries.length === 0) return [];

  const out = new Map<string, IngestedVideo>();
  for (const q of queries) {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      q,
      order: "date",
      maxResults: "10",
      key,
    });
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
    );
    if (!res.ok) continue;
    const json = (await res.json()) as { items?: YouTubeSearchItem[] };
    for (const item of json.items ?? []) {
      const vid = item.id?.videoId;
      if (!vid) continue;
      out.set(vid, {
        id: `ext-yt-${vid}`,
        title: item.snippet?.title ?? "Untitled",
        source: item.snippet?.channelTitle ?? "YouTube",
        date: (item.snippet?.publishedAt ?? "").slice(0, 10) || "—",
        url: `https://www.youtube.com/watch?v=${vid}`,
      });
    }
  }
  return [...out.values()];
}

// ─── Orchestration + persistence ───────────────────────────────────────────

export interface IngestResult {
  posts: number;
  videos: number;
  bySource: Record<string, number>;
}

/**
 * Fetch from every configured source and upsert into the DB. Posts go to
 * SocialPost; YouTube videos go to Video as tier "coverage" (the existing
 * stats refresh later fills in their duration/views). Safe to run repeatedly —
 * rows are keyed by stable "ext-"-prefixed IDs.
 */
export async function runIngestion(): Promise<IngestResult> {
  const [reddit, x, videos] = await Promise.all([
    fetchReddit().catch((e) => {
      console.error("[ingest] reddit failed:", e);
      return [] as IngestedPost[];
    }),
    fetchX().catch((e) => {
      console.error("[ingest] x failed:", e);
      return [] as IngestedPost[];
    }),
    fetchYouTubeVideos().catch((e) => {
      console.error("[ingest] youtube failed:", e);
      return [] as IngestedVideo[];
    }),
  ]);

  const posts = [...reddit, ...x];
  for (const p of posts) {
    const { id, ...rest } = p;
    await prisma.socialPost.upsert({
      where: { id },
      create: { id, ...rest },
      // Refresh mutable engagement counts; leave author/text/date stable.
      update: {
        likes: rest.likes,
        reposts: rest.reposts,
        replies: rest.replies,
      },
    });
  }

  for (const v of videos) {
    const { id, title, source, date, url } = v;
    await prisma.video.upsert({
      where: { id },
      create: {
        id,
        tier: "coverage",
        title,
        source,
        platform: "YouTube",
        date,
        dur: "—",
        url,
      },
      // Keep editorial-safe fields; the stats job updates dur/views/date.
      update: { title, source },
    });
  }

  return {
    posts: posts.length,
    videos: videos.length,
    bySource: { reddit: reddit.length, x: x.length, youtube: videos.length },
  };
}
