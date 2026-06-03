/* ============================================================
   THROUGHLINE — Documents archive + viewer
   ============================================================ */

function DocViewer({ doc, onClose, go }) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [doc]);
  useEffect(() => {
    const k = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  if (!doc) return null;
  const ev = doc.event ? DB.eventById(doc.event) : null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(5,8,11,0.85)",
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
          width: "min(1080px,96vw)",
          height: "min(760px,92vh)",
          background: "var(--ink-1)",
          border: "1px solid var(--line-2)",
          borderRadius: 10,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 340px",
        }}
      >
        {/* page viewer */}
        <div
          style={{
            background: "var(--ink-0)",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span className="tag document">
              <span className="dot"></span>
              {doc.type}
            </span>
            <div className="grow"></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                className="chip"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              <span className="mono-sm tnum">
                Page {page} / {doc.pages}
              </span>
              <button
                className="chip"
                onClick={() => setPage((p) => Math.min(doc.pages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "28px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              className="ph"
              style={{
                width: "min(440px,100%)",
                aspectRatio: "8.5/11",
                borderRadius: 3,
                alignItems: "flex-start",
                padding: "34px 30px",
                flexDirection: "column",
                gap: 11,
              }}
            >
              <div
                style={{
                  width: "55%",
                  height: 12,
                  background: "var(--line-2)",
                  borderRadius: 2,
                }}
              ></div>
              <div
                style={{
                  width: "80%",
                  height: 8,
                  background: "var(--line)",
                  borderRadius: 2,
                  marginTop: 8,
                }}
              ></div>
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i % 3 === 2 ? "62%" : "100%",
                    height: 6,
                    background: "var(--line)",
                    borderRadius: 2,
                  }}
                ></div>
              ))}
              <span className="ph-lbl" style={{ marginTop: "auto" }}>
                document page {page} · OCR placeholder
              </span>
            </div>
          </div>
        </div>
        {/* metadata */}
        <div
          style={{ display: "flex", flexDirection: "column", overflow: "auto" }}
        >
          <div
            style={{
              padding: "20px 22px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <h2 className="h-card" style={{ fontSize: 18, lineHeight: 1.3 }}>
              {doc.title}
            </h2>
            <button
              className="btn btn-icon btn-ghost"
              onClick={onClose}
              style={{ flexShrink: 0 }}
            >
              <Icon.close />
            </button>
          </div>
          <div
            style={{
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div>
              <div className="mono-label" style={{ marginBottom: 9 }}>
                Details
              </div>
              <dl
                style={{
                  margin: 0,
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "9px 16px",
                  fontSize: 13.5,
                }}
              >
                <dt className="muted">Source</dt>
                <dd style={{ margin: 0, color: "var(--tx-0)" }}>
                  {doc.source}
                </dd>
                <dt className="muted">Date</dt>
                <dd style={{ margin: 0, color: "var(--tx-0)" }}>
                  {fmtDate(doc.date)}
                </dd>
                <dt className="muted">Pages</dt>
                <dd style={{ margin: 0, color: "var(--tx-0)" }}>{doc.pages}</dd>
                <dt className="muted">Type</dt>
                <dd style={{ margin: 0, color: "var(--tx-0)" }}>{doc.type}</dd>
              </dl>
            </div>
            <div>
              <div className="mono-label" style={{ marginBottom: 9 }}>
                Summary
              </div>
              <p className="body-txt" style={{ fontSize: 13.5, margin: 0 }}>
                {doc.summary}
              </p>
            </div>
            <div>
              <div className="mono-label" style={{ marginBottom: 9 }}>
                Tags
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {doc.tags.map((t) => (
                  <span key={t} className="tag solid">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {ev && (
              <div>
                <div className="mono-label" style={{ marginBottom: 9 }}>
                  Related event
                </div>
                <button
                  className="card hover"
                  onClick={() => {
                    onClose();
                    go("timeline");
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    cursor: "pointer",
                    background: "var(--ink-card)",
                  }}
                >
                  <div className="mono-sm" style={{ marginBottom: 4 }}>
                    {fmtDate(ev.date)}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--tx-0)" }}>
                    {ev.title}
                  </div>
                </button>
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: "auto",
              padding: "16px 22px",
              borderTop: "1px solid var(--line)",
              display: "flex",
              gap: 10,
            }}
          >
            <button className="btn btn-blue btn-sm" style={{ flex: 1 }}>
              <Icon.download style={{ width: 15, height: 15 }} /> Download
            </button>
            <button className="btn btn-ghost btn-sm">
              <Icon.ext style={{ width: 15, height: 15 }} /> Source
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocCard({ d, onOpen }) {
  return (
    <div
      className="card hover"
      style={{ cursor: "pointer", display: "flex", gap: 0, overflow: "hidden" }}
      onClick={() => onOpen(d)}
    >
      <div
        className="ph"
        style={{
          width: 96,
          flexShrink: 0,
          borderRight: "1px solid var(--line)",
          alignItems: "flex-start",
          padding: "14px 10px",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <div
          style={{
            width: "70%",
            height: 6,
            background: "var(--line-2)",
            borderRadius: 2,
          }}
        ></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === 4 ? "50%" : "100%",
              height: 4,
              background: "var(--line)",
              borderRadius: 2,
            }}
          ></div>
        ))}
      </div>
      <div className="card-pad" style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <span className="tag document">
            <span className="dot"></span>
            {d.type}
          </span>
          <span className="mono-sm" style={{ whiteSpace: "nowrap" }}>
            {d.pages} pp
          </span>
        </div>
        <h3 className="h-card" style={{ fontSize: 16.5, marginBottom: 8 }}>
          {d.title}
        </h3>
        <p
          className="body-txt"
          style={{
            fontSize: 13.5,
            margin: "0 0 12px",
            color: "var(--tx-2)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {d.summary}
        </p>
        <div className="mono-sm" style={{ display: "flex", gap: 10 }}>
          <span style={{ color: "var(--tx-1)" }}>{d.source}</span>
          <span style={{ color: "var(--tx-4)" }}>·</span>
          <span>{fmtDate(d.date)}</span>
        </div>
      </div>
    </div>
  );
}

function DocumentsPage({ go }) {
  const [viewer, setViewer] = useState(null);
  const [type, setType] = useState("All");
  const [q, setQ] = useState("");
  const types = ["All", ...DB.docTypes];

  const rows = DB.documents.filter((d) => {
    const t = q.trim().toLowerCase();
    return (
      (type === "All" || d.type === type) &&
      (!t || (d.title + d.summary + d.tags.join(" ")).toLowerCase().includes(t))
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
            / Documents
          </span>
        }
        title="Document archive"
        sub="Court filings, police reports, FOIA releases, correspondence, and public records — each OCR-indexed, tagged, and linked to the events it documents."
      />
      <div className="wrap-wide section-sm" style={{ paddingTop: 24 }}>
        <div className="filterbar" style={{ paddingTop: 0 }}>
          <div className="search-field">
            <Icon.search />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search documents and full text…"
            />
          </div>
          <select
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "All" ? "All types" : t}
              </option>
            ))}
          </select>
          <div className="grow"></div>
          <span className="mono-sm tnum">{rows.length} documents</span>
        </div>
        <div className="grid-2">
          {rows.map((d) => (
            <DocCard key={d.id} d={d} onOpen={setViewer} />
          ))}
        </div>
        {rows.length === 0 && (
          <div style={{ padding: "40px 0", color: "var(--tx-3)" }}>
            No documents match those filters.
          </div>
        )}
        <div style={{ height: 30 }}></div>
      </div>
      <DocViewer doc={viewer} onClose={() => setViewer(null)} go={go} />
    </div>
  );
}

Object.assign(window, { DocViewer, DocCard, DocumentsPage });
