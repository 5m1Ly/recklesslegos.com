// Runs once when a Next.js server instance starts. We use it to kick off the
// in-process node-cron scheduler that refreshes YouTube stats. The dynamic
// import keeps node-cron (and its Node-only deps) out of the Edge bundle.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startYouTubeCron } = await import("@/lib/youtube-cron");
  startYouTubeCron();
  const { startLegoCron } = await import("@/lib/lego-cron");
  startLegoCron();
}
