import Link from "next/link";
import { AdminAddButton } from "@/components/admin-content";
import { Footer } from "@/components/footer";
import { Icons } from "@/components/icons";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/site";
import { BodycamClient } from "./bodycam-client";

export const metadata = pageMetadata({
  title: "Bodycam Footage",
  description:
    "Released police body-camera and dashcam footage related to the Bricks & Minifigs takeover and the disappearance of Bryan Mansell's LEGO Star Wars collection, with locations and timestamps.",
  path: "/bodycam",
});

export default async function BodycamPage() {
  const bodycam = await prisma.bodycam.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }],
    include: { event: true },
  });

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={
            <span>
              <Link href="/">Home</Link> / Bodycam footage
            </span>
          }
          title="Police bodycam evidence"
          sub="Body-worn camera footage and reports from the American Fork Police Department, released via Dropbox. Each file is logged with its unit, officer, and the timeline event it belongs to."
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 20,
              flexWrap: "wrap",
            }}
          >
            <span className="tag police">
              <Icons.shield style={{ width: 13, height: 13, marginRight: 4 }} />
              American Fork PD · Dropbox release
            </span>
            <span className="tag">
              <Icons.map style={{ width: 13, height: 13, marginRight: 4 }} />
              American Fork, Utah
            </span>
          </div>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link href="/propose/bodycam?op=add" className="btn btn-ghost">
              + Propose an addition
            </Link>
            <AdminAddButton type="bodycam" />
          </div>
        </PageHead>
        <BodycamClient bodycam={bodycam} />
      </main>
      <Footer />
    </div>
  );
}
