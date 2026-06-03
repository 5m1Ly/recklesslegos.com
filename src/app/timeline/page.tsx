import Link from "next/link";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { TimelineView } from "@/components/timeline-view";
import { prisma } from "@/lib/db";

export default async function TimelinePage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: {
      people: {
        include: { person: true },
      },
    },
  });

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={
            <span>
              <Link href="/">Home</Link> / Timeline
            </span>
          }
          title="Case timeline"
          sub="Every event in the record, in chronological order. Filter by category, search, and expand any event to see its linked videos, documents, bodycam files, social posts, and the people involved."
        />
        <div className="wrap-wide section-sm" style={{ paddingTop: 8 }}>
          <TimelineView events={events} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
