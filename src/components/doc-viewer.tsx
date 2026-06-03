"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type Document, type Event, fmtDate } from "@/lib/types";
import { Icons } from "./icons";

type DocumentWithEvent = Document & { event?: Event | null };

interface DocViewerProps {
  doc: DocumentWithEvent | null;
  onClose: () => void;
}

export function DocViewer({ doc, onClose }: DocViewerProps) {
  const [page, setPage] = useState(1);

  // Reset page when document changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on doc identity change
  useEffect(() => {
    setPage(1);
  }, [doc?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!doc) return null;

  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(5,8,11,0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        border: "none",
        cursor: "default",
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: stop-propagation-only wrapper */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1080px, 96vw)",
          height: "min(760px, 92vh)",
          background: "var(--ink-1)",
          border: "1px solid var(--line-2)",
          borderRadius: 10,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 340px",
        }}
      >
        <div
          style={{
            background: "var(--ink-0)",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span className="tag document">
              <span className="dot" />
              {doc.type}
            </span>
            <div className="grow" />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                className="chip"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              <span className="mono-sm tnum">
                Page {page} / {doc.pages}
              </span>
              <button
                type="button"
                className="chip"
                onClick={() => setPage((p) => Math.min(doc.pages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: doc.url?.startsWith("/media/") ? 0 : 28,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {doc.url?.startsWith("/media/") ? (
              <iframe
                src={doc.url}
                title={doc.title}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                }}
              />
            ) : (
              <div
                className="ph"
                style={{
                  width: "min(440px, 100%)",
                  aspectRatio: "8.5/11",
                  borderRadius: 3,
                  alignItems: "flex-start",
                  padding: "34px 30px",
                  flexDirection: "column",
                  gap: 11,
                }}
              >
                <div
                  style={{
                    width: "55%",
                    height: 12,
                    background: "var(--line-2)",
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: "80%",
                    height: 8,
                    background: "var(--line)",
                    borderRadius: 2,
                    marginTop: 8,
                  }}
                />
                {(
                  [
                    "l1",
                    "l2",
                    "l3",
                    "l4",
                    "l5",
                    "l6",
                    "l7",
                    "l8",
                    "l9",
                  ] as const
                ).map((k, i) => (
                  <div
                    key={k}
                    style={{
                      width: i % 3 === 2 ? "62%" : "100%",
                      height: 6,
                      background: "var(--line)",
                      borderRadius: 2,
                    }}
                  />
                ))}
                <span className="ph-lbl" style={{ marginTop: "auto" }}>
                  document page {page} · OCR placeholder
                </span>
              </div>
            )}
          </div>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", overflow: "auto" }}
        >
          <div
            style={{
              padding: "20px 22px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <h2 className="h-card" style={{ fontSize: 18, lineHeight: 1.3 }}>
              {doc.title}
            </h2>
            <button
              type="button"
              className="btn btn-icon btn-ghost"
              onClick={onClose}
              style={{ flexShrink: 0 }}
            >
              <Icons.close />
            </button>
          </div>
          <div
            style={{
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div>
              <div className="mono-label" style={{ marginBottom: 9 }}>
                Details
              </div>
              <dl
                style={{
                  margin: 0,
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "9px 16px",
                  fontSize: 13.5,
                }}
              >
                <dt className="muted">Source</dt>
                <dd style={{ margin: 0, color: "var(--tx-0)" }}>
                  {doc.source}
                </dd>
                <dt className="muted">Date</dt>
                <dd style={{ margin: 0, color: "var(--tx-0)" }}>
                  {fmtDate(doc.date)}
                </dd>
                <dt className="muted">Pages</dt>
                <dd style={{ margin: 0, color: "var(--tx-0)" }}>{doc.pages}</dd>
                <dt className="muted">Type</dt>
                <dd style={{ margin: 0, color: "var(--tx-0)" }}>{doc.type}</dd>
              </dl>
            </div>
            <div>
              <div className="mono-label" style={{ marginBottom: 9 }}>
                Summary
              </div>
              <p className="body-txt" style={{ fontSize: 13.5, margin: 0 }}>
                {doc.summary}
              </p>
            </div>
            <div>
              <div className="mono-label" style={{ marginBottom: 9 }}>
                Tags
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {doc.tags.map((t) => (
                  <span key={t} className="tag solid">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {doc.event && (
              <div>
                <div className="mono-label" style={{ marginBottom: 9 }}>
                  Related event
                </div>
                <Link
                  href="/timeline"
                  onClick={onClose}
                  className="card hover"
                  style={{
                    display: "block",
                    padding: "12px 14px",
                    cursor: "pointer",
                    background: "var(--ink-card)",
                  }}
                >
                  <div className="mono-sm" style={{ marginBottom: 4 }}>
                    {fmtDate(doc.event.date)}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--tx-0)" }}>
                    {doc.event.title}
                  </div>
                </Link>
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: "auto",
              padding: "16px 22px",
              borderTop: "1px solid var(--line)",
              display: "flex",
              gap: 10,
            }}
          >
            {doc.url ? (
              <Link
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-blue btn-sm"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onClick={onClose}
              >
                <Icons.ext style={{ width: 15, height: 15 }} /> Open source ↗
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-blue btn-sm"
                style={{ flex: 1 }}
                disabled
              >
                <Icons.download style={{ width: 15, height: 15 }} /> No source
                link
              </button>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
