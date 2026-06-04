import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";
import {
  isProposalType,
  PROPOSAL_TYPES,
  type ProposalTypeDef,
} from "@/lib/proposal-types";
import { loadContentRow } from "@/lib/proposals";
import type { SubmissionOp } from "@/lib/types";
import { ProposeClient } from "./propose-client";

const OP_TITLES: Record<SubmissionOp, string> = {
  add: "Propose an addition",
  edit: "Propose an edit",
  remove: "Propose a removal",
};

/** Map a content row to a string-keyed record for the form. */
function toStringValues(
  def: ProposalTypeDef,
  row: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of def.fields) {
    const v = row[f.key];
    if (v == null) out[f.key] = "";
    else if (typeof v === "boolean") out[f.key] = v ? "true" : "false";
    else if (Array.isArray(v)) out[f.key] = v.join(", ");
    else out[f.key] = String(v);
  }
  return out;
}

export default async function ProposePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ op?: string; id?: string }>;
}) {
  const { type } = await params;
  if (!isProposalType(type)) notFound();
  const def = PROPOSAL_TYPES[type];

  const { op: opParam, id } = await searchParams;
  let op: SubmissionOp =
    opParam === "edit" || opParam === "remove" ? opParam : "add";

  let initial: Record<string, string> | null = null;
  let targetLabel: string | null = null;
  let targetId: string | null = null;

  if ((op === "edit" || op === "remove") && id) {
    const row = await loadContentRow(prisma, type, id);
    if (row) {
      targetId = id;
      targetLabel = def.labelOf(row);
      initial = toStringValues(def, row);
    } else {
      // Requested item is gone — fall back to a fresh addition.
      op = "add";
    }
  }

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={
            <span>
              <Link href="/">Home</Link> /{" "}
              <Link href={def.basePath}>{def.plural}</Link> / Propose a change
            </span>
          }
          title={`${OP_TITLES[op]}: ${def.label.toLowerCase()}`}
          sub="You'll verify your email, then a moderator reviews this before it goes live."
        />
        <div className="wrap section-sm" style={{ paddingTop: 8, maxWidth: 760 }}>
          <ProposeClient
            type={type}
            op={op}
            targetId={targetId}
            initial={initial}
            targetLabel={targetLabel}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
