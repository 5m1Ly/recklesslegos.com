import Link from "next/link";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";
import { getRefOptions } from "@/lib/timeline";
import type { RefType, SubmissionOp } from "@/lib/types";
import { ContributeClient, type InitialEntry } from "./contribute-client";

export default async function ContributePage({
  searchParams,
}: {
  searchParams: Promise<{ op?: string; id?: string }>;
}) {
  const { op: opParam, id } = await searchParams;
  const op: SubmissionOp =
    opParam === "edit" || opParam === "remove" ? opParam : "add";

  const refOptions = await getRefOptions();

  let initial: InitialEntry | null = null;
  if ((op === "edit" || op === "remove") && id) {
    const entry = await prisma.timelineEntry.findUnique({
      where: { id },
      include: { refs: true },
    });
    if (entry) {
      initial = {
        id: entry.id,
        date: entry.date,
        title: entry.title,
        description: entry.description,
        ongoing: entry.ongoing,
        refs: entry.refs.map((r) => ({
          refType: r.refType as RefType,
          refId: r.refId,
        })),
      };
    }
  }

  // If an edit/remove was requested for a missing entry, fall back to "add".
  const effectiveOp: SubmissionOp =
    (op === "edit" || op === "remove") && !initial ? "add" : op;

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={
            <span>
              <Link href="/">Home</Link> /{" "}
              <Link href="/timeline">Timeline</Link> / Propose a change
            </span>
          }
          title="Propose a timeline change"
          sub="Add a new event, edit an existing one, or propose a removal — one change at a time. You'll verify your email, then a moderator reviews it before it goes live."
        />
        <div
          className="wrap section-sm"
          style={{ paddingTop: 8, maxWidth: 760 }}
        >
          <ContributeClient
            op={effectiveOp}
            initial={initial}
            refOptions={refOptions}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
