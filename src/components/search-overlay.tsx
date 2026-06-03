"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Bodycam,
  Document,
  Event,
  Person,
  SocialPost,
  Video,
} from "@/lib/types";
import { fmtDate } from "@/lib/types";
import { Icons } from "./icons";

interface SearchData {
  events: Event[];
  videos: Video[];
  documents: Document[];
  people: Person[];
  social: SocialPost[];
  bodycam: Bodycam[];
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  data: SearchData;
}

const NAV_JUMPS: [string, string][] = [
  ["/timeline", "Timeline"],
  ["/videos", "Videos"],
  ["/bodycam", "Bodycam"],
  ["/documents", "Documents"],
  ["/social", "Social"],
  ["/people", "People"],
];

export function SearchOverlay({ open, onClose, data }: SearchOverlayProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setQ("");
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const t = q.toLowerCase();
    const out: { kind: string; label: string; sub: string; href: string }[] =
      [];
    data.events.forEach((e) => {
      if ((e.title + e.desc).toLowerCase().includes(t))
        out.push({
          kind: "Timeline",
          label: e.title,
          sub: fmtDate(e.date),
          href: "/timeline",
        });
    });
    data.videos.forEach((v) => {
      if ((v.title + v.source).toLowerCase().includes(t))
        out.push({
          kind: "Video",
          label: v.title,
          sub: v.source,
          href: "/videos",
        });
    });
    data.documents.forEach((d) => {
      if ((d.title + d.summary).toLowerCase().includes(t))
        out.push({
          kind: "Document",
          label: d.title,
          sub: d.type,
          href: "/documents",
        });
    });
    data.people.forEach((p) => {
      if ((p.name + p.role + p.org).toLowerCase().includes(t))
        out.push({
          kind: "Person",
          label: p.name,
          sub: p.role,
          href: `/people/${p.id}`,
        });
    });
    data.social.forEach((s) => {
      if (s.text.toLowerCase().includes(t))
        out.push({
          kind: "Social",
          label: `${s.text.slice(0, 60)}…`,
          sub: `${s.platform} · ${s.author}`,
          href: "/social",
        });
    });
    return out.slice(0, 12);
  }, [q, data]);

  if (!open) return null;

  return (
    <button
      type="button"
      aria-label="Close search"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(5,8,11,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "center",
        paddingTop: "12vh",
        border: "none",
        cursor: "default",
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: stop-propagation-only wrapper */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(680px, 92vw)",
          height: "fit-content",
          maxHeight: "72vh",
          background: "var(--ink-1)",
          border: "1px solid var(--line-2)",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "18px 20px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <Icons.search
            style={{ width: 20, height: 20, color: "var(--tx-2)" }}
          />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search videos, documents, events, people, posts…"
            style={{
              flex: 1,
              background: "transparent",
              border: 0,
              outline: "none",
              color: "var(--tx-0)",
              fontSize: 17,
              fontFamily: "var(--sans)",
            }}
          />
          <button
            type="button"
            className="mono-label"
            style={{
              cursor: "pointer",
              background: "none",
              border: "none",
              color: "var(--tx-3)",
            }}
            onClick={onClose}
          >
            ESC
          </button>
        </div>
        <div style={{ maxHeight: "56vh", overflowY: "auto" }}>
          {!q.trim() && (
            <div style={{ padding: "28px 22px" }}>
              <div className="mono-label" style={{ marginBottom: 14 }}>
                Jump to
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {NAV_JUMPS.map(([href, label]) => (
                  <button
                    key={href}
                    type="button"
                    className="chip"
                    onClick={() => {
                      router.push(href);
                      onClose();
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {q.trim() && results.length === 0 && (
            <div
              style={{
                padding: "34px 22px",
                color: "var(--tx-3)",
                fontSize: 14,
              }}
            >
              No matches for &ldquo;{q}&rdquo;.
            </div>
          )}
          {results.map((r) => (
            <button
              key={`${r.kind}-${r.label}`}
              type="button"
              onClick={() => {
                router.push(r.href);
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "13px 22px",
                borderBottom: "1px solid var(--line)",
                cursor: "pointer",
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottomWidth: 1,
                borderBottomStyle: "solid",
                borderBottomColor: "var(--line)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span className="mono-label" style={{ width: 74, flexShrink: 0 }}>
                {r.kind}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14.5,
                    color: "var(--tx-0)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.label}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--tx-3)" }}>
                  {r.sub}
                </div>
              </div>
              <Icons.arrow
                style={{ width: 15, height: 15, color: "var(--tx-3)" }}
              />
            </button>
          ))}
        </div>
      </div>
    </button>
  );
}
