import Link from "next/link";
import { CatTag } from "@/components/cat-tag";
import { Footer } from "@/components/footer";
import { Icons } from "@/components/icons";
import { Nav } from "@/components/nav";
import { TimelineView } from "@/components/timeline-view";
import { prisma } from "@/lib/db";
import { getTimelineEntries } from "@/lib/timeline";

export default async function HomePage() {
  // Derive every count from real data so the homepage stays in sync with the
  // archive (and with newly-accepted proposals) instead of hardcoded numbers.
  const [
    entries,
    videoCount,
    documentCount,
    socialCount,
    bodycamCount,
    personCount,
    platformGroups,
    recentVideos,
    recentDocs,
    recentSocial,
  ] = await Promise.all([
    getTimelineEntries(),
    prisma.video.count(),
    prisma.document.count(),
    prisma.socialPost.count(),
    prisma.bodycam.count(),
    prisma.person.count(),
    prisma.socialPost.groupBy({ by: ["platform"] }),
    prisma.video.findMany({
      orderBy: { date: "desc" },
      take: 3,
      select: { title: true, source: true, date: true },
    }),
    prisma.document.findMany({
      orderBy: { date: "desc" },
      take: 3,
      select: { title: true, source: true, date: true },
    }),
    prisma.socialPost.findMany({
      orderBy: { date: "desc" },
      take: 3,
      select: { author: true, platform: true, date: true },
    }),
  ]);

  const timelineCount = entries.length;
  const platformCount = platformGroups.length;
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;

  const stats = [
    {
      n: String(videoCount),
      label: "Videos archived",
      x: "creator, official & coverage",
    },
    { n: String(documentCount), label: "Documents", x: "linked sources" },
    {
      n: String(timelineCount),
      label: "Timeline events",
      x: "community-sourced",
    },
    {
      n: String(socialCount),
      label: "Social posts",
      x: plural(platformCount, "platform"),
    },
    {
      n: String(bodycamCount),
      label: bodycamCount === 1 ? "Bodycam release" : "Bodycam releases",
      x: "AFPD footage",
    },
    { n: String(personCount), label: "People involved", x: "public roles" },
  ];

  const quickNav: [string, string, string, string][] = [
    [
      "videos",
      "Videos",
      plural(videoCount, "item"),
      "Reckless Ben's videos, AFPD footage, and more.",
    ],
    [
      "bodycam",
      "Bodycam",
      plural(bodycamCount, "release"),
      "AFPD footage released via Dropbox.",
    ],
    [
      "documents",
      "Documents",
      plural(documentCount, "record"),
      "GoFundMe, advocacy site, Wikipedia, and more.",
    ],
    [
      "social",
      "Social",
      plural(socialCount, "post"),
      "Real social posts across the platforms.",
    ],
    [
      "people",
      "People",
      plural(personCount, "profile"),
      "Public roles of everyone involved.",
    ],
  ];

  // Most recently dated items across types — reflects real, current content.
  const latestAdditions = [
    ...recentVideos.map((v) => ({
      tag: "video" as const,
      t: v.title,
      s: v.source,
      date: v.date,
      href: "/videos",
    })),
    ...recentDocs.map((d) => ({
      tag: "document" as const,
      t: d.title,
      s: d.source,
      date: d.date,
      href: "/documents",
    })),
    ...recentSocial.map((sp) => ({
      tag: "social" as const,
      t: `${sp.author} on ${sp.platform}`,
      s: sp.platform,
      date: sp.date,
      href: "/social",
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

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
          <div className="wrap-wide hero-grid">
            <div className="hero-content">
              <h1 className="h-display hero-title" style={{ marginBottom: 22 }}>
                The{" "}
                <em style={{ fontStyle: "italic", color: "var(--blue)" }}>
                  Reckless&nbsp;Ben
                </em>{" "}
                &amp;
                <br />
                Bricks and Minifigs
                <br />
                Community Archive.
              </h1>
              <div className="eyebrow line" style={{ marginBottom: 24 }}>
                community case archive · est. 2026
              </div>
              <p className="lede" style={{ maxWidth: 540, marginBottom: 30 }}>
                A centralized archive of the publicly available videos,
                documents, social-media posts, police footage, and developments
                surrounding the Bricks and Minifigs incident — organized into a
                single, searchable record.
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
            <div className="hero-aside">
              <h2
                className="h-section"
                style={{ marginBottom: 18, fontSize: 28 }}
              >
                An unbiased explanatory video from a lawyer.
              </h2>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16/9",
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                }}
              >
                <iframe
                  src="https://www.youtube.com/embed/HH09tltEw1U?si=JYoH9fd_6MAEaUJT"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    border: 0,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="wrap-wide" style={{ paddingBlock: "40px" }}>
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
          <div className="overview-grid">
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
                is a content creator who documented an incident involving a{" "}
                <b style={{ color: "var(--tx-0)" }}>Bricks and Minifigs</b>{" "}
                franchise, located in Salem, Oregon.
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
                RecklessBricks collects what each party has made public —
                videos, documents, social accounts, and police footage — and
                keeps it organized, sourced, and cross-linked.
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
                  Salem, Oregon
                </span>
              </div>
            </div>
            <div
              className="ph thumb card"
              style={{ aspectRatio: "16/10", borderRadius: "var(--radius)" }}
            >
              <span className="ph-lbl">
                Bricks and Minifigs · Salem, Oregon
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
          <div className="quicknav-grid">
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
