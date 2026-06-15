import { NextResponse } from "next/server";
import { refreshLegoValues } from "@/lib/lego-prices";

// Always run at request time: this performs external fetches and DB writes, so
// it must never be prerendered or cached.
export const dynamic = "force-dynamic";

/**
 * POST /api/collection/refresh
 *
 * Refreshes the current market value of every LEGO set from BrickEconomy.
 * Protected by the shared bearer token so only the scheduled cron (or an
 * admin) can trigger it:
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     https://recklessbricks.com/api/collection/refresh
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server" },
      { status: 500 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshLegoValues();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
