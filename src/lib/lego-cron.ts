import "server-only";
import { schedule, validate } from "node-cron";
import { refreshLegoValues } from "@/lib/lego-prices";

// 04:00 every Monday. Market values move slowly, so weekly is plenty (and keeps
// API usage low). Override with BRICKECONOMY_REFRESH_CRON (standard cron syntax).
const DEFAULT_SCHEDULE = "0 4 * * 1";
const TASK_NAME = "lego-value-refresh";

const globalForCron = globalThis as unknown as { legoCronStarted?: boolean };

/** Run a single value refresh, logging the outcome. Never throws. */
async function runRefresh(trigger: string): Promise<void> {
  try {
    const r = await refreshLegoValues();
    console.log(
      `[lego-cron] ${trigger}: refreshed ${r.updated}/${r.total} sets` +
        (r.missing.length ? ` — no value for ${r.missing.join(", ")}` : ""),
    );
  } catch (err) {
    console.error(`[lego-cron] ${trigger}: refresh failed:`, err);
  }
}

/** Schedule the recurring LEGO value refresh. Idempotent and best-effort. */
export function startLegoCron(): void {
  if (globalForCron.legoCronStarted) return;

  if (!process.env.BRICKECONOMY_API_KEY?.trim()) {
    console.log(
      "[lego-cron] BRICKECONOMY_API_KEY not set — value refresh disabled",
    );
    return;
  }

  const expr =
    process.env.BRICKECONOMY_REFRESH_CRON?.trim() || DEFAULT_SCHEDULE;
  if (!validate(expr)) {
    console.error(`[lego-cron] invalid cron expression "${expr}" — disabled`);
    return;
  }

  schedule(expr, () => runRefresh("scheduled"), {
    name: TASK_NAME,
    noOverlap: true,
    ...(process.env.BRICKECONOMY_REFRESH_TZ
      ? { timezone: process.env.BRICKECONOMY_REFRESH_TZ }
      : {}),
  });

  globalForCron.legoCronStarted = true;
  console.log(`[lego-cron] scheduled "${expr}"`);

  // Refresh once on startup too. Fire-and-forget so it never blocks readiness.
  void runRefresh("startup");
}
