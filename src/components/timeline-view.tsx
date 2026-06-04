"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  fmtDate,
  REF_TYPE_KEYS,
  REF_TYPES,
  type RefType,
  type TimelineEntryBase,
} from "@/lib/types";
import { Icons } from "./icons";

interface TimelineViewProps {
  entries: TimelineEntryBase[];
  compact?: boolean;
}

// Map reference types onto the existing tag colour classes in globals.css.
const REF_TAG_CLASS: Record<RefType, string> = {
  video: "video",
  bodycam: "police",
  document: "document",
  social: "social",
  person: "press",
};

export function TimelineView({ entries, compact = false }: TimelineViewProps) {
  const [types, setTypes] = useState<RefType[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(
    compact ? null : (entries[0]?.id ?? null),
  );

  const toggleType = (t: RefType) =>
    setTypes((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        const typeOk =
          types.length === 0 || e.refs.some((r) => types.includes(r.refType));
        const t = q.trim().toLowerCase();
        const qOk = !t || (e.title + e.description).toLowerCase().includes(t);
        return typeOk && qOk;
      }),
    [entries, types, q],
  );

  return (
    <div>
      <div
        className="filterbar"
        style={{
          borderBottom: "1px solid var(--line)",
          marginBottom: 0,
        }}
      >
        <div
          className="search-field"
          style={{ maxWidth: 340, flex: "0 1 340px" }}
        >
          <Icons.search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events…"
          />
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <button
            type="button"
            className={`chip ${types.length === 0 ? "on" : ""}`}
            onClick={() => setTypes([])}
          >
            All
          </button>
          {REF_TYPE_KEYS.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${types.includes(t) ? "on" : ""}`}
              onClick={() => toggleType(t)}
            >
              {REF_TYPES[t].plural}
            </button>
          ))}
        </div>
        <div className="grow" />
        <Link href="/timeline/contribute" className="btn btn-blue btn-sm">
          Propose a change
        </Link>
      </div>

      {entries.length === 0 ? (
        <div
          className="card card-pad"
          style={{ marginTop: 24, textAlign: "center" }}
        >
          <h3 className="h-card" style={{ marginBottom: 8 }}>
            The timeline is empty
          </h3>
          <p className="body-txt" style={{ margin: "0 0 16px" }}>
            No events have been published yet. Anyone can propose the first one
            — it goes live once a moderator approves it.
          </p>
          <Link href="/timeline/contribute" className="btn btn-primary">
            Add the first event
          </Link>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: 148,
              top: 0,
              bottom: 0,
              width: 1,
              background: "var(--line)",
            }}
          />
          {filtered.map((e) => {
            const isOpen = open === e.id;
            // Count refs by type for the collapsed summary + grouped chips.
            const grouped = new Map<RefType, number>();
            for (const r of e.refs)
              grouped.set(r.refType, (grouped.get(r.refType) ?? 0) + 1);

            return (
              <div
                key={e.id}
                className="tl-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "148px 1fr",
                  gap: 0,
                  position: "relative",
                }}
              >
                <div
                  style={{ padding: "26px 24px 26px 0", textAlign: "right" }}
                >
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: 19,
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {fmtDate(e.date).split(",")[0]}
                  </div>
                  <div className="mono-sm" style={{ marginTop: 2 }}>
                    {e.date.split("-")[0]}
                  </div>
                  {e.ongoing && (
                    <div
                      className="tag social"
                      style={{ marginTop: 8, fontSize: 10 }}
                    >
                      <span
                        className="dot"
                        style={{ animation: "pulse 1.6s infinite" }}
                      />
                      Ongoing
                    </div>
                  )}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 148,
                    top: 32,
                    transform: "translateX(-50%)",
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: isOpen ? "var(--blue)" : "var(--ink-0)",
                    border: `2px solid ${isOpen ? "var(--blue)" : "var(--line-3)"}`,
                    zIndex: 2,
                  }}
                />
                <div style={{ padding: "18px 0 18px 36px" }}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : e.id)}
                    className="card hover"
                    style={{
                      cursor: "pointer",
                      padding: "18px 20px",
                      borderColor: isOpen ? "var(--line-2)" : "var(--line)",
                      width: "100%",
                      textAlign: "left",
                      background: "var(--ink-card)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {e.refs.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 7,
                              flexWrap: "wrap",
                              marginBottom: 11,
                            }}
                          >
                            {[...grouped.entries()].map(([t, n]) => (
                              <span
                                key={t}
                                className={`tag ${REF_TAG_CLASS[t]}`}
                              >
                                <span className="dot" />
                                {n}{" "}
                                {n === 1
                                  ? REF_TYPES[t].label
                                  : REF_TYPES[t].plural}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3
                          className="h-card"
                          style={{ marginBottom: isOpen ? 12 : 0 }}
                        >
                          {e.title}
                        </h3>
                        {isOpen && (
                          <div>
                            <p
                              className="body-txt"
                              style={{ margin: "0 0 16px" }}
                            >
                              {e.description}
                            </p>
                            {e.refs.length > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  flexWrap: "wrap",
                                  marginBottom: 14,
                                }}
                              >
                                {e.refs.map((r) => (
                                  <Link
                                    key={`${r.refType}:${r.refId}`}
                                    href={r.href ?? "#"}
                                    className="chip"
                                    onClick={(ev) => ev.stopPropagation()}
                                  >
                                    {REF_TYPES[r.refType].label}: {r.label}
                                  </Link>
                                ))}
                              </div>
                            )}
                            <div
                              style={{
                                display: "flex",
                                gap: 14,
                                alignItems: "center",
                                paddingTop: 14,
                                borderTop: "1px solid var(--line)",
                              }}
                            >
                              <span className="mono-label">
                                Suggest an edit
                              </span>
                              <Link
                                href={`/timeline/contribute?op=edit&id=${e.id}`}
                                className="chip"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                Edit this event
                              </Link>
                              <Link
                                href={`/timeline/contribute?op=remove&id=${e.id}`}
                                className="chip"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                Propose removal
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                      {!isOpen && e.refs.length > 0 && (
                        <span
                          className="mono-sm tnum"
                          style={{ whiteSpace: "nowrap", paddingTop: 2 }}
                        >
                          {e.refs.length} linked
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
