"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CollectionAdminControls } from "@/components/collection-admin";
import type {
  CIDisposition,
  CIELocation,
  CIESource,
} from "@/generated/prisma/enums";
import {
  CONDITION_LABELS,
  DISPOSITION_LABELS,
  DISPOSITION_ORDER,
  DISPOSITION_TONE,
  type ItemEditData,
  LOCATION_LABELS,
  LOCATION_ORDER,
  SOURCE_LABELS,
} from "@/lib/collection";
import { fmtMoney } from "@/lib/types";

// ── View shapes (built server-side in page.tsx) ──────────────────────────────

export interface SourceValueView {
  source: CIESource;
  value: number;
  valueLow: number;
  valueHigh: number;
  note: string;
}

export interface EntryView {
  id: string;
  locationLabel: string;
  condition: string;
  disposition: CIDisposition;
  costPrice: number;
  displayPrice: number;
  sellPrice: number;
}

export interface ItemView {
  id: string;
  name: string;
  legoRef: string;
  type: "SET" | "MINIFIGURE";
  year: number;
  pieces: number;
  imageUrl: string | null;
  notes: string;
  quantity: number;
  retail: number;
  avg: number;
  disposition: CIDisposition;
  location: CIELocation;
  sources: SourceValueView[];
  entries: EntryView[];
  edit: ItemEditData;
}

function dispositionTone(d: CIDisposition): string {
  return DISPOSITION_TONE[d] ?? "var(--tx-2)";
}

// ── Top-level client (filters + grid) ────────────────────────────────────────

