/* ============================================================
   THROUGHLINE — Social media archive
   ============================================================ */
const PLATFORM_META = {
  X: { abbr: "X", tone: "var(--tx-0)" },
  Reddit: { abbr: "R", tone: "var(--red)" },
  TikTok: { abbr: "TT", tone: "var(--violet)" },
  Instagram: { abbr: "IG", tone: "var(--amber)" },
  Facebook: { abbr: "f", tone: "var(--blue)" },
  YouTube: { abbr: "YT", tone: "var(--red)" },
};

function PostCard({ s, go }) {
  const pm = PLATFORM_META[s.platform] || { abbr: "?", tone: "var(--tx-2)" };
  const ev = s.event ? DB.eventById(s.event) : null;
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
              <Icon.check
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
        <span className="mono-sm tnum">
          <Icon.heart
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
        {s.reposts !== "—" && (
          <span className="mono-sm tnum">⇄ {s.reposts}</span>
        )}
        <span className="mono-sm tnum">💬 {s.replies}</span>
        <div className="grow"></div>
        {ev && (
          <button
            className="chip btn-sm"
            onClick={() => go("timeline")}
            style={{ fontSize: 11, padding: "4px 10px" }}
          >
            Related event
          </button>
        )}
      </div>
    </div>
  );
}

function SocialPage({ go }) {
  const [platform, setPlatform] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Newest");
  const platforms = ["All", ...DB.platforms];

  let rows = DB.social.filter((s) => {
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
    <div>
      <PageHead
        crumb={
          <span>
            <a onClick={() => go("home")} style={{ cursor: "pointer" }}>
              Home
            </a>{" "}
            / Social media
          </span>
        }
        title="Social media archive"
        sub="Public posts discussing the case across six platforms, captured with their engagement at time of archiving and linked to related events. Embeds are placeholders."
      />
      <div className="wrap-wide section-sm" style={{ paddingTop: 24 }}>
        <div className="filterbar" style={{ paddingTop: 0 }}>
          <div className="search-field">
            <Icon.search />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search posts…"
            />
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {platforms.map((p) => (
              <button
                key={p}
                className={`chip ${platform === p ? "on" : ""}`}
                onClick={() => setPlatform(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="grow"></div>
          <select
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </div>
        <div className="grid-3 social-masonry" style={{ alignItems: "start" }}>
          {rows.map((s) => (
            <PostCard key={s.id} s={s} go={go} />
          ))}
        </div>
        {rows.length === 0 && (
          <div style={{ padding: "40px 0", color: "var(--tx-3)" }}>
            No posts match those filters.
          </div>
        )}
        <div style={{ height: 30 }}></div>
      </div>
    </div>
  );
}

Object.assign(window, { PLATFORM_META, PostCard, SocialPage });
