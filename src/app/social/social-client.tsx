"use client";

import Link from "next/link";
import { useState } from "react";
import { Icons } from "@/components/icons";
import {
  type Event,
  fmtDate,
  PLATFORM_META,
  type SocialPost,
  type Video,
} from "@/lib/types";

type SocialPostWithEvent = SocialPost & { event: Event | null };

function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function CoverageVideoCard({ v }: { v: Video }) {
  const ytId = getYouTubeId(v.url);
  return (
    <a
      href={v.url ?? "#"}
      target={v.url ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="card hover"
      style={{
        overflow: "hidden",
        display: "block",
        cursor: v.url ? "pointer" : "default",
        opacity: v.url ? 1 : 0.6,
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16/9",
          overflow: "hidden",
          background: "var(--ink-2)",
        }}
      >
        {ytId ? (
          // biome-ignore lint/performance/noImgElement: YouTube thumbnail
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt={v.title}
            width={480}
            height={360}
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
          <div className="ph thumb" style={{ position: "absolute", inset: 0 }}>
            <span className="ph-lbl">
              {v.url ? "video still" : "URL not yet indexed"}
            </span>
          </div>
        )}
        <div
          className="play-badge"
          style={{ position: "absolute", bottom: 10, right: 10 }}
        >
          <Icons.play />
        </div>
      </div>
      <div className="card-pad">
        <h3 className="h-card" style={{ marginBottom: 8, fontSize: 15 }}>
          {v.title}
        </h3>
        <div className="mono-sm" style={{ display: "flex", gap: 10 }}>
          <span style={{ color: "var(--tx-1)" }}>{v.source}</span>
          <span style={{ color: "var(--tx-4)" }}>·</span>
          <span>{fmtDate(v.date)}</span>
        </div>
      </div>
    </a>
  );
}

function PostCard({ s }: { s: SocialPostWithEvent }) {
  const pm = PLATFORM_META[s.platform] ?? { abbr: "?", tone: "var(--tx-2)" };
  return (
    <div
      className="card"
      style={{
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        breakInside: "avoid",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            border: "1px solid var(--line-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 13,
              fontWeight: 600,
              color: pm.tone,
            }}
          >
            {pm.abbr}
          </span>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{ fontSize: 14, color: "var(--tx-0)", fontWeight: 500 }}
            >
              {s.handle}
            </span>
            {s.verified && (
              <Icons.check
                style={{ width: 13, height: 13, color: "var(--blue)" }}
              />
            )}
          </div>
          <div className="mono-sm">{s.author}</div>
        </div>
        <span className="mono-sm" style={{ whiteSpace: "nowrap" }}>
          {fmtDate(s.date)}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 15,
          lineHeight: 1.55,
          color: "var(--tx-1)",
        }}
      >
        {s.text}
      </p>
      <div
        style={{
          display: "flex",
          gap: 18,
          alignItems: "center",
          paddingTop: 12,
          borderTop: "1px solid var(--line)",
        }}
      >
        {s.likes !== "—" && (
          <span className="mono-sm tnum">
            <Icons.heart
              style={{
                width: 13,
                height: 13,
                display: "inline",
                marginRight: 5,
                verticalAlign: "-2px",
              }}
            />
            {s.likes}
          </span>
        )}
        {s.reposts !== "—" && (
          <span className="mono-sm tnum">⇄ {s.reposts}</span>
        )}
        {s.replies !== "—" && (
          <span className="mono-sm tnum">💬 {s.replies}</span>
        )}
        <div className="grow" />
        {s.url && (
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="chip btn-sm"
            style={{ fontSize: 11, padding: "4px 10px" }}
          >
            View post ↗
          </a>
        )}
        {!s.url && s.event && (
          <Link
            href="/timeline"
            className="chip btn-sm"
            style={{ fontSize: 11, padding: "4px 10px" }}
          >
            Related event
          </Link>
        )}
      </div>
    </div>
  );
}

export function SocialClient({
  social,
  platforms,
  coverageVideos,
}: {
  social: SocialPostWithEvent[];
  platforms: string[];
  coverageVideos: Video[];
}) {
  const [platform, setPlatform] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Newest");
  const allPlatforms = ["All", ...platforms];

  let rows = social.filter((s) => {
    const t = q.trim().toLowerCase();
    return (
      (platform === "All" || s.platform === platform) &&
      (!t || (s.text + s.author + s.handle).toLowerCase().includes(t))
    );
  });
  rows = [...rows].sort((a, b) =>
    sort === "Newest"
      ? b.date.localeCompare(a.date)
      : a.date.localeCompare(b.date),
  );

  return (
    <div className="wrap-wide section-sm" style={{ paddingTop: 24 }}>
      <div className="social-layout">
        {/* Left 2/3 — Coverage & commentary videos */}
        <section>
          <div className="social-section-head">
            <h2 className="h-section" style={{ fontSize: 20 }}>
              Coverage &amp; commentary
            </h2>
            <span className="mono-sm tnum">{coverageVideos.length}</span>
            <span className="mono-sm social-section-sub">
              Third-party video coverage of the controversy
            </span>
          </div>
          {coverageVideos.length > 0 ? (
            <div className="grid-2">
              {coverageVideos.map((v) => (
                <CoverageVideoCard key={v.id} v={v} />
              ))}
            </div>
          ) : (
            <div style={{ padding: "40px 0", color: "var(--tx-3)" }}>
              No coverage videos yet.
            </div>
          )}
        </section>

        {/* Right 1/3 — Social posts feed */}
        <aside>
          <div className="social-section-head">
            <h2 className="h-section" style={{ fontSize: 20 }}>
              Social posts
            </h2>
            <span className="mono-sm tnum">{rows.length}</span>
          </div>

          <div className="filterbar" style={{ paddingTop: 0 }}>
            <div className="search-field">
              <Icons.search />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search posts…"
              />
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {allPlatforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip ${platform === p ? "on" : ""}`}
                  onClick={() => setPlatform(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="grow" />
            <select
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option>Newest</option>
              <option>Oldest</option>
            </select>
          </div>

          {/* Single-column feed — the narrow right rail */}
          <div style={{ display: "grid", gap: 16 }}>
            {rows.map((s) => (
              <PostCard key={s.id} s={s} />
            ))}
          </div>
          {rows.length === 0 && (
            <div style={{ padding: "40px 0", color: "var(--tx-3)" }}>
              No posts match those filters.
            </div>
          )}
        </aside>
      </div>
      <div style={{ height: 30 }} />
    </div>
  );
}
