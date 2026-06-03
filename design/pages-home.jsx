/* ============================================================
   THROUGHLINE — Home page + reusable interactive Timeline
   ============================================================ */

/* ---------- Interactive timeline (used on Home + Timeline page) ---------- */
function TimelineView({ go, compact }) {
  const [cats, setCats] = useState([]); // active category filters
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(compact ? null : "e1");

  const toggleCat = (c) =>
    setCats((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

  const filtered = DB.events.filter((e) => {
    const catOk = cats.length === 0 || e.cats.some((c) => cats.includes(c));
    const t = q.trim().toLowerCase();
    const qOk = !t || (e.title + e.desc).toLowerCase().includes(t);
    return catOk && qOk;
  });

  const catKeys = Object.keys(DB.CATS);

  return (
    <div>
      {/* controls */}
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
          <Icon.search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events…"
          />
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <button
            className={`chip ${cats.length === 0 ? "on" : ""}`}
            onClick={() => setCats([])}
          >
            All
          </button>
          {catKeys.map((c) => (
            <button
              key={c}
              className={`chip ${cats.includes(c) ? "on" : ""}`}
              onClick={() => toggleCat(c)}
            >
              {DB.CATS[c].label}
            </button>
          ))}
        </div>
        <div className="grow"></div>
        <span className="mono-sm tnum">
          {filtered.length} / {DB.events.length} events
        </span>
      </div>

      {/* timeline rail */}
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
          className="tl-rail"
        ></div>
        {filtered.map((e) => {
          const isOpen = open === e.id;
          const relTotal = Object.values(e.rel).reduce((a, b) => a + b, 0);
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
              {/* date col */}
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
                    ></span>
                    Ongoing
                  </div>
                )}
              </div>
              {/* node */}
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
              ></div>
              {/* content */}
              <div style={{ padding: "18px 0 18px 36px" }}>
                <div
                  onClick={() => setOpen(isOpen ? null : e.id)}
                  className="card hover"
                  style={{
                    cursor: "pointer",
                    padding: "18px 20px",
                    borderColor: isOpen ? "var(--line-2)" : "var(--line)",
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
                          {/* related links */}
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              marginBottom: e.people.length ? 14 : 0,
                            }}
                          >
                            {e.rel.videos > 0 && (
                              <button
                                className="chip"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  go("videos");
                                }}
                              >
                                <Icon.play
                                  style={{
                                    width: 12,
                                    height: 12,
                                    marginRight: 6,
                                    display: "inline",
                                  }}
                                />
                                {e.rel.videos} video
                                {e.rel.videos > 1 ? "s" : ""}
                              </button>
                            )}
                            {e.rel.docs > 0 && (
                              <button
                                className="chip"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  go("documents");
                                }}
                              >
                                {e.rel.docs} document{e.rel.docs > 1 ? "s" : ""}
                              </button>
                            )}
                            {e.rel.bodycam > 0 && (
                              <button
                                className="chip"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  go("bodycam");
                                }}
                              >
                                {e.rel.bodycam} bodycam file
                                {e.rel.bodycam > 1 ? "s" : ""}
                              </button>
                            )}
                            {e.rel.social > 0 && (
                              <button
                                className="chip"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  go("social");
                                }}
                              >
                                {e.rel.social} social post
                                {e.rel.social > 1 ? "s" : ""}
                              </button>
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
                              {e.people.map((pid) => {
                                const p = DB.personById(pid);
                                return (
                                  <button
                                    key={pid}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      go("person:" + pid);
                                    }}
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
                                      side={p.side}
                                    />
                                    <span
                                      style={{
                                        fontSize: 13,
                                        color: "var(--tx-1)",
                                      }}
                                    >
                                      {p.name}
                                    </span>
                                  </button>
                                );
                              })}
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Home ---------- */
function HomePage({ go, onSearch }) {
  const quickNav = [
    [
      "videos",
      "Videos",
      "34 items",
      "Creator uploads, official footage, and coverage.",
    ],
    [
      "bodycam",
      "Bodycam",
      "6 files",
      "FOIA-released body-worn camera footage.",
    ],
    [
      "documents",
      "Documents",
      "27 records",
      "Filings, reports, FOIA releases, and notices.",
    ],
    ["social", "Social", "128 posts", "Public posts across six platforms."],
    ["people", "People", "11 profiles", "Public roles of everyone involved."],
  ];
  return (
    <div>
      {/* HERO */}
      <section
        style={{
          borderBottom: "1px solid var(--line)",
          background:
            "radial-gradient(120% 80% at 82% -20%, #16202b 0%, transparent 55%)",
        }}
      >
        <div
          className="wrap-wide"
          style={{ display: "grid", gridTemplateColumns: "1.08fr 0.92fr" }}
        >
          <div
            style={{
              padding: "76px 56px 64px 0",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div className="eyebrow line" style={{ marginBottom: 24 }}>
              Independent case archive · est. 2025
            </div>
            <h1
              className="h-display"
              style={{ fontSize: 56, marginBottom: 22 }}
            >
              Tracking the{" "}
              <em style={{ fontStyle: "italic", color: "var(--blue)" }}>
                Cedar&nbsp;Hollow
              </em>{" "}
              &amp; Cogwheel Collectibles story.
            </h1>
            <p className="lede" style={{ maxWidth: 540, marginBottom: 30 }}>
              A centralized archive of the publicly available videos, documents,
              social-media posts, police footage, and developments surrounding
              the incident — organized into a single, searchable record.
            </p>
            <div
              className="search-field"
              style={{ maxWidth: 540, marginBottom: 22, cursor: "text" }}
              onClick={onSearch}
            >
              <Icon.search />
              <span style={{ color: "var(--tx-3)", fontSize: 14, flex: 1 }}>
                Search videos, documents, events, people…
              </span>
              <span
                className="kbd"
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--tx-3)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 3,
                  padding: "1px 6px",
                }}
              >
                /
              </span>
            </div>
            <div style={{ display: "flex", gap: 13 }}>
              <button className="btn btn-blue" onClick={() => go("timeline")}>
                <Icon.clock style={{ width: 16, height: 16 }} /> View timeline
              </button>
              <button className="btn btn-ghost" onClick={() => go("documents")}>
                Browse evidence
              </button>
            </div>
          </div>
          <div
            style={{
              borderLeft: "1px solid var(--line)",
              position: "relative",
              minHeight: 480,
            }}
          >
            <div
              className="ph thumb"
              style={{
                position: "absolute",
                inset: "28px",
                borderRadius: "var(--radius)",
              }}
            >
              <span
                className="ph-lbl"
                style={{ position: "absolute", bottom: 14, left: 14 }}
              >
                Featured · case explainer video
              </span>
              <div
                className="play-badge"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%,-50%)",
                  width: 58,
                  height: 58,
                }}
              >
                <Icon.play />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="wrap-wide" style={{ padding: "40px 0" }}>
        <div className="stat-grid">
          {DB.stats.map((s) => (
            <div className="stat-cell" key={s.label}>
              <div className="sn tnum">{s.n}</div>
              <div className="sl">{s.label}</div>
              <div className="sx">{s.x}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CASE OVERVIEW */}
      <section className="wrap-wide section-sm">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div>
            <div className="eyebrow line" style={{ marginBottom: 20 }}>
              Case overview
            </div>
            <h2
              className="h-section"
              style={{ marginBottom: 18, fontSize: 28 }}
            >
              What this archive is tracking
            </h2>
            <p className="body-txt" style={{ marginBottom: 14 }}>
              <b style={{ color: "var(--tx-0)" }}>Reese Avila</b> runs{" "}
              <b style={{ color: "var(--tx-0)" }}>Curb Authority</b>, a channel
              documenting public-space and consumer disputes. In March 2025, a
              recording filmed inside a{" "}
              <b style={{ color: "var(--tx-0)" }}>Cogwheel Collectibles</b>{" "}
              franchise in the fictional town of Cedar Hollow turned into a
              dispute over the store's filming policy.
            </p>
            <p className="body-txt" style={{ marginBottom: 14 }}>
              The clip spread rapidly; police responded, the franchise issued a
              no-trespass notice, and the story escalated into a civil filing, a
              corporate statement, a FOIA release of bodycam footage, and a
              declined-charges decision from the district attorney.
            </p>
            <p className="body-txt" style={{ marginBottom: 22 }}>
              Throughline collects what each party has already made public and
              keeps it organized, sourced, and cross-linked — so the record
              doesn't depend on who has time to dig.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="tag solid">
                <span
                  className="dot"
                  style={{ background: "var(--amber)" }}
                ></span>
                Status: civil matter ongoing
              </span>
              <span className="tag solid">
                <span
                  className="dot"
                  style={{ background: "var(--green)" }}
                ></span>
                No criminal charges filed
              </span>
            </div>
          </div>
          <div
            className="ph thumb card"
            style={{ aspectRatio: "16/10", borderRadius: "var(--radius)" }}
          >
            <span className="ph-lbl">
              Cedar Hollow · Cogwheel storefront (still)
            </span>
          </div>
        </div>
      </section>

      <div className="wrap-wide">
        <hr className="divider" />
      </div>

      {/* INTERACTIVE TIMELINE */}
      <section className="wrap-wide section-sm">
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div className="eyebrow line" style={{ marginBottom: 16 }}>
              Interactive timeline
            </div>
            <h2 className="h-section">The record, in order</h2>
          </div>
          <button className="btn btn-ghost" onClick={() => go("timeline")}>
            Open full timeline <Icon.arrow />
          </button>
        </div>
        <TimelineView go={go} compact />
      </section>

      <div className="wrap-wide">
        <hr className="divider" />
      </div>

      {/* FEATURED CONTENT */}
      <section className="wrap-wide section-sm">
        <div className="eyebrow line" style={{ marginBottom: 20 }}>
          Latest additions
        </div>
        <div className="grid-3">
          {[
            {
              tag: "video",
              t: "Going through the FOIA bodycam footage",
              s: "Curb Authority · 28:12",
              go: () => go("videos"),
            },
            {
              tag: "document",
              t: "FOIA release — body-worn camera index",
              s: "Cedar Hollow PD · 5 pp",
              go: () => go("documents"),
            },
            {
              tag: "social",
              t: "Full FOIA dump is out — CAD logs + 6 bodycam files",
              s: "Reddit · r/PublicRecords",
              go: () => go("social"),
            },
          ].map((c, i) => (
            <div
              key={i}
              className="card hover"
              style={{ cursor: "pointer", overflow: "hidden" }}
              onClick={c.go}
            >
              <div className="ph thumb" style={{ aspectRatio: "16/9" }}>
                <span className="ph-lbl">
                  {c.tag === "video"
                    ? "video still"
                    : c.tag === "document"
                      ? "document preview"
                      : "post screenshot"}
                </span>
                {c.tag === "video" && (
                  <div className="play-badge">
                    <Icon.play />
                  </div>
                )}
              </div>
              <div className="card-pad">
                <div style={{ marginBottom: 12 }}>
                  <CatTag cat={c.tag} />
                </div>
                <h3 className="h-card" style={{ marginBottom: 10 }}>
                  {c.t}
                </h3>
                <div className="mono-sm">{c.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK NAV */}
      <section className="wrap-wide section-sm">
        <div className="eyebrow line" style={{ marginBottom: 20 }}>
          Browse the archive
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 16,
          }}
          className="quicknav-grid"
        >
          {quickNav.map(([id, title, count, desc]) => (
            <div
              key={id}
              className="card hover"
              style={{
                cursor: "pointer",
                padding: "22px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 172,
              }}
              onClick={() => go(id)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span className="mono-sm tnum" style={{ color: "var(--blue)" }}>
                  {count}
                </span>
                <Icon.arrow
                  style={{ width: 16, height: 16, color: "var(--tx-3)" }}
                />
              </div>
              <div className="grow"></div>
              <h3 className="h-card">{title}</h3>
              <p className="mono-sm" style={{ lineHeight: 1.5 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: 40 }}></div>
    </div>
  );
}

Object.assign(window, { TimelineView, HomePage });
