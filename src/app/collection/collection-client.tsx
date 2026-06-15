"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LegoMinifig, LegoSet } from "@/generated/prisma/client";
import { fmtMoney, LEGOSET_STATUSES, type LegoSetStatus } from "@/lib/types";

// Accent tone per status, reusing the design-system color vars.
const STATUS_TONE: Record<LegoSetStatus, string> = {
  "With Bricks & Minifigs": "var(--red)",
  Sold: "var(--amber)",
  Recovered: "var(--blue)",
};

function statusTone(status: string): string {
  return STATUS_TONE[status as LegoSetStatus] ?? "var(--tx-2)";
}

export function CollectionClient({
  sets,
  minifigs,
}: {
  sets: LegoSet[];
  minifigs: LegoMinifig[];
}) {
  const [filter, setFilter] = useState<LegoSetStatus | "all">("all");

  // Chip counts combine sets + minifigs (one per row) per status.
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sets) m.set(s.status, (m.get(s.status) ?? 0) + 1);
    for (const f of minifigs) m.set(f.status, (m.get(f.status) ?? 0) + 1);
    return m;
  }, [sets, minifigs]);

  const visibleSets =
    filter === "all" ? sets : sets.filter((s) => s.status === filter);
  const visibleFigs =
    filter === "all" ? minifigs : minifigs.filter((f) => f.status === filter);

  const total = sets.length + minifigs.length;

  return (
    <div className="wrap-wide section-sm">
      <div className="filterbar" style={{ marginBottom: 24 }}>
        <button
          type="button"
          className={`chip ${filter === "all" ? "on" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({total})
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

      {visibleSets.length === 0 && visibleFigs.length === 0 ? (
        <p className="mono-sm">No items match this filter.</p>
      ) : null}

      {visibleSets.length > 0 ? (
        <section>
          <p className="eyebrow line" style={{ marginBottom: 18 }}>
            Sets ({visibleSets.length})
          </p>
          <div className="grid-3">
            {visibleSets.map((s) => (
              <SetCard key={s.id} set={s} />
            ))}
          </div>
        </section>
      ) : null}

      {visibleFigs.length > 0 ? (
        <section style={{ marginTop: 40 }}>
          <p className="eyebrow line" style={{ marginBottom: 18 }}>
            Minifigures ({visibleFigs.length})
          </p>
          <div className="grid-3">
            {visibleFigs.map((f) => (
              <MinifigCard key={f.id} fig={f} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CardThumb({
  imageUrl,
  alt,
  fallback,
}: {
  imageUrl: string | null;
  alt: string;
  fallback: string;
}) {
  return (
    <div
      className="ph thumb"
      style={{ aspectRatio: "4/3", position: "relative" }}
    >
      {imageUrl ? (
        // biome-ignore lint/performance/noImgElement: external catalog photo, no next/image needed
        <img
          src={imageUrl}
          alt={alt}
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
        <span className="ph-lbl">{fallback}</span>
      )}
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  return (
    <span className="tag" style={{ marginBottom: 10 }}>
      <span className="dot" style={{ background: statusTone(status) }} />
      {status}
    </span>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

function SetCard({ set: s }: { set: LegoSet }) {
  const multiple = s.quantity > 1;
  return (
    <div className="card" style={{ overflow: "hidden", display: "block" }}>
      <CardThumb
        imageUrl={s.imageUrl}
        alt={s.name}
        fallback={s.setNumber ? `#${s.setNumber}` : "set photo"}
      />

      <div style={{ padding: "14px 16px" }}>
        <StatusTag status={s.status} />
        <CardTitle>
          {s.name}
          {multiple ? (
            <span className="mono-sm" style={{ marginLeft: 8 }}>
              ×{s.quantity}
            </span>
          ) : null}
        </CardTitle>

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
            {multiple ? (
              <div>
                ×{s.quantity} = {fmtMoney(s.currentValue * s.quantity)}
              </div>
            ) : null}
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

function MinifigCard({ fig: f }: { fig: LegoMinifig }) {
  const multiple = f.quantity > 1;
  return (
    <div className="card" style={{ overflow: "hidden", display: "block" }}>
      <CardThumb
        imageUrl={f.imageUrl}
        alt={f.name}
        fallback={f.minifigNumber ? `#${f.minifigNumber}` : "minifig photo"}
      />

      <div style={{ padding: "14px 16px" }}>
        <StatusTag status={f.status} />
        <CardTitle>
          {f.name}
          {multiple ? (
            <span className="mono-sm" style={{ marginLeft: 8 }}>
              ×{f.quantity}
            </span>
          ) : null}
        </CardTitle>

        <div className="mono-sm" style={{ marginTop: 4 }}>
          {[
            f.minifigNumber ? `#${f.minifigNumber}` : null,
            f.year ? String(f.year) : null,
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
              {fmtMoney(f.currentValue)}
            </div>
          </div>
          <div style={{ textAlign: "right" }} className="mono-sm">
            {multiple ? (
              <div>
                ×{f.quantity} = {fmtMoney(f.currentValue * f.quantity)}
              </div>
            ) : null}
            {f.status === "Sold" && f.soldPrice ? (
              <div>Sold for {fmtMoney(f.soldPrice)}</div>
            ) : null}
          </div>
        </div>

        {f.notes ? (
          <p
            className="body-txt"
            style={{ margin: "12px 0 0", fontSize: 13.5 }}
          >
            {f.notes}
          </p>
        ) : null}
      </div>
    </div>
  );
}
