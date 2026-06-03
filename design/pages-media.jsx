/* ============================================================
   THROUGHLINE — Videos page + Bodycam evidence database
   ============================================================ */

/* ---------- Media modal (placeholder player) ---------- */
function MediaModal({ item, onClose }) {
  useEffect(() => {
    const k = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  if (!item) return null;
  return (
    <div
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(900px,94vw)",
          background: "var(--ink-1)",
          border: "1px solid var(--line-2)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          className="ph"
          style={{ aspectRatio: "16/9", position: "relative" }}
        >
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
              <Icon.play />
            </div>
            <span className="ph-lbl">
              {item.platform || "video"} embed · {item.dur || item.runtime}
            </span>
          </div>
          <button
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(11,15,20,0.7)",
            }}
          >
            <Icon.close />
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
            {item.official && (
              <span className="tag police">
                <span className="dot"></span>Official source
              </span>
            )}
            <span className="tag">{item.platform}</span>
            {item.event && (
              <span className="tag solid">
                Timeline · {fmtDate(DB.eventById(item.event).date)}
              </span>
            )}
          </div>
          <h2 className="h-section" style={{ fontSize: 24, marginBottom: 10 }}>
            {item.title}
          </h2>
          <div
            className="mono-sm"
            style={{ display: "flex", gap: 18, flexWrap: "wrap" }}
          >
            <span>{item.source}</span>
            <span>{fmtDate(item.date)}</span>
            {item.views && item.views !== "—" && (
              <span>{item.views} views</span>
            )}
            <span>Runtime {item.dur}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Video card ---------- */
function VideoCard({ v, onOpen }) {
  return (
    <div
      className="card hover"
      style={{ cursor: "pointer", overflow: "hidden" }}
      onClick={() => onOpen(v)}
    >
      <div className="ph thumb" style={{ aspectRatio: "16/9" }}>
        <span className="ph-lbl">
          {v.official ? "official footage" : "video still"}
        </span>
        <div className="play-badge">
          <Icon.play />
        </div>
        <span className="dur-badge">{v.dur}</span>
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
          ></span>
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
              ></span>
              <span className="mono-sm">{v.views}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const VIDEO_TIERS = [
  [
    "creator",
    "Curb Authority videos",
    "Primary uploads from the creator at the centre of the story.",
  ],
  [
    "official",
    "Official sources",
    "Police, district attorney, and other government footage.",
  ],
  [
    "business",
    "Cogwheel & corporate",
    "Statements from the franchise, franchisor, and counsel.",
  ],
  [
    "coverage",
    "Coverage & commentary",
    "Journalists, analysts, and independent creators.",
  ],
];

function VideosPage({ go }) {
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("All");
  const platforms = [
    "All",
    ...Array.from(new Set(DB.videos.map((v) => v.platform))),
  ];

  const match = (v) => {
    const t = q.trim().toLowerCase();
    return (
      (!t || (v.title + v.source).toLowerCase().includes(t)) &&
      (platform === "All" || v.platform === platform)
    );
  };

  return (
    <div>
      <PageHead
        crumb={
          <span>
            <a onClick={() => go("home")} style={{ cursor: "pointer" }}>
              Home
            </a>{" "}
            / Videos
          </span>
        }
        title="Video archive"
        sub="Every video in the record, grouped by source — from the creator's own uploads to official footage, corporate statements, and outside coverage. Demo embeds are placeholders."
      />
      <div className="wrap-wide">
        <div className="filterbar">
          <div className="search-field">
            <Icon.search />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search videos by title or source…"
            />
          </div>
          <Icon.filter
            style={{ width: 16, height: 16, color: "var(--tx-3)" }}
          />
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

        {VIDEO_TIERS.map(([tier, title, desc]) => {
          const vids = DB.videos.filter((v) => v.tier === tier && match(v));
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
        <div style={{ height: 30 }}></div>
      </div>
      <MediaModal item={modal} onClose={() => setModal(null)} />
    </div>
  );
}

/* ---------- Bodycam evidence database ---------- */
function BodycamPage({ go }) {
  const [modal, setModal] = useState(null);
  const [officer, setOfficer] = useState("All");
  const [q, setQ] = useState("");
  const officers = [
    "All",
    ...Array.from(new Set(DB.bodycam.map((b) => b.officer))),
  ];

  const rows = DB.bodycam.filter((b) => {
    const t = q.trim().toLowerCase();
    return (
      (officer === "All" || b.officer === officer) &&
      (!t || (b.title + b.location + b.type).toLowerCase().includes(t))
    );
  });

  return (
    <div>
      <PageHead
        crumb={
          <span>
            <a onClick={() => go("home")} style={{ cursor: "pointer" }}>
              Home
            </a>{" "}
            / Bodycam footage
          </span>
        }
        title="Police bodycam evidence"
        sub="Body-worn camera footage released by Cedar Hollow PD under the April 30 public-records request. Each file is logged with its unit, officer, runtime, and the timeline event it belongs to."
      >
        <div
          style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}
        >
          <span className="tag police">
            <Icon.shield style={{ width: 13, height: 13, marginRight: 4 }} />
            FOIA-released · chain of custody logged
          </span>
          <span className="tag">
            <Icon.map style={{ width: 13, height: 13, marginRight: 4 }} />6
            files · 2 units · 1 location
          </span>
        </div>
      </PageHead>

      <div className="wrap-wide section-sm" style={{ paddingTop: 28 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 32,
            alignItems: "start",
          }}
          className="bodycam-layout"
        >
          <div>
            <div className="filterbar" style={{ paddingTop: 0 }}>
              <div className="search-field">
                <Icon.search />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by title, type, or location…"
                />
              </div>
              {officers.map((o) => (
                <button
                  key={o}
                  className={`chip ${officer === o ? "on" : ""}`}
                  onClick={() => setOfficer(o)}
                >
                  {o === "All" ? "All units" : o}
                </button>
              ))}
            </div>

            {/* evidence table */}
            <div className="card" style={{ overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "88px 1fr 130px 88px",
                  gap: 0,
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--line)",
                  background: "var(--ink-2)",
                }}
              >
                <span className="mono-label">Preview</span>
                <span className="mono-label">Incident / file</span>
                <span className="mono-label">Officer · unit</span>
                <span className="mono-label" style={{ textAlign: "right" }}>
                  Length
                </span>
              </div>
              {rows.map((b, i) => (
                <div
                  key={b.id}
                  onClick={() =>
                    setModal({
                      ...b,
                      title: b.title,
                      source: "Cedar Hollow PD",
                      platform: "Body-worn camera",
                      official: true,
                      views: "—",
                    })
                  }
                  style={{
                    display: "grid",
                    gridTemplateColumns: "88px 1fr 130px 88px",
                    gap: 0,
                    padding: "14px 16px",
                    borderBottom:
                      i < rows.length - 1 ? "1px solid var(--line)" : "0",
                    cursor: "pointer",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    className="ph"
                    style={{
                      width: 72,
                      height: 44,
                      borderRadius: 3,
                      position: "relative",
                    }}
                  >
                    <div
                      className="play-badge"
                      style={{ position: "static", width: 24, height: 24 }}
                    >
                      <Icon.play style={{ width: 10, height: 10 }} />
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14.5,
                        color: "var(--tx-0)",
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {b.title}
                    </div>
                    <div
                      className="mono-sm"
                      style={{ display: "flex", gap: 12 }}
                    >
                      <span>
                        {fmtDate(b.date)} · {b.time}
                      </span>
                      <span style={{ color: "var(--tx-3)" }}>{b.type}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--tx-1)" }}>
                      {b.officer}
                    </div>
                    <div className="mono-sm">Unit {b.unit}</div>
                  </div>
                  <div
                    className="mono-sm tnum"
                    style={{ textAlign: "right", color: "var(--tx-1)" }}
                  >
                    {b.dur}
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <div
                  style={{
                    padding: "30px 16px",
                    color: "var(--tx-3)",
                    fontSize: 14,
                  }}
                >
                  No footage matches those filters.
                </div>
              )}
            </div>
          </div>

          {/* map sidebar */}
          <div style={{ position: "sticky", top: 84 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              <div
                className="ph"
                style={{ aspectRatio: "1/1", position: "relative" }}
              >
                <span
                  className="ph-lbl"
                  style={{ position: "absolute", top: 14, left: 14 }}
                >
                  Incident map · Cedar Hollow
                </span>
                <div style={{ position: "absolute", left: "42%", top: "48%" }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "var(--red)",
                      boxShadow: "0 0 0 6px var(--red-dim)",
                    }}
                  ></div>
                </div>
              </div>
              <div className="card-pad">
                <div className="mono-label" style={{ marginBottom: 10 }}>
                  Single incident location
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--tx-1)",
                    marginBottom: 4,
                  }}
                >
                  Cogwheel Collectibles
                </div>
                <div className="mono-sm">1400 Maple St., Cedar Hollow</div>
              </div>
            </div>
            <div className="card card-pad" style={{ marginTop: 16 }}>
              <div className="mono-label" style={{ marginBottom: 12 }}>
                Disclosure note
              </div>
              <p
                className="body-txt"
                style={{ fontSize: 13, margin: 0, color: "var(--tx-2)" }}
              >
                Footage shown is fictional sample data. In a real archive, faces
                and identifying details of uninvolved bystanders would be
                redacted prior to publication.
              </p>
            </div>
          </div>
        </div>
      </div>
      <MediaModal item={modal} onClose={() => setModal(null)} />
    </div>
  );
}

Object.assign(window, { MediaModal, VideoCard, VideosPage, BodycamPage });
