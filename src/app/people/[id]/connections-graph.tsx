import { SIDE_META, type Side } from "@/lib/types";

interface GraphPerson {
  id: string;
  name: string;
  side: string;
}

interface ConnectionsGraphProps {
  person: GraphPerson;
  connected: GraphPerson[];
}

export function ConnectionsGraph({ person, connected }: ConnectionsGraphProps) {
  const W = 560;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;

  const nodes = connected.map((o, i) => {
    const ang = -Math.PI / 2 + (i / connected.length) * Math.PI * 2;
    const r = 138;
    return { o, x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
  });

  const initials = (name: string) =>
    name
      .split(" ")
      .filter((w) => /^[A-Z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0])
      .join("");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      aria-label="Connections graph"
    >
      <title>
        Connections graph — people sharing events with {person.name}
      </title>
      {nodes.map((n) => (
        <line
          key={`line-${n.o.id}`}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke="var(--line-2)"
          strokeWidth="1"
        />
      ))}
      {nodes.map((n) => {
        const tone = SIDE_META[n.o.side as Side]?.tone ?? "var(--tx-2)";
        return (
          <a
            key={n.o.id}
            href={`/people/${n.o.id}`}
            style={{ cursor: "pointer" }}
            aria-label={`View profile: ${n.o.name}`}
          >
            <circle
              cx={n.x}
              cy={n.y}
              r="22"
              fill="var(--ink-2)"
              stroke={tone}
              strokeWidth="1.5"
            />
            <text
              x={n.x}
              y={n.y + 4}
              textAnchor="middle"
              fontFamily="var(--mono)"
              fontSize="11"
              fill={tone}
            >
              {initials(n.o.name)}
            </text>
            <text
              x={n.x}
              y={n.y + 38}
              textAnchor="middle"
              fontFamily="var(--sans)"
              fontSize="11"
              fill="var(--tx-2)"
            >
              {n.o.name.length > 16 ? `${n.o.name.slice(0, 15)}…` : n.o.name}
            </text>
          </a>
        );
      })}
      <circle
        cx={cx}
        cy={cy}
        r="30"
        fill="var(--blue-dim)"
        stroke="var(--blue)"
        strokeWidth="2"
      />
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fontFamily="var(--mono)"
        fontSize="13"
        fill="var(--tx-0)"
      >
        {initials(person.name)}
      </text>
    </svg>
  );
}
