import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { CatTag } from "@/components/cat-tag";
import { Footer } from "@/components/footer";
import { Icons } from "@/components/icons";
import { Nav } from "@/components/nav";
import type {
  Document,
  Event,
  EventPerson,
  Person,
  Video,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { fmtDate, SIDE_META, type Side } from "@/lib/types";
import { ConnectionsGraph } from "./connections-graph";

type PersonWithEvents = Person & {
  events: (EventPerson & { event: Event | null })[];
};

type PersonWithEventIds = Person & { events: EventPerson[] };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonProfilePage({ params }: Props) {
  const { id } = await params;

  const [rawPerson, allPeople] = await Promise.all([
    prisma.person.findUnique({
      where: { id },
      include: { events: { include: { event: true } } },
    }),
    prisma.person.findMany({ include: { events: true } }),
  ]);

  if (!rawPerson) notFound();

  const person = rawPerson as PersonWithEvents;
  const people = allPeople as PersonWithEventIds[];

  const sm = SIDE_META[person.side as Side];
  const eventIds = person.events.map((ep: EventPerson) => ep.eventId);

  const events = person.events
    .map((ep: EventPerson & { event: Event | null }) => ep.event)
    .filter((e): e is Event => e !== null)
    .sort((a: Event, b: Event) => a.date.localeCompare(b.date));

  const [relVideos, relDocs] = await Promise.all([
    prisma.video.findMany({ where: { eventId: { in: eventIds } }, take: 3 }),
    prisma.document.findMany({ where: { eventId: { in: eventIds } }, take: 3 }),
  ]);

  const videos = relVideos as Video[];
  const docs = relDocs as Document[];

  const connected = people.filter(
    (o: PersonWithEventIds) =>
      o.id !== person.id &&
      o.events.some((ep: EventPerson) => eventIds.includes(ep.eventId)),
  );

  return (
    <div>
      <Nav />
      <main>
        <div className="page-head" style={{ paddingBottom: 36 }}>
          <div className="wrap-wide">
            <div className="crumb">
              <Link href="/people">People</Link> / {person.name}
            </div>
            <div
              style={{
                display: "flex",
                gap: 24,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <Avatar name={person.name} size={84} side={person.side as Side} />
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
                    {person.name}
                  </h1>
                  {person.verified && (
                    <Icons.check
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
                    <span className="dot" style={{ background: sm.tone }} />
                    {sm.label}
                  </span>
                  <span className="tag solid">{person.role}</span>
                  <span className="tag solid">{person.org}</span>
                </div>
                <p className="lede" style={{ maxWidth: 680, fontSize: 16 }}>
                  {person.bio}
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
                {events.map((e: Event) => (
                  <Link
                    key={e.id}
                    href="/timeline"
                    style={{
                      position: "relative",
                      padding: "4px 0 22px 26px",
                      display: "block",
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
                    />
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
                      {(e.cats as string[]).map((c: string) => (
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
                  </Link>
                ))}
              </div>

              <div className="eyebrow line" style={{ marginBottom: 20 }}>
                Related media
              </div>
              <div className="grid-3">
                {videos.map((v: Video) => (
                  <Link
                    key={v.id}
                    href="/videos"
                    className="card hover"
                    style={{
                      cursor: "pointer",
                      overflow: "hidden",
                      display: "block",
                    }}
                  >
                    <div className="ph thumb" style={{ aspectRatio: "16/9" }}>
                      <div className="play-badge">
                        <Icons.play />
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
                  </Link>
                ))}
                {docs.map((d: Document) => (
                  <Link
                    key={d.id}
                    href="/documents"
                    className="card hover"
                    style={{ cursor: "pointer", padding: 16, display: "block" }}
                  >
                    <span className="tag document" style={{ marginBottom: 10 }}>
                      <span className="dot" />
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
                  </Link>
                ))}
              </div>
            </div>

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
                  <ConnectionsGraph person={person} connected={connected} />
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
          <div style={{ height: 30 }} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