export function CollectionClient({
  sets,
  minifigs,
}: {
  sets: ItemView[];
  minifigs: ItemView[];
}) {
  const [disp, setDisp] = useState<CIDisposition | "all">("all");
  const [loc, setLoc] = useState<CIELocation | "all">("all");

  const all = useMemo(() => [...sets, ...minifigs], [sets, minifigs]);
  const dispCounts = useMemo(() => countBy(all, (i) => i.disposition), [all]);
  const locCounts = useMemo(() => countBy(all, (i) => i.location), [all]);

  const match = (i: ItemView) =>
    (disp === "all" || i.disposition === disp) &&
    (loc === "all" || i.location === loc);
  const visibleSets = sets.filter(match);
  const visibleFigs = minifigs.filter(match);
  const total = all.length;

  return (
    <div className="wrap-wide section-sm">
      <div className="filterbar" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className={`chip ${disp === "all" ? "on" : ""}`}
          onClick={() => setDisp("all")}
        >
          All ({total})
        </button>
        {DISPOSITION_ORDER.filter((d) => (dispCounts.get(d) ?? 0) > 0).map(
          (d) => (
            <button
              key={d}
              type="button"
              className={`chip ${disp === d ? "on" : ""}`}
              onClick={() => setDisp(d)}
            >
              {DISPOSITION_LABELS[d]} ({dispCounts.get(d) ?? 0})
            </button>
          ),
        )}
      </div>

      <div className="filterbar" style={{ marginBottom: 24 }}>
        <button
          type="button"
          className={`chip ${loc === "all" ? "on" : ""}`}
          onClick={() => setLoc("all")}
        >
          Anywhere
        </button>
        {LOCATION_ORDER.filter((l) => (locCounts.get(l) ?? 0) > 0).map((l) => (
          <button
            key={l}
            type="button"
            className={`chip ${loc === l ? "on" : ""}`}
            onClick={() => setLoc(l)}
          >
            {LOCATION_LABELS[l]} ({locCounts.get(l) ?? 0})
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
              <ItemCard key={s.id} item={s} />
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
              <ItemCard key={f.id} item={f} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function countBy<T, K>(rows: T[], keyOf: (r: T) => K): Map<K, number> {
  const m = new Map<K, number>();
  for (const r of rows) {
    const k = keyOf(r);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

// ── Card ─────────────────────────────────────────────────────────────────────

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

function ItemCard({ item: i }: { item: ItemView }) {
  const [open, setOpen] = useState(false);
  const multiple = i.quantity > 1;
  const refLabel = i.legoRef ? `#${i.legoRef}` : null;

  return (
    <div className="card" style={{ overflow: "hidden", display: "block" }}>
      <CardThumb
        imageUrl={i.imageUrl}
        alt={i.name}
        fallback={
          refLabel ?? (i.type === "MINIFIGURE" ? "minifig photo" : "set photo")
        }
      />

      <div style={{ padding: "14px 16px" }}>
        <span className="tag" style={{ marginBottom: 10 }}>
          <span
            className="dot"
            style={{ background: dispositionTone(i.disposition) }}
          />
          {DISPOSITION_LABELS[i.disposition]}
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
          {i.name}
          {multiple ? (
            <span className="mono-sm" style={{ marginLeft: 8 }}>
              ×{i.quantity}
            </span>
          ) : null}
        </div>

        <div className="mono-sm" style={{ marginTop: 4 }}>
          {[
            refLabel,
            i.year ? String(i.year) : null,
            i.type === "SET" && i.pieces
              ? `${i.pieces.toLocaleString()} pcs`
              : null,
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
            <div className="mono-label">
              Avg value · {i.sources.length || 0} source
              {i.sources.length === 1 ? "" : "s"}
            </div>
            <div
              className="tnum"
              style={{ fontSize: 20, color: "var(--tx-0)" }}
            >
              {fmtMoney(i.avg)}
            </div>
          </div>
          <div style={{ textAlign: "right" }} className="mono-sm">
            {multiple ? (
              <div>
                ×{i.quantity} = {fmtMoney(i.avg * i.quantity)}
              </div>
            ) : null}
            {i.retail ? <div>Retail {fmtMoney(i.retail)}</div> : null}
          </div>
        </div>

        {i.notes ? (
          <p
            className="body-txt"
            style={{ margin: "12px 0 0", fontSize: 13.5 }}
          >
            {i.notes}
          </p>
        ) : null}

        <button
          type="button"
          className="mono-sm"
          style={{
            marginTop: 12,
            color: "var(--blue)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide details" : "Show prices & locations"}
        </button>

        {open ? <ItemDetails item={i} /> : null}

        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 14,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Link
            href={`/propose/legoset?op=edit&id=${i.id}`}
            className="mono-sm"
            style={{ color: "var(--blue)" }}
          >
            Suggest edit
          </Link>
          <Link
            href={`/propose/legoset?op=remove&id=${i.id}`}
            className="mono-sm"
            style={{ color: "var(--tx-2)" }}
          >
            Propose removal
          </Link>
          <CollectionAdminControls item={i.edit} />
        </div>
      </div>
    </div>
  );
}

function ItemDetails({ item: i }: { item: ItemView }) {
  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px dashed var(--line)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div>
        <div className="mono-label" style={{ marginBottom: 6 }}>
          Price by source
        </div>
        {i.sources.length === 0 ? (
          <p className="mono-sm">No price readings yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {i.sources.map((s) => (
              <div
                key={s.source}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span className="mono-sm">{SOURCE_LABELS[s.source]}</span>
                <span className="mono-sm tnum" style={{ color: "var(--tx-0)" }}>
                  {fmtMoney(s.value)}
                  {s.valueLow || s.valueHigh ? (
                    <span style={{ color: "var(--tx-2)" }}>
                      {" "}
                      ({fmtMoney(s.valueLow)}–{fmtMoney(s.valueHigh)})
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mono-label" style={{ marginBottom: 6 }}>
          Copies & whereabouts
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {i.entries.map((e) => (
            <div key={e.id} className="mono-sm">
              <div style={{ color: "var(--tx-0)" }}>
                {e.locationLabel} · {DISPOSITION_LABELS[e.disposition]} ·{" "}
                {CONDITION_LABELS[
                  e.condition as keyof typeof CONDITION_LABELS
                ] ?? e.condition}
              </div>
              <div style={{ color: "var(--tx-2)" }}>
                {[
                  e.costPrice ? `Cost ${fmtMoney(e.costPrice)}` : null,
                  e.displayPrice ? `Listed ${fmtMoney(e.displayPrice)}` : null,
                  e.sellPrice ? `Sold ${fmtMoney(e.sellPrice)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "No prices recorded"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
