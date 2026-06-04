import Link from "next/link";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";
import { VideosClient } from "./videos-client";

export default async function VideosPage() {
  const videos = await prisma.video.findMany({
    orderBy: { date: "asc" },
    include: { event: true },
  });

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={
            <span>
              <Link href="/">Home</Link> / Videos
            </span>
          }
          title="Video archive"
          sub="Every video in the record, grouped by source — from the creator's own uploads to official footage, corporate statements, and outside coverage. Demo embeds are placeholders."
        >
          <div style={{ marginTop: 18 }}>
            <Link href="/propose/video?op=add" className="btn btn-ghost">
              + Propose an addition
            </Link>
          </div>
        </PageHead>
        <VideosClient videos={videos} />
      </main>
      <Footer />
    </div>
  );
}
