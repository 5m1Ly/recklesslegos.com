"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminItemControls } from "@/components/admin-content";
import { Avatar } from "@/components/avatar";
import { Icons } from "@/components/icons";
import { type Person, SIDE_META, type Side } from "@/lib/types";

type PersonWithEventCount = Person & { events: { eventId: string }[] };

function PersonCard({ p }: { p: PersonWithEventCount }) {
  const sm = SIDE_META[p.side as Side];
  return (
    <Link
      href={`/people/${p.id}`}
      className="card hover"
      style={{
        cursor: "pointer",
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar name={p.name} size={52} side={p.side as Side} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <h3 className="h-card" style={{ fontSize: 17 }}>
              {p.name}
            </h3>
            {p.verified && (
              <Icons.check
                style={{ width: 13, height: 13, color: "var(--blue)" }}
              />
            )}
          </div>
          <div className="mono-sm" style={{ marginTop: 3 }}>
            {p.role}
          </div>
        </div>
      </div>
      <p
        className="body-txt"
        style={{
          fontSize: 13.5,
          margin: 0,
          color: "var(--tx-2)",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {p.bio}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: "auto",
          paddingTop: 6,
        }}
      >
        <span className="tag" style={{ borderColor: "var(--line-2)" }}>
          <span className="dot" style={{ background: sm.tone }} />
          {sm.label}
        </span>
        <span className="mono-sm" style={{ marginLeft: "auto" }}>
          {p.events.length} events
        </span>
      </div>
    </Link>
  );
}

export function PeopleClient({ people }: { people: PersonWithEventCount[] }) {
  const [side, setSide] = useState("All");
  const sides = ["All", "creator", "business", "official", "press"];

  const rows = people.filter((p) => side === "All" || p.side === side);

  return (
    <div className="wrap-wide section-sm" style={{ paddingTop: 24 }}>
      <div className="filterbar" style={{ paddingTop: 0 }}>
        {sides.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${side === s ? "on" : ""}`}
            onClick={() => setSide(s)}
          >
            {s === "All" ? "Everyone" : SIDE_META[s as Side].label}
          </button>
        ))}
        <div className="grow" />
        <span className="mono-sm tnum">{rows.length} people</span>
      </div>
      <div className="grid-3">
        {rows.map((p) => (
          <div key={p.id}>
            <PersonCard p={p} />
            <AdminItemControls
              type="person"
              id={p.id}
              row={p}
              style={{ marginTop: 8, padding: "0 2px" }}
            />
          </div>
        ))}
      </div>
      <div style={{ height: 30 }} />
    </div>
  );
}
