import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Site-wide default social share image (also used as the Twitter image).
// Generated as code so it stays on-brand without shipping a binary asset.
export const alt = `${SITE_NAME} — Bricks & Minifigs takeover archive`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hex equivalents of the design tokens — satori does not support oklch().
const BG = "#0b0f14";
const TEXT = "#f4f7fa";
const MUTED = "#9aa7b4";
const BLUE = "#3b82f6";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: BG,
        padding: "72px 80px",
        borderTop: `12px solid ${BLUE}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 30,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        Case Archive
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            color: TEXT,
            lineHeight: 1.05,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            color: MUTED,
            lineHeight: 1.4,
            maxWidth: 980,
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
