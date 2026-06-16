"use client";

import { useState } from "react";
import { AdminItemControls } from "@/components/admin-content";
import { Icons } from "@/components/icons";
import { MediaModal } from "@/components/media-modal";
import { type Bodycam, type Event, fmtDate } from "@/lib/types";

type BodycamWithEvent = Bodycam & { event: Event | null };

export function BodycamClient({ bodycam }: { bodycam: BodycamWithEvent[] }) {
  const [modal, setModal] = useState<BodycamWithEvent | null>(null);
  const [officer, setOfficer] = useState("All");
  const [q, setQ] = useState("");

  const officers = [
    "All",
    ...Array.from(new Set(bodycam.map((b) => b.officer))),
  ];

  const rows = bodycam.filter((b) => {
    const t = q.trim().toLowerCase();
    return (
      (officer === "All" || b.officer === officer) &&
      (!t || (b.title + b.location + b.type).toLowerCase().includes(t))
    );
  });

  return (
    <div className="wrap-wide section-sm" style={{ paddingTop: 28 }}>
      <div className="bodycam-layout">
        <div>
          <div className="filterbar" style={{ paddingTop: 0 }}>
            <div className="search-field">
              <Icons.search />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, type, or location…"
              />
            </div>
            {officers.map((o) => (
              <button
                key={o}
                type="button"
                className={`chip ${officer === o ? "on" : ""}`}
                onClick={() => setOfficer(o)}
              >
                {o === "All" ? "All units" : o}
              </button>
            ))}
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            <div
              className="bc-row"
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--line)",
                background: "var(--ink-2)",
              }}
            >
              <span className="mono-label bc-preview">Preview</span>
              <span className="mono-label">Incident / file</span>
              <span className="mono-label bc-officer">Officer · unit</span>
              <span className="mono-label" style={{ textAlign: "right" }}>
                Length
              </span>
            </div>
            {rows.map((b, i) => (
              <div
                key={b.id}
                style={{
                  borderBottom:
                    i < rows.length - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => setModal(b)}
                  className="bc-row"
                  style={{
                    padding: "14px 16px",
                    cursor: "pointer",
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    className="ph bc-preview"
                    style={{
                      width: 72,
                      height: 44,
                      borderRadius: 3,
                      position: "relative",
                    }}
                  >
                    <div
                      className="play-badge"
                      style={{ position: "static", width: 24, height: 24 }}
                    >
                      <Icons.play style={{ width: 10, height: 10 }} />
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14.5,
                        color: "var(--tx-0)",
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {b.title}
                    </div>
                    <div
                      className="mono-sm"
                      style={{ display: "flex", gap: 12 }}
                    >
                      <span>
                        {fmtDate(b.date)} · {b.time}
                      </span>
                      <span style={{ color: "var(--tx-3)" }}>{b.type}</span>
                    </div>
                  </div>
                  <div className="bc-officer">
                    <div style={{ fontSize: 13, color: "var(--tx-1)" }}>
                      {b.officer}
                    </div>
                    <div className="mono-sm">Unit {b.unit}</div>
                  </div>
                  <div
                    className="mono-sm tnum"
                    style={{ textAlign: "right", color: "var(--tx-1)" }}
                  >
                    {b.dur}
                  </div>
                </button>
                <AdminItemControls
                  type="bodycam"
                  id={b.id}
                  row={b}
                  style={{
                    padding: "0 16px 12px",
                    justifyContent: "flex-end",
                  }}
                />
              </div>
            ))}
            {rows.length === 0 && (
              <div
                style={{
                  padding: "30px 16px",
                  color: "var(--tx-3)",
                  fontSize: 14,
                }}
              >
                No footage matches those filters.
              </div>
            )}
          </div>
        </div>

        {/* map sidebar */}
        <div style={{ position: "sticky", top: 84 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <div
              className="ph"
              style={{ aspectRatio: "1/1", position: "relative" }}
            >
              <span
                className="ph-lbl"
                style={{ position: "absolute", top: 14, left: 14 }}
              >
                Incident map · American Fork, UT
              </span>
              <div style={{ position: "absolute", left: "42%", top: "48%" }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "var(--red)",
                    boxShadow: "0 0 0 6px var(--red-dim)",
                  }}
                />
              </div>
            </div>
            <div className="card-pad">
              <div className="mono-label" style={{ marginBottom: 10 }}>
                Single incident location
              </div>
              <div
                style={{ fontSize: 14, color: "var(--tx-1)", marginBottom: 4 }}
              >
                Bricks and Minifigs
              </div>
              <div className="mono-sm">American Fork, Utah</div>
            </div>
          </div>
          <div className="card card-pad" style={{ marginTop: 16 }}>
            <div className="mono-label" style={{ marginBottom: 12 }}>
              Disclosure note
            </div>
            <p
              className="body-txt"
              style={{ fontSize: 13, margin: 0, color: "var(--tx-2)" }}
            >
              Footage released by the American Fork Police Department via
              Dropbox. The URL of which was then add to this video{" "}
              <a href="https://www.youtube.com/watch?v=IcVmSQpIPRY">
                https://www.youtube.com/watch?v=IcVmSQpIPRY
              </a>
            </p>
          </div>
        </div>
      </div>
      <MediaModal item={modal} onClose={() => setModal(null)} />
    </div>
  );
}
