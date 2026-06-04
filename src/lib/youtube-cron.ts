import "server-only";
import { schedule, validate } from "node-cron";
import { runIngestion } from "@/lib/ingest";
import { runScrape } from "@/lib/scrape";
import { refreshYouTubeStats } from "@/lib/youtube";

// 03:00 every day. Override with YOUTUBE_REFRESH_CRON (standard cron syntax).
const DEFAULT_SCHEDULE = "0 3 * * *";
const TASK_NAME = "youtube-refresh";

// Survives across the lifetime of a single server process; prevents scheduling
// the task twice (e.g. if register() runs more than once during dev reloads).
const globalForCron = globalThis as unknown as { youtubeCronStarted?: boolean };

/** Run a single ingest + stats refresh, logging the outcome. Never throws. */
async function runRefresh(trigger: string): Promise<void> {
  // Ingest new posts/videos first, so freshly added videos get stats below.
  try {
    const i = await runIngestion();
    if (i.posts || i.videos) {
      console.log(
        `[youtube-cron] ${trigger}: ingested ${i.posts} posts, ${i.videos} videos` +
          ` (reddit ${i.bySource.reddit}, x ${i.bySource.x}, youtube ${i.bySource.youtube})`,
      );
    }
  } catch (err) {
    console.error(`[youtube-cron] ${trigger}: ingestion failed:`, err);
  }

  // Scrape legal-document / bodycam archive sites.
  try {
    const s = await runScrape();
    if (s.documents || s.bodycams) {
      console.log(
        `[youtube-cron] ${trigger}: scraped ${s.documents} documents, ${s.bodycams} bodycams`,
      );
    }
  } catch (err) {
    console.error(`[youtube-cron] ${trigger}: scrape failed:`, err);
  }

  try {
    const r = await refreshYouTubeStats();
    console.log(
      `[youtube-cron] ${trigger}: refreshed ${r.updated}/${r.total} videos` +
        (r.missing.length ? ` — missing ${r.missing.join(", ")}` : ""),
    );
  } catch (err) {
    console.error(`[youtube-cron] ${trigger}: refresh failed:`, err);
  }
}

/** Schedule the recurring YouTube stats refresh. Idempotent and best-effort. */
export function startYouTubeCron(): void {
  if (globalForCron.youtubeCronStarted) return;

  if (!process.env.YOUTUBE_API_KEY?.trim()) {
    console.log("[youtube-cron] YOUTUBE_API_KEY not set — refresh disabled");
    return;
  }

  const expr = process.env.YOUTUBE_REFRESH_CRON?.trim() || DEFAULT_SCHEDULE;
  if (!validate(expr)) {
    console.error(
      `[youtube-cron] invalid cron expression "${expr}" — disabled`,
    );
    return;
  }

  schedule(expr, () => runRefresh("scheduled"), {
    name: TASK_NAME,
    // Skip a tick if the previous refresh is still running (the API + writes
    // can take a while), rather than stacking overlapping runs.
    noOverlap: true,
    ...(process.env.YOUTUBE_REFRESH_TZ
      ? { timezone: process.env.YOUTUBE_REFRESH_TZ }
      : {}),
  });

  globalForCron.youtubeCronStarted = true;
  console.log(`[youtube-cron] scheduled "${expr}"`);

  // Also refresh once now, on startup/restart. Fire-and-forget so it never
  // blocks the server from becoming ready.
  void runRefresh("startup");
}
