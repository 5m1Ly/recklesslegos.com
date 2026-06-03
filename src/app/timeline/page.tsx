import Link from "next/link";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { TimelineView } from "@/components/timeline-view";
import { getTimelineEntries } from "@/lib/timeline";

export default async function TimelinePage() {
  const entries = await getTimelineEntries();

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
          sub="A community-maintained record of the case, in chronological order. Search, filter by reference type, and expand any event to see its linked videos, documents, bodycam files, social posts, and people. Anyone can propose a change — it goes live once a moderator approves it."
        />
        <div className="wrap-wide section-sm" style={{ paddingTop: 8 }}>
          <TimelineView entries={entries} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
