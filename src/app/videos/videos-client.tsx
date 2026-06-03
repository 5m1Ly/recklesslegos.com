"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { MediaModal } from "@/components/media-modal";
import type { Event } from "@/lib/types";
import { fmtDate, VIDEO_TIERS, type Video } from "@/lib/types";

type VideoWithEvent = Video & { event: Event | null };

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function VideoCard({
  v,
  onOpen,
}: {
  v: VideoWithEvent;
  onOpen: (v: VideoWithEvent) => void;
}) {
  const ytId = getYouTubeId(v.url);

  return (
    <button
      type="button"
      className="card hover"
      style={{
        cursor: "pointer",
        overflow: "hidden",
        textAlign: "left",
        width: "100%",
      }}
      onClick={() => onOpen(v)}
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
          // biome-ignore lint/performance/noImgElement: YouTube thumbnail, no next/image needed
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt={v.title}
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
              {v.official ? "official footage" : "video still"}
            </span>
          </div>
        )}
        <div
          className="play-badge"
          style={{ position: "absolute", bottom: 10, right: 10 }}
        >
          <Icons.play />
        </div>
        {v.dur && v.dur !== "—" && <span className="dur-badge">{v.dur}</span>}
      </div>
      <div className="card-pad">
        <h3 className="h-card" style={{ marginBottom: 12, fontSize: 17 }}>
          {v.title}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span className="mono-sm" style={{ color: "var(--tx-1)" }}>
            {v.source}
          </span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "var(--tx-4)",
            }}
          />
          <span className="mono-sm">{fmtDate(v.date)}</span>
          {v.views && v.views !== "—" && (
            <>
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "var(--tx-4)",
                }}
              />
              <span className="mono-sm">{v.views}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export function VideosClient({ videos }: { videos: VideoWithEvent[] }) {
  const [modal, setModal] = useState<VideoWithEvent | null>(null);
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("All");

  const platforms = [
    "All",
    ...Array.from(new Set(videos.map((v) => v.platform))),
  ];

  const match = (v: VideoWithEvent) => {
    const t = q.trim().toLowerCase();
    return (
      (!t || (v.title + v.source).toLowerCase().includes(t)) &&
      (platform === "All" || v.platform === platform)
    );
  };

  return (
    <div className="wrap-wide">
      <div className="filterbar">
        <div className="search-field">
          <Icons.search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search videos by title or source…"
          />
        </div>
        <Icons.filter style={{ width: 16, height: 16, color: "var(--tx-3)" }} />
        {platforms.map((p) => (
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

      {VIDEO_TIERS.map(([tier, title, desc]) => {
        const vids = videos.filter((v) => v.tier === tier && match(v));
        if (vids.length === 0) return null;
        return (
          <section key={tier} style={{ padding: "18px 0 36px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                marginBottom: 18,
                paddingBottom: 14,
                borderBottom: "1px solid var(--line)",
              }}
            >
              <h2 className="h-section" style={{ fontSize: 22 }}>
                {title}
              </h2>
              <span className="mono-sm tnum">{vids.length}</span>
              <span
                className="mono-sm"
                style={{
                  marginLeft: "auto",
                  maxWidth: 360,
                  textAlign: "right",
                  color: "var(--tx-3)",
                }}
              >
                {desc}
              </span>
            </div>
            <div className="grid-3">
              {vids.map((v) => (
                <VideoCard key={v.id} v={v} onOpen={setModal} />
              ))}
            </div>
          </section>
        );
      })}
      <div style={{ height: 30 }} />
      <MediaModal item={modal} onClose={() => setModal(null)} />
    </div>
  );
}
