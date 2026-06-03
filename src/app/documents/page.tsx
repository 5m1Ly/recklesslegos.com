import Link from "next/link";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";
import { DocumentsClient } from "./documents-client";

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
        />
        <DocumentsClient documents={documents} docTypes={docTypes} />
      </main>
      <Footer />
    </div>
  );
}
