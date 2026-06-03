/* ============================================================
   THROUGHLINE — Shared components
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- icons (inline, minimal) ---------- */
const Icon = {
  search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m20 20-3.2-3.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  play: (p) => (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  ),
  yt: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M10 9.2v5.6l5-2.8z" fill="currentColor" />
    </svg>
  ),
  heart: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.6 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  doc: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14 3v4h4M9 13h6M9 16h6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  menu: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  ext: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  map: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 8v4l3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  download: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  filter: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const NAV_ITEMS = [
  ["home", "Home"],
  ["timeline", "Timeline"],
  ["videos", "Videos"],
  ["bodycam", "Bodycam"],
  ["documents", "Documents"],
  ["social", "Social"],
  ["people", "People"],
];

function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const mon = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][m - 1];
  return `${mon} ${d}, ${y}`;
}
function fmtDateLong(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const mon = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][m - 1];
  return `${mon} ${d}, ${y}`;
}

/* ---------- Nav ---------- */
function Nav({ route, go, onSearch }) {
  const [mobile, setMobile] = useState(false);
  return (
    <header className="nav">
      <div className="wrap-wide nav-inner">
        <a
          className="brand"
          onClick={() => go("home")}
          style={{ cursor: "pointer" }}
        >
          <span className="mark">
            Through<b>line</b>
          </span>
          <span className="demo">Fictional demo</span>
        </a>
        <nav className="nav-links">
          {NAV_ITEMS.map(([id, label]) => (
            <a
              key={id}
              className={route === id ? "active" : ""}
              onClick={() => go(id)}
              style={{ cursor: "pointer" }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="grow"></div>
        <div className="nav-search" onClick={onSearch}>
          <Icon.search />
          <span className="ph-txt">Search the archive…</span>
          <span className="kbd">/</span>
        </div>
        <div className="cta-group">
          <a
            className="cta-yt"
            href={DB.links.youtube}
            target="_blank"
            rel="noopener"
          >
            <Icon.yt /> Curb Authority
          </a>
          <a
            className="cta-gfm"
            href={DB.links.gofundme}
            target="_blank"
            rel="noopener"
          >
            <Icon.heart /> Legal Fund
          </a>
        </div>
        <button
          className="btn btn-icon btn-ghost hamburger"
          onClick={() => setMobile((m) => !m)}
        >
          {mobile ? <Icon.close /> : <Icon.menu />}
        </button>
      </div>
      {mobile && (
        <div
          className="wrap-wide"
          style={{
            paddingBottom: 18,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {NAV_ITEMS.map(([id, label]) => (
            <a
              key={id}
              onClick={() => {
                go(id);
                setMobile(false);
              }}
              style={{
                cursor: "pointer",
                padding: "10px 6px",
                color: route === id ? "var(--tx-0)" : "var(--tx-2)",
                borderBottom: "1px solid var(--line)",
              }}
            >
              {label}
            </a>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <a className="cta-yt" href={DB.links.youtube}>
              <Icon.yt /> Curb Authority
            </a>
            <a className="cta-gfm" href={DB.links.gofundme}>
              <Icon.heart /> Legal Fund
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------- Footer ---------- */
function Footer({ go }) {
  return (
    <footer className="footer">
      <div className="wrap-wide">
        <div className="footer-top">
          <div>
            <span
              className="mark"
              style={{
                fontFamily: "var(--serif)",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              Through<b style={{ color: "var(--blue)" }}>line</b>
            </span>
            <p className="disclaim" style={{ marginTop: 16 }}>
              An independent archive of the Cedar Hollow / Cogwheel Collectibles
              incident. This is a{" "}
              <b style={{ color: "var(--tx-1)" }}>fictional demonstration</b> —
              every person, organization, document, and event shown is invented.
              The archive presents publicly available material for reference and
              does not endorse any party.
            </p>
          </div>
          <div>
            <h4>Archive</h4>
            <ul>
              <li>
                <a onClick={() => go("timeline")} style={{ cursor: "pointer" }}>
                  Timeline
                </a>
              </li>
              <li>
                <a onClick={() => go("videos")} style={{ cursor: "pointer" }}>
                  Videos
                </a>
              </li>
              <li>
                <a onClick={() => go("bodycam")} style={{ cursor: "pointer" }}>
                  Bodycam footage
                </a>
              </li>
              <li>
                <a
                  onClick={() => go("documents")}
                  style={{ cursor: "pointer" }}
                >
                  Documents
                </a>
              </li>
              <li>
                <a onClick={() => go("social")} style={{ cursor: "pointer" }}>
                  Social media
                </a>
              </li>
              <li>
                <a onClick={() => go("people")} style={{ cursor: "pointer" }}>
                  People involved
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4>About</h4>
            <ul>
              <li>
                <a style={{ cursor: "pointer" }}>Disclaimer</a>
              </li>
              <li>
                <a style={{ cursor: "pointer" }}>Sources &amp; methodology</a>
              </li>
              <li>
                <a style={{ cursor: "pointer" }}>Corrections policy</a>
              </li>
              <li>
                <a style={{ cursor: "pointer" }}>Privacy policy</a>
              </li>
              <li>
                <a style={{ cursor: "pointer" }}>Contact</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Follow the case</h4>
            <ul>
              <li>
                <a href={DB.links.youtube}>Curb Authority channel ↗</a>
              </li>
              <li>
                <a href={DB.links.gofundme}>Legal fund (GoFundMe) ↗</a>
              </li>
              <li>
                <a style={{ cursor: "pointer" }}>Email updates</a>
              </li>
              <li>
                <a style={{ cursor: "pointer" }}>RSS feed</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="copy">
            © 2025 Throughline Archive · Sample data · Not a real publication
          </span>
          <span className="mono-sm">Built as a design demonstration</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Category tag ---------- */
function CatTag({ cat, small }) {
  const c = DB.CATS[cat];
  if (!c) return null;
  return (
    <span className={`tag ${c.cls}`}>
      <span className="dot"></span>
      {c.label}
    </span>
  );
}

/* ---------- Page header ---------- */
function PageHead({ crumb, title, sub, children }) {
  return (
    <div className="page-head">
      <div className="wrap-wide">
        <div className="crumb">{crumb}</div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

/* ---------- Avatar placeholder (striped, initials) ---------- */
function Avatar({ name, size = 44, side }) {
  const initials = name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  const tone =
    {
      creator: "var(--blue)",
      business: "var(--amber)",
      official: "var(--red)",
      press: "var(--tx-1)",
    }[side] || "var(--tx-2)";
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

/* ---------- Search overlay ---------- */
function SearchOverlay({ open, onClose, go }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setQ("");
    }
  }, [open]);
  useEffect(() => {
    const k = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", k);
    }
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const t = q.toLowerCase();
    const out = [];
    DB.events.forEach((e) => {
      if ((e.title + e.desc).toLowerCase().includes(t))
        out.push({
          kind: "Timeline",
          label: e.title,
          sub: fmtDate(e.date),
          go: () => go("timeline"),
        });
    });
    DB.videos.forEach((v) => {
      if ((v.title + v.source).toLowerCase().includes(t))
        out.push({
          kind: "Video",
          label: v.title,
          sub: v.source,
          go: () => go("videos"),
        });
    });
    DB.documents.forEach((d) => {
      if ((d.title + d.summary).toLowerCase().includes(t))
        out.push({
          kind: "Document",
          label: d.title,
          sub: d.type,
          go: () => go("documents"),
        });
    });
    DB.people.forEach((p) => {
      if ((p.name + p.role + p.org).toLowerCase().includes(t))
        out.push({
          kind: "Person",
          label: p.name,
          sub: p.role,
          go: () => go("person:" + p.id),
        });
    });
    DB.social.forEach((s) => {
      if (s.text.toLowerCase().includes(t))
        out.push({
          kind: "Social",
          label: s.text.slice(0, 60) + "…",
          sub: s.platform + " · " + s.author,
          go: () => go("social"),
        });
    });
    return out.slice(0, 12);
  }, [q, go]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(5,8,11,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "center",
        paddingTop: "12vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(680px,92vw)",
          height: "fit-content",
          maxHeight: "72vh",
          background: "var(--ink-1)",
          border: "1px solid var(--line-2)",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "18px 20px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <Icon.search
            style={{ width: 20, height: 20, color: "var(--tx-2)" }}
          />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search videos, documents, events, people, posts…"
            style={{
              flex: 1,
              background: "transparent",
              border: 0,
              outline: "none",
              color: "var(--tx-0)",
              fontSize: 17,
              fontFamily: "var(--sans)",
            }}
          />
          <span
            className="mono-label"
            style={{ cursor: "pointer" }}
            onClick={onClose}
          >
            ESC
          </span>
        </div>
        <div style={{ maxHeight: "56vh", overflowY: "auto" }}>
          {!q.trim() && (
            <div style={{ padding: "28px 22px" }}>
              <div className="mono-label" style={{ marginBottom: 14 }}>
                Jump to
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {NAV_ITEMS.slice(1).map(([id, label]) => (
                  <button
                    key={id}
                    className="chip"
                    onClick={() => {
                      go(id);
                      onClose();
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {q.trim() && results.length === 0 && (
            <div
              style={{
                padding: "34px 22px",
                color: "var(--tx-3)",
                fontSize: 14,
              }}
            >
              No matches for “{q}”.
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => {
                r.go();
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "13px 22px",
                borderBottom: "1px solid var(--line)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span className="mono-label" style={{ width: 74, flexShrink: 0 }}>
                {r.kind}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14.5,
                    color: "var(--tx-0)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {r.label}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--tx-3)" }}>
                  {r.sub}
                </div>
              </div>
              <Icon.arrow
                style={{ width: 15, height: 15, color: "var(--tx-3)" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon,
  NAV_ITEMS,
  fmtDate,
  fmtDateLong,
  Nav,
  Footer,
  CatTag,
  PageHead,
  Avatar,
  SearchOverlay,
});
