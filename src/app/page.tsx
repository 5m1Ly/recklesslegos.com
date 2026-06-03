import Link from "next/link";
import { CatTag } from "@/components/cat-tag";
import { Footer } from "@/components/footer";
import { Icons } from "@/components/icons";
import { Nav } from "@/components/nav";
import { TimelineView } from "@/components/timeline-view";
import { getTimelineEntries } from "@/lib/timeline";

export default async function HomePage() {
  const entries = await getTimelineEntries();

  const stats = [
    { n: "9", label: "Videos archived", x: "2 channels + AFPD" },
    { n: "5", label: "Documents", x: "linked sources" },
    { n: "14", label: "Timeline events", x: "2024–present" },
    { n: "8", label: "Social accounts", x: "5 platforms" },
    { n: "1", label: "Bodycam release", x: "Dropbox (AFPD)" },
    { n: "5", label: "People involved", x: "public roles" },
  ];

  const quickNav: [string, string, string, string][] = [
    [
      "videos",
      "Videos",
      "9 items",
      "Reckless Ben's videos, AFPD footage, and more.",
    ],
    ["bodycam", "Bodycam", "1 release", "AFPD footage released via Dropbox."],
    [
      "documents",
      "Documents",
      "5 records",
      "GoFundMe, advocacy site, Wikipedia, and more.",
    ],
    [
      "social",
      "Social",
      "8 accounts",
      "Real social accounts across five platforms.",
    ],
    ["people", "People", "5 profiles", "Public roles of everyone involved."],
  ];

  const latestAdditions = [
    {
      tag: "video",
      t: "American Fork PD — official incident video",
      s: "American Fork Police · YouTube",
      href: "/videos",
    },
    {
      tag: "document",
      t: "Wikipedia — Bricks & Minifigs–Reckless Ben controversy",
      s: "Wikipedia · reference",
      href: "/documents",
    },
    {
      tag: "document",
      t: "GoFundMe — Help Bryan Recover His LEGO Collection",
      s: "GoFundMe · fundraiser",
      href: "/documents",
    },
  ];

  return (
    <div>
      <Nav />
      <main>
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
                Independent case archive · est. 2024
              </div>
              <h1
                className="h-display"
                style={{ fontSize: 56, marginBottom: 22 }}
              >
                Tracking the{" "}
                <em style={{ fontStyle: "italic", color: "var(--blue)" }}>
                  Reckless&nbsp;Ben
                </em>{" "}
                &amp; Bricks and Minifigs story.
              </h1>
              <p className="lede" style={{ maxWidth: 540, marginBottom: 30 }}>
                A centralized archive of the publicly available videos,
                documents, social-media posts, police footage, and developments
                surrounding the Bricks and Minifigs American Fork incident —
                organized into a single, searchable record.
              </p>
              <div style={{ display: "flex", gap: 13 }}>
                <Link href="/timeline" className="btn btn-blue">
                  <Icons.clock style={{ width: 16, height: 16 }} /> View
                  timeline
                </Link>
                <Link href="/documents" className="btn btn-ghost">
                  Browse evidence
                </Link>
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
                  inset: 28,
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
                  <Icons.play />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="wrap-wide" style={{ padding: "40px 0" }}>
          <div className="stat-grid">
            {stats.map((s) => (
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
                <b style={{ color: "var(--tx-0)" }}>Ben Schneider</b>, known
                online as <b style={{ color: "var(--tx-0)" }}>Reckless Ben</b>,
                is a LEGO content creator who documented an incident involving{" "}
                <b style={{ color: "var(--tx-0)" }}>
                  Bricks and Minifigs American Fork
                </b>
                , a used-LEGO franchise in American Fork, Utah.
              </p>
              <p className="body-txt" style={{ marginBottom: 14 }}>
                The controversy centers on the store&apos;s acquisition of{" "}
                <b style={{ color: "var(--tx-0)" }}>Bryan&apos;s</b> LEGO
                collection. Ben alleged the purchase was exploitative, launched
                the{" "}
                <b style={{ color: "var(--tx-0)" }}>
                  &ldquo;We Steal From Old People&rdquo;
                </b>{" "}
                campaign, and published a series of videos that spread widely. A
                GoFundMe was created to help Bryan recover his collection. The
                American Fork Police Department also became involved and
                published their own video.
              </p>
              <p className="body-txt" style={{ marginBottom: 22 }}>
                Throughline collects what each party has made public — videos,
                documents, social accounts, and police footage — and keeps it
                organized, sourced, and cross-linked.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="tag solid">
                  <span className="dot" style={{ background: "var(--blue)" }} />
                  GoFundMe active
                </span>
                <span className="tag solid">
                  <span
                    className="dot"
                    style={{ background: "var(--amber)" }}
                  />
                  American Fork, Utah
                </span>
              </div>
            </div>
            <div
              className="ph thumb card"
              style={{ aspectRatio: "16/10", borderRadius: "var(--radius)" }}
            >
              <span className="ph-lbl">
                Bricks and Minifigs · American Fork, Utah
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
            <Link href="/timeline" className="btn btn-ghost">
              Open full timeline <Icons.arrow />
            </Link>
          </div>
          <TimelineView entries={entries} compact />
        </section>

        <div className="wrap-wide">
          <hr className="divider" />
        </div>

        {/* LATEST ADDITIONS */}
        <section className="wrap-wide section-sm">
          <div className="eyebrow line" style={{ marginBottom: 20 }}>
            Latest additions
          </div>
          <div className="grid-3">
            {latestAdditions.map((c) => (
              <Link
                key={c.t}
                href={c.href}
                className="card hover"
                style={{
                  cursor: "pointer",
                  overflow: "hidden",
                  display: "block",
                }}
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
                      <Icons.play />
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
              </Link>
            ))}
          </div>
        </section>

        {/* QUICK NAV */}
        <section className="wrap-wide section-sm">
          <div className="eyebrow line" style={{ marginBottom: 20 }}>
            Browse the archive
          </div>
          <div
            className="quicknav-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5,1fr)",
              gap: 16,
            }}
          >
            {quickNav.map(([id, title, count, desc]) => (
              <Link
                key={id}
                href={`/${id}`}
                className="card hover"
                style={{
                  cursor: "pointer",
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  minHeight: 172,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    className="mono-sm tnum"
                    style={{ color: "var(--blue)" }}
                  >
                    {count}
                  </span>
                  <Icons.arrow
                    style={{ width: 16, height: 16, color: "var(--tx-3)" }}
                  />
                </div>
                <div className="grow" />
                <h3 className="h-card">{title}</h3>
                <p className="mono-sm" style={{ lineHeight: 1.5 }}>
                  {desc}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <div style={{ height: 40 }} />
      </main>
      <Footer />
    </div>
  );
}
