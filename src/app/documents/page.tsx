import Link from "next/link";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/site";
import { DocumentsClient } from "./documents-client";

export const metadata = pageMetadata({
  title: "Documents",
  description:
    "Court filings, police reports, statements, and records documenting the Bricks & Minifigs takeover and the missing Mansell LEGO Star Wars collection.",
  path: "/documents",
});

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { date: "asc" },
    include: { event: true },
  });

  const docTypes = [
    "Online Fundraiser",
    "Advocacy Website",
    "Wikipedia Article",
    "Website",
    "Court Filing",
    "Police Report",
    "FOIA Request",
    "Correspondence",
    "Legal Notice",
    "Statement",
    "Public Record",
  ];

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={
            <span>
              <Link href="/">Home</Link> / Documents
            </span>
          }
          title="Document archive"
          sub="Court filings, police reports, FOIA releases, correspondence, and public records — each OCR-indexed, tagged, and linked to the events it documents."
        >
          <div style={{ marginTop: 18 }}>
            <Link href="/propose/document?op=add" className="btn btn-ghost">
              + Propose an addition
            </Link>
          </div>
        </PageHead>
        <DocumentsClient documents={documents} docTypes={docTypes} />
      </main>
      <Footer />
    </div>
  );
}
