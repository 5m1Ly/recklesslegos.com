import Link from "next/link";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";

export default async function ContributorsPage() {
  const [contributors, counts] = await Promise.all([
    prisma.contributor.findMany({
      where: { consentListPublicly: true },
      orderBy: { askedAt: "asc" },
    }),
    // Accepted contributions per contributor, keyed by email hash (which
    // survives email purge, so counts work even for storage-decliners).
    prisma.submission.groupBy({
      by: ["emailHash"],
      where: { status: "accepted", emailHash: { not: null } },
      _count: true,
    }),
  ]);

  const countByHash = new Map(
    counts.map((c) => [c.emailHash, c._count] as const),
  );

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={
            <span>
              <Link href="/">Home</Link> / Contributors
            </span>
          }
          title="Contributors"
          sub="People who proposed additions or changes to this archive and chose to be credited publicly. Emails are shown redacted."
        />
        <div className="wrap-wide section-sm">
          {contributors.length === 0 ? (
            <div className="card card-pad">
              <p className="body-txt" style={{ margin: 0 }}>
                No public contributors yet. Propose a change and opt in to be
                listed here.
              </p>
            </div>
          ) : (
            <div className="grid-3">
              {contributors.map((c) => {
                const count = countByHash.get(c.emailHash) ?? 0;
                return (
                  <div key={c.id} className="card card-pad">
                    <h3 className="h-card" style={{ margin: "0 0 6px" }}>
                      {c.displayName || "Anonymous"}
                    </h3>
                    <div className="mono-sm">{c.redactedEmail ?? "—"}</div>
                    <div className="mono-sm" style={{ marginTop: 10 }}>
                      {count} contribution{count === 1 ? "" : "s"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
