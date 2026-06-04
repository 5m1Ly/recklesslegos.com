import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { getAdminFromCookie } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  isProposalType,
  PROPOSAL_TYPES,
  rowToValues,
} from "@/lib/proposal-types";
import { loadContentRow } from "@/lib/proposals";
import { getRefOptions } from "@/lib/timeline";
import type { RefType } from "@/lib/types";
import { DashboardClient, type PendingSubmission } from "./dashboard-client";

function refsFromJson(value: unknown): { refType: RefType; refId: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (r): r is { refType: RefType; refId: string } =>
        !!r && typeof r === "object" && "refType" in r && "refId" in r,
    )
    .map((r) => ({ refType: r.refType, refId: r.refId }));
}

/** Read a Submission.payload Json value as a plain object. */
function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

export default async function AdminDashboardPage() {
  const admin = await getAdminFromCookie();
  if (!admin) redirect("/admin/login");

  const [subs, admins, refOptions] = await Promise.all([
    prisma.submission.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
    getRefOptions(),
  ]);

  // Load the current state of any TIMELINE entries targeted by edit/remove.
  const timelineTargetIds = subs
    .filter((s) => s.contentType === "timeline" && s.targetId)
    .map((s) => s.targetId as string);
  const targets = timelineTargetIds.length
    ? await prisma.timelineEntry.findMany({
        where: { id: { in: timelineTargetIds } },
        include: { refs: true },
      })
    : [];
  const targetById = new Map(targets.map((t) => [t.id, t]));

  // Load the current state of any CONTENT rows targeted by edit/remove.
  const contentTargets = new Map<string, Record<string, unknown>>();
  await Promise.all(
    subs
      .filter(
        (s) =>
          s.contentType !== "timeline" &&
          isProposalType(s.contentType) &&
          s.targetId,
      )
      .map(async (s) => {
        if (!isProposalType(s.contentType) || !s.targetId) return;
        const row = await loadContentRow(prisma, s.contentType, s.targetId);
        if (row) contentTargets.set(s.id, row);
      }),
  );

  const pending: PendingSubmission[] = subs.map((s) => {
    const base = {
      id: s.id,
      contentType: s.contentType,
      op: s.op as PendingSubmission["op"],
      targetId: s.targetId,
      email: s.email,
      wantsUpdates: s.wantsUpdates,
      createdAt: s.createdAt.toISOString(),
    };

    // Content-type submission: render from the field registry + payload.
    if (s.contentType !== "timeline" && isProposalType(s.contentType)) {
      const def = PROPOSAL_TYPES[s.contentType];
      const targetRow = contentTargets.get(s.id) ?? null;
      return {
        ...base,
        date: "",
        title: "",
        description: "",
        ongoing: false,
        refs: [],
        target: null,
        contentLabel: def.labelOf(asObject(s.payload)),
        payloadValues: rowToValues(def, asObject(s.payload)),
        targetValues: targetRow ? rowToValues(def, targetRow) : null,
      };
    }

    // Timeline submission (original shape).
    const target = s.targetId ? targetById.get(s.targetId) : null;
    return {
      ...base,
      date: s.date ?? "",
      title: s.title ?? "",
      description: s.description ?? "",
      ongoing: s.ongoing,
      refs: refsFromJson(s.refs),
      target: target
        ? {
            date: target.date,
            title: target.title,
            description: target.description,
            ongoing: target.ongoing,
            refs: target.refs.map((r) => ({
              refType: r.refType as RefType,
              refId: r.refId,
            })),
          }
        : null,
      contentLabel: null,
      payloadValues: null,
      targetValues: null,
    };
  });

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={<span>Admin · {admin.email}</span>}
          title="Moderation dashboard"
          sub="Review proposed changes across the timeline, videos, bodycam, documents, social, and people. Accept as-is, edit before publishing, or reject. Contributors who opted in are notified of the outcome."
        />
        <div
          className="wrap section-sm"
          style={{ paddingTop: 8, maxWidth: 900 }}
        >
          <DashboardClient
            pending={pending}
            admins={admins.map((a) => a.email)}
            currentAdmin={admin.email}
            refOptions={refOptions}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
