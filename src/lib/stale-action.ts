// Shared client-side handling for Server Action invocation failures.
//
// After a redeploy, browser tabs still holding the previous build reference
// Server Action IDs that no longer exist on the server, producing errors like
// "Failed to find Server Action". These are transient and resolved by a reload.

export const STALE_ACTION_MSG =
  "This page is out of date — the site was likely just updated. Please refresh the page and try again.";

export const GENERIC_ACTION_MSG = "Something went wrong. Please try again.";

/** True if the error looks like a stale/redeploy Server Action mismatch. */
export function isStaleActionError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return /Failed to find Server Action|Connection closed|Failed to fetch|fetch failed|NEXT_/i.test(
    m,
  );
}

/** Map any thrown action error to a user-facing message. */
export function actionErrorMessage(e: unknown): string {
  return isStaleActionError(e) ? STALE_ACTION_MSG : GENERIC_ACTION_MSG;
}
