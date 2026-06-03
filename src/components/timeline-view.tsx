"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type EventBase,
  fmtDate,
  type PersonBase,
  type Side,
} from "@/lib/types";
import { Avatar } from "./avatar";
import { CatTag } from "./cat-tag";
import { Icons } from "./icons";

interface EventWithPeople extends EventBase {
  people: { person: PersonBase | null }[];
}

interface TimelineViewProps {
  events: EventWithPeople[];
  compact?: boolean;
}

export function TimelineView({ events, compact = false }: TimelineViewProps) {
  const [cats, setCats] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(
    compact ? null : (events[0]?.id ?? null),
  );

  const CAT_KEYS = ["video", "document", "police", "legal", "social", "press"];
  const CAT_LABELS: Record<string, string> = {
    video: "Videos",
    document: "Documents",
    police: "Police Activity",
    legal: "Legal Filings",
    social: "Social Media",
    press: "Press Coverage",
  };

  const toggleCat = (c: string) =>
    setCats((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

  const filtered = events.filter((e) => {
    const catOk = cats.length === 0 || e.cats.some((c) => cats.includes(c));
    const t = q.trim().toLowerCase();
    const qOk = !t || (e.title + e.desc).toLowerCase().includes(t);
    return catOk && qOk;
  });

  return (
    <div>
      <div
        className="filterbar"
        style={{
          borderTop: "1px solid var(--line)",
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
            className={`chip ${cats.length === 0 ? "on" : ""}`}
            onClick={() => setCats([])}
          >
            All
          </button>
          {CAT_KEYS.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${cats.includes(c) ? "on" : ""}`}
              onClick={() => toggleCat(c)}
            >
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="grow" />
        <span className="mono-sm tnum">
          {filtered.length} / {events.length} events
        </span>
      </div>

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
          const relTotal = e.relVideos + e.relDocs + e.relBodycam + e.relSocial;
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
              <div style={{ padding: "26px 24px 26px 0", textAlign: "right" }}>
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
                      <div
                        style={{
                          display: "flex",
                          gap: 7,
                          flexWrap: "wrap",
                          marginBottom: 11,
                        }}
                      >
                        {e.cats.map((c) => (
                          <CatTag key={c} cat={c} />
                        ))}
                      </div>
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
                            {e.desc}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              marginBottom: e.people.length ? 14 : 0,
                            }}
                          >
                            {e.relVideos > 0 && (
                              <Link
                                href="/videos"
                                className="chip"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                <Icons.play
                                  style={{
                                    width: 12,
                                    height: 12,
                                    marginRight: 6,
                                    display: "inline",
                                  }}
                                />
                                {e.relVideos} video{e.relVideos > 1 ? "s" : ""}
                              </Link>
                            )}
                            {e.relDocs > 0 && (
                              <Link
                                href="/documents"
                                className="chip"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                {e.relDocs} document{e.relDocs > 1 ? "s" : ""}
                              </Link>
                            )}
                            {e.relBodycam > 0 && (
                              <Link
                                href="/bodycam"
                                className="chip"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                {e.relBodycam} bodycam file
                                {e.relBodycam > 1 ? "s" : ""}
                              </Link>
                            )}
                            {e.relSocial > 0 && (
                              <Link
                                href="/social"
                                className="chip"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                {e.relSocial} social post
                                {e.relSocial > 1 ? "s" : ""}
                              </Link>
                            )}
                          </div>
                          {e.people.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                                paddingTop: 14,
                                borderTop: "1px solid var(--line)",
                              }}
                            >
                              <span className="mono-label">People</span>
                              {e.people.map(
                                ({ person: p }) =>
                                  p && (
                                    <Link
                                      key={p.id}
                                      href={`/people/${p.id}`}
                                      onClick={(ev) => ev.stopPropagation()}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        background: "transparent",
                                        border: "1px solid var(--line)",
                                        borderRadius: 99,
                                        padding: "4px 11px 4px 4px",
                                      }}
                                    >
                                      <Avatar
                                        name={p.name}
                                        size={22}
                                        side={p.side as Side}
                                      />
                                      <span
                                        style={{
                                          fontSize: 13,
                                          color: "var(--tx-1)",
                                        }}
                                      >
                                        {p.name}
                                      </span>
                                    </Link>
                                  ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {!isOpen && relTotal > 0 && (
                      <span
                        className="mono-sm tnum"
                        style={{ whiteSpace: "nowrap", paddingTop: 2 }}
                      >
                        {relTotal} linked
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
