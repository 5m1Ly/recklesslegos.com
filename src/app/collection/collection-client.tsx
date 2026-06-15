"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LegoSet } from "@/generated/prisma/client";
import { fmtMoney, LEGOSET_STATUSES, type LegoSetStatus } from "@/lib/types";

// Accent tone per status, reusing the design-system color vars.
const STATUS_TONE: Record<LegoSetStatus, string> = {
  "With Bricks & Minifigs": "var(--red)",
  Sold: "var(--amber)",
  Recovered: "var(--blue)",
};

export function CollectionClient({ sets }: { sets: LegoSet[] }) {
  const [filter, setFilter] = useState<LegoSetStatus | "all">("all");

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sets) m.set(s.status, (m.get(s.status) ?? 0) + 1);
    return m;
  }, [sets]);

  const visible =
    filter === "all" ? sets : sets.filter((s) => s.status === filter);

  return (
    <div className="wrap-wide section-sm">
      <div className="filterbar" style={{ marginBottom: 24 }}>
        <button
          type="button"
          className={`chip ${filter === "all" ? "on" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({sets.length})
        </button>
        {LEGOSET_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`chip ${filter === status ? "on" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status} ({counts.get(status) ?? 0})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mono-sm">No sets match this filter.</p>
      ) : (
        <div className="grid-3">
          {visible.map((s) => (
            <SetCard key={s.id} set={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SetCard({ set: s }: { set: LegoSet }) {
  const tone = STATUS_TONE[s.status as LegoSetStatus] ?? "var(--tx-2)";

  return (
    <div className="card" style={{ overflow: "hidden", display: "block" }}>
      <div
        className="ph thumb"
        style={{ aspectRatio: "4/3", position: "relative" }}
      >
        {s.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: external set photo, no next/image needed
          <img
            src={s.imageUrl}
            alt={s.name}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <span className="ph-lbl">
            {s.setNumber ? `#${s.setNumber}` : "set photo"}
          </span>
        )}
      </div>

      <div style={{ padding: "14px 16px" }}>
        <span className="tag" style={{ marginBottom: 10 }}>
          <span className="dot" style={{ background: tone }} />
          {s.status}
        </span>

        <div
          style={{
            fontSize: 16,
            color: "var(--tx-0)",
            fontFamily: "var(--serif)",
            fontWeight: 500,
            lineHeight: 1.3,
            marginTop: 8,
          }}
        >
          {s.name}
        </div>

        <div className="mono-sm" style={{ marginTop: 4 }}>
          {[
            s.setNumber ? `#${s.setNumber}` : null,
            s.year ? String(s.year) : null,
            s.pieces ? `${s.pieces.toLocaleString()} pcs` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--line)",
          }}
        >
          <div>
            <div className="mono-label">Current value</div>
            <div
              className="tnum"
              style={{ fontSize: 20, color: "var(--tx-0)" }}
            >
              {fmtMoney(s.currentValue)}
            </div>
          </div>
          <div style={{ textAlign: "right" }} className="mono-sm">
            {s.retailPrice ? <div>Retail {fmtMoney(s.retailPrice)}</div> : null}
            {s.status === "Sold" && s.soldPrice ? (
              <div>Sold for {fmtMoney(s.soldPrice)}</div>
            ) : null}
          </div>
        </div>

        {s.notes ? (
          <p
            className="body-txt"
            style={{ margin: "12px 0 0", fontSize: 13.5 }}
          >
            {s.notes}
          </p>
        ) : null}

        <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
          <Link
            href={`/propose/legoset?op=edit&id=${s.id}`}
            className="mono-sm"
            style={{ color: "var(--blue)" }}
          >
            Suggest edit
          </Link>
          <Link
            href={`/propose/legoset?op=remove&id=${s.id}`}
            className="mono-sm"
            style={{ color: "var(--tx-2)" }}
          >
            Propose removal
          </Link>
        </div>
      </div>
    </div>
  );
}
