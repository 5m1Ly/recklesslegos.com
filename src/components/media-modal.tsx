"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { Bodycam, Event, Video } from "@/lib/types";
import { fmtDate } from "@/lib/types";
import { Icons } from "./icons";

type ModalItem = (
  | Video
  | (Bodycam & { source?: string; official?: boolean })
) & {
  event?: Event | null;
};

interface MediaModalProps {
  item: ModalItem | null;
  onClose: () => void;
}

function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function MediaModal({ item, onClose }: MediaModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!item) return null;

  const platform = "platform" in item ? item.platform : "Body-worn camera";
  const dur = "dur" in item ? item.dur : undefined;
  const official = "official" in item ? item.official : true;
  const views = "views" in item ? (item as Video).views : "—";
  const source =
    "source" in item
      ? ((item as { source?: string }).source ?? "")
      : "American Fork PD";

  const ytId = getYouTubeId(item.url);
  const isLocalVideo = !ytId && item.url?.startsWith("/media/");

  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(5,8,11,0.82)",
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
          width: "min(900px, 94vw)",
          background: "var(--ink-1)",
          border: "1px solid var(--line-2)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div style={{ aspectRatio: "16/9", position: "relative" }}>
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?rel=0`}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
            />
          ) : isLocalVideo ? (
            // biome-ignore lint/a11y/useMediaCaption: bodycam footage, captions not available
            <video
              controls
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                background: "#000",
              }}
            >
              <source src={item.url ?? ""} />
            </video>
          ) : (
            <div className="ph" style={{ position: "absolute", inset: 0 }}>
              <div style={{ textAlign: "center" }}>
                <div
                  className="play-badge"
                  style={{
                    position: "static",
                    width: 64,
                    height: 64,
                    margin: "0 auto 14px",
                  }}
                >
                  <Icons.play />
                </div>
                <span className="ph-lbl">
                  {platform} · {dur}
                </span>
              </div>
            </div>
          )}
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(11,15,20,0.7)",
            }}
          >
            <Icons.close />
          </button>
        </div>
        <div style={{ padding: "22px 24px" }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            {official && (
              <span className="tag police">
                <span className="dot" />
                Official source
              </span>
            )}
            <span className="tag">{platform}</span>
            {item.event && (
              <span className="tag solid">
                Timeline · {fmtDate(item.event.date)}
              </span>
            )}
          </div>
          <h2 className="h-section" style={{ fontSize: 24, marginBottom: 10 }}>
            {item.title}
          </h2>
          <div
            className="mono-sm"
            style={{
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              marginBottom: item.url ? 16 : 0,
            }}
          >
            <span>{source}</span>
            <span>{fmtDate(item.date)}</span>
            {views && views !== "—" && <span>{views} views</span>}
            {dur && dur !== "—" && <span>Runtime {dur}</span>}
          </div>
          {item.url && (
            <Link
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icons.ext style={{ width: 15, height: 15 }} /> Open on {platform}{" "}
              ↗
            </Link>
          )}
        </div>
      </div>
    </button>
  );
}
