import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { getAdminFromCookie } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
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

  // Load the current state of any entries targeted by edit/remove submissions.
  const targetIds = subs
    .map((s) => s.targetId)
    .filter((id): id is string => !!id);
  const targets = targetIds.length
    ? await prisma.timelineEntry.findMany({
        where: { id: { in: targetIds } },
        include: { refs: true },
      })
    : [];
  const targetById = new Map(targets.map((t) => [t.id, t]));

  const pending: PendingSubmission[] = subs.map((s) => {
    const target = s.targetId ? targetById.get(s.targetId) : null;
    return {
      id: s.id,
      op: s.op as PendingSubmission["op"],
      targetId: s.targetId,
      date: s.date ?? "",
      title: s.title ?? "",
      description: s.description ?? "",
      ongoing: s.ongoing,
      refs: refsFromJson(s.refs),
      email: s.email,
      wantsUpdates: s.wantsUpdates,
      createdAt: s.createdAt.toISOString(),
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
    };
  });

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={<span>Admin · {admin.email}</span>}
          title="Moderation dashboard"
          sub="Review proposed timeline changes. Accept as-is, edit before publishing, or reject. Contributors who opted in are notified of the outcome."
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
