import Link from "next/link";
import { Footer } from "@/components/footer";
import { Icons } from "@/components/icons";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";
import { BodycamClient } from "./bodycam-client";

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
        </PageHead>
        <BodycamClient bodycam={bodycam} />
      </main>
      <Footer />
    </div>
  );
}
