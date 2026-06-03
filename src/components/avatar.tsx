import type { Side } from "@/lib/types";

interface AvatarProps {
  name: string;
  size?: number;
  side?: Side;
}

export function Avatar({ name, size = 44, side }: AvatarProps) {
  const initials = name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const toneMap: Record<string, string> = {
    creator: "var(--blue)",
    business: "var(--amber)",
    official: "var(--red)",
    press: "var(--tx-1)",
  };
  const tone = (side && toneMap[side]) || "var(--tx-2)";

  return (
    <div
      className="ph"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        border: "1px solid var(--line-2)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: size * 0.3,
          color: tone,
          letterSpacing: "0.02em",
        }}
      >
        {initials}
      </span>
    </div>
  );
}
