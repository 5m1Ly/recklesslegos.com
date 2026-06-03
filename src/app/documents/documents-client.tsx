"use client";

import { useState } from "react";
import { DocViewer } from "@/components/doc-viewer";
import { Icons } from "@/components/icons";
import { type Document, type Event, fmtDate } from "@/lib/types";

type DocumentWithEvent = Document & { event: Event | null };

function DocCard({
  d,
  onOpen,
}: {
  d: DocumentWithEvent;
  onOpen: (d: DocumentWithEvent) => void;
}) {
  return (
    <button
      type="button"
      className="card hover"
      style={{
        cursor: "pointer",
        display: "flex",
        gap: 0,
        overflow: "hidden",
        textAlign: "left",
        width: "100%",
      }}
      onClick={() => onOpen(d)}
    >
      <div
        className="ph"
        style={{
          width: 96,
          flexShrink: 0,
          borderRight: "1px solid var(--line)",
          alignItems: "flex-start",
          padding: "14px 10px",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <div
          style={{
            width: "70%",
            height: 6,
            background: "var(--line-2)",
            borderRadius: 2,
          }}
        />
        {(["r1", "r2", "r3", "r4", "r5"] as const).map((k, i) => (
          <div
            key={k}
            style={{
              width: i === 4 ? "50%" : "100%",
              height: 4,
              background: "var(--line)",
              borderRadius: 2,
            }}
          />
        ))}
      </div>
      <div className="card-pad" style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <span className="tag document">
            <span className="dot" />
            {d.type}
          </span>
          <span className="mono-sm" style={{ whiteSpace: "nowrap" }}>
            {d.pages} pp
          </span>
        </div>
        <h3 className="h-card" style={{ fontSize: 16.5, marginBottom: 8 }}>
          {d.title}
        </h3>
        <p
          className="body-txt"
          style={{
            fontSize: 13.5,
            margin: "0 0 12px",
            color: "var(--tx-2)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {d.summary}
        </p>
        <div className="mono-sm" style={{ display: "flex", gap: 10 }}>
          <span style={{ color: "var(--tx-1)" }}>{d.source}</span>
          <span style={{ color: "var(--tx-4)" }}>·</span>
          <span>{fmtDate(d.date)}</span>
        </div>
      </div>
    </button>
  );
}

export function DocumentsClient({
  documents,
  docTypes,
}: {
  documents: DocumentWithEvent[];
  docTypes: string[];
}) {
  const [viewer, setViewer] = useState<DocumentWithEvent | null>(null);
  const [type, setType] = useState("All");
  const [q, setQ] = useState("");
  const types = ["All", ...docTypes];

  const rows = documents.filter((d) => {
    const t = q.trim().toLowerCase();
    return (
      (type === "All" || d.type === type) &&
      (!t || (d.title + d.summary + d.tags.join(" ")).toLowerCase().includes(t))
    );
  });

  return (
    <div className="wrap-wide section-sm" style={{ paddingTop: 24 }}>
      <div className="filterbar" style={{ paddingTop: 0 }}>
        <div className="search-field">
          <Icons.search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search documents and full text…"
          />
        </div>
        <select
          className="select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === "All" ? "All types" : t}
            </option>
          ))}
        </select>
        <div className="grow" />
        <span className="mono-sm tnum">{rows.length} documents</span>
      </div>
      <div className="grid-2">
        {rows.map((d) => (
          <DocCard key={d.id} d={d} onOpen={setViewer} />
        ))}
      </div>
      {rows.length === 0 && (
        <div style={{ padding: "40px 0", color: "var(--tx-3)" }}>
          No documents match those filters.
        </div>
      )}
      <div style={{ height: 30 }} />
      <DocViewer doc={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
