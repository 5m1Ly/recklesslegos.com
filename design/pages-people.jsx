/* ============================================================
   THROUGHLINE — People directory, profile, connections graph
   ============================================================ */
const SIDE_META = {
  creator: { label: "Creator side", tone: "var(--blue)" },
  business: { label: "Business side", tone: "var(--amber)" },
  official: { label: "Officials", tone: "var(--red)" },
  press: { label: "Press", tone: "var(--tx-1)" },
};

function PersonCard({ p, go }) {
  const sm = SIDE_META[p.side];
  return (
    <div
      className="card hover"
      style={{
        cursor: "pointer",
        padding: "22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      onClick={() => go("person:" + p.id)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar name={p.name} size={52} side={p.side} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <h3 className="h-card" style={{ fontSize: 17 }}>
              {p.name}
            </h3>
            {p.verified && (
              <Icon.check
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
          <span className="dot" style={{ background: sm.tone }}></span>
          {sm.label}
        </span>
        <span className="mono-sm" style={{ marginLeft: "auto" }}>
          {p.events.length} events
        </span>
      </div>
    </div>
  );
}

function PeoplePage({ go }) {
  const [side, setSide] = useState("All");
  const sides = ["All", "creator", "business", "official", "press"];
  const rows = DB.people.filter((p) => side === "All" || p.side === side);
  return (
    <div>
      <PageHead
        crumb={
          <span>
            <a onClick={() => go("home")} style={{ cursor: "pointer" }}>
              Home
            </a>{" "}
            / People involved
          </span>
        }
        title="People involved"
        sub="A reference directory of the public figures and organizations in the record — limited to their public roles and publicly available information. No private contact details are listed."
      >
        <div
          className="card card-pad"
          style={{
            marginTop: 22,
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            maxWidth: 680,
            background: "var(--ink-2)",
          }}
        >
          <Icon.shield
            style={{
              width: 18,
              height: 18,
              color: "var(--amber)",
              flexShrink: 0,
              marginTop: 1,
            }}
          />
          <p
            className="body-txt"
            style={{ fontSize: 13.5, margin: 0, color: "var(--tx-2)" }}
          >
            This directory documents only public-facing roles and conduct. It
            contains no home addresses, private contact information, or personal
            details — and in this demo, every individual is fictional.
          </p>
        </div>
      </PageHead>
      <div className="wrap-wide section-sm" style={{ paddingTop: 24 }}>
        <div className="filterbar" style={{ paddingTop: 0 }}>
          {sides.map((s) => (
            <button
              key={s}
              className={`chip ${side === s ? "on" : ""}`}
              onClick={() => setSide(s)}
            >
              {s === "All" ? "Everyone" : SIDE_META[s].label}
            </button>
          ))}
          <div className="grow"></div>
          <span className="mono-sm tnum">{rows.length} people</span>
        </div>
        <div className="grid-3">
          {rows.map((p) => (
            <PersonCard key={p.id} p={p} go={go} />
          ))}
        </div>
        <div style={{ height: 30 }}></div>
      </div>
    </div>
  );
}

/* ---------- Connections graph (simple SVG relationship map) ---------- */
function ConnectionsGraph({ person, go }) {
  // connected people = those sharing an event
  const connected = DB.people.filter(
    (o) =>
      o.id !== person.id && o.events.some((e) => person.events.includes(e)),
  );
  const W = 560,
    H = 360,
    cx = W / 2,
    cy = H / 2;
  const nodes = connected.map((o, i) => {
    const ang = -Math.PI / 2 + (i / connected.length) * Math.PI * 2;
    const r = 138;
    return { o, x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
  });
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* edges */}
      {nodes.map((n, i) => (
        <line
          key={"e" + i}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke="var(--line-2)"
          strokeWidth="1"
        />
      ))}
      {/* connected nodes */}
      {nodes.map((n, i) => {
        const tone = SIDE_META[n.o.side].tone;
        return (
          <g
            key={n.o.id}
            style={{ cursor: "pointer" }}
            onClick={() => go("person:" + n.o.id)}
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
              {n.o.name
                .split(" ")
                .filter((w) => /^[A-Z]/.test(w))
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </text>
            <text
              x={n.x}
              y={n.y + 38}
              textAnchor="middle"
              fontFamily="var(--sans)"
              fontSize="11"
              fill="var(--tx-2)"
            >
              {n.o.name.length > 16 ? n.o.name.slice(0, 15) + "…" : n.o.name}
            </text>
          </g>
        );
      })}
      {/* center node */}
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
        {person.name
          .split(" ")
          .filter((w) => /^[A-Z]/.test(w))
          .slice(0, 2)
          .map((w) => w[0])
          .join("")}
      </text>
    </svg>
  );
}

function PersonProfile({ id, go }) {
  const p = DB.personById(id);
  if (!p) return <div className="wrap-wide section">Person not found.</div>;
  const sm = SIDE_META[p.side];
  const events = p.events
    .map((e) => DB.eventById(e))
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
  const relVideos = DB.videos
    .filter((v) => events.some((e) => e.id === v.event))
    .slice(0, 3);
  const relDocs = DB.documents
    .filter((d) => events.some((e) => e.id === d.event))
    .slice(0, 3);

  return (
    <div>
      <div className="page-head" style={{ paddingBottom: 36 }}>
        <div className="wrap-wide">
          <div className="crumb">
            <a onClick={() => go("people")} style={{ cursor: "pointer" }}>
              People
            </a>{" "}
            / {p.name}
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <Avatar name={p.name} size={84} side={p.side} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <h1
                  className="page-title"
                  style={{ fontSize: 38, margin: 0, whiteSpace: "nowrap" }}
                >
                  {p.name}
                </h1>
                {p.verified && (
                  <Icon.check
                    style={{
                      width: 20,
                      height: 20,
                      color: "var(--blue)",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <span className="tag">
                  <span className="dot" style={{ background: sm.tone }}></span>
                  {sm.label}
                </span>
                <span className="tag solid">{p.role}</span>
                <span className="tag solid">{p.org}</span>
              </div>
              <p className="lede" style={{ maxWidth: 680, fontSize: 16 }}>
                {p.bio}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap-wide section-sm">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: 40,
            alignItems: "start",
          }}
          className="profile-layout"
        >
          {/* left: involvement + media */}
          <div>
            <div className="eyebrow line" style={{ marginBottom: 20 }}>
              Timeline involvement
            </div>
            <div
              className="stack"
              style={{
                gap: 0,
                borderLeft: "1px solid var(--line)",
                marginBottom: 44,
              }}
            >
              {events.map((e) => (
                <div
                  key={e.id}
                  onClick={() => go("timeline")}
                  style={{
                    position: "relative",
                    padding: "4px 0 22px 26px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: -5,
                      top: 8,
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "var(--ink-0)",
                      border: "2px solid var(--blue)",
                    }}
                  ></div>
                  <div className="mono-sm" style={{ marginBottom: 6 }}>
                    {fmtDate(e.date)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    {e.cats.map((c) => (
                      <CatTag key={c} cat={c} />
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      color: "var(--tx-0)",
                      fontFamily: "var(--serif)",
                      fontWeight: 500,
                    }}
                  >
                    {e.title}
                  </div>
                </div>
              ))}
            </div>

            <div className="eyebrow line" style={{ marginBottom: 20 }}>
              Related media
            </div>
            <div className="grid-3">
              {relVideos.map((v) => (
                <div
                  key={v.id}
                  className="card hover"
                  style={{ cursor: "pointer", overflow: "hidden" }}
                  onClick={() => go("videos")}
                >
                  <div className="ph thumb" style={{ aspectRatio: "16/9" }}>
                    <div className="play-badge">
                      <Icon.play />
                    </div>
                    <span className="dur-badge">{v.dur}</span>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        color: "var(--tx-0)",
                        lineHeight: 1.35,
                      }}
                    >
                      {v.title}
                    </div>
                  </div>
                </div>
              ))}
              {relDocs.map((d) => (
                <div
                  key={d.id}
                  className="card hover"
                  style={{ cursor: "pointer", padding: "16px" }}
                  onClick={() => go("documents")}
                >
                  <span className="tag document" style={{ marginBottom: 10 }}>
                    <span className="dot"></span>
                    {d.type}
                  </span>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: "var(--tx-0)",
                      lineHeight: 1.35,
                      marginTop: 8,
                    }}
                  >
                    {d.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right: connections graph */}
          <div style={{ position: "sticky", top: 84 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div className="mono-label">Connections graph</div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <ConnectionsGraph person={p} go={go} />
              </div>
              <div
                style={{
                  padding: "12px 18px",
                  borderTop: "1px solid var(--line)",
                }}
              >
                <p className="mono-sm" style={{ margin: 0, lineHeight: 1.5 }}>
                  People connected through shared events. Click a node to open
                  their profile.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: 30 }}></div>
      </div>
    </div>
  );
}

Object.assign(window, {
  SIDE_META,
  PersonCard,
  PeoplePage,
  ConnectionsGraph,
  PersonProfile,
});
