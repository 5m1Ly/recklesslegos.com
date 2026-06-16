import Link from "next/link";
import { AdminAddButton } from "@/components/admin-content";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/site";
import { fmtMoney } from "@/lib/types";
import { CollectionClient } from "./collection-client";

export const metadata = pageMetadata({
  title: "The LEGO Star Wars Collection",
  description:
    "An itemized inventory of Bryan Mansell's LEGO Star Wars collection — each set's current value, plus totals for the full collection, the sets sold, and the sets still held by Bricks & Minifigs.",
  path: "/collection",
});

export default async function CollectionPage() {
  const [sets, minifigs] = await Promise.all([
    prisma.legoSet.findMany({ orderBy: { currentValue: "desc" } }),
    prisma.legoMinifig.findMany({ orderBy: { currentValue: "desc" } }),
  ]);

  // Values and counts are per owned copy: a row's quantity is how many Bryan
  // owns, so value and totals multiply by it.
  const sum = (rows: { currentValue: number; quantity: number }[]) =>
    rows.reduce((total, r) => total + r.currentValue * r.quantity, 0);
  const count = (rows: { quantity: number }[]) =>
    rows.reduce((n, r) => n + r.quantity, 0);

  const byStatus = (status: string) => ({
    sets: sets.filter((s) => s.status === status),
    figs: minifigs.filter((m) => m.status === status),
  });
  const withBandM = byStatus("With Bricks & Minifigs");
  const sold = byStatus("Sold");

  const pl = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const breakdown = (g: { sets: typeof sets; figs: typeof minifigs }) =>
    `${pl(count(g.sets), "set")} · ${pl(count(g.figs), "minifig")}`;

  const stats = [
    {
      n: fmtMoney(sum(sets) + sum(minifigs)),
      label: "Total collection value",
      x: `${breakdown({ sets, figs: minifigs })} · current market value`,
    },
    {
      n: fmtMoney(sum(withBandM.sets) + sum(withBandM.figs)),
      label: "Still with Bricks & Minifigs",
      x: breakdown(withBandM),
    },
    {
      n: fmtMoney(sum(sold.sets) + sum(sold.figs)),
      label: "Sold",
      x: breakdown(sold),
    },
  ];

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={
            <span>
              <Link href="/">Home</Link> / The LEGO Star Wars Collection
            </span>
          }
          title="The LEGO Star Wars Collection"
          sub="An itemized inventory of Bryan Mansell's LEGO Star Wars collection. Each set's current value is an approximate secondary-market figure; totals below break the collection down by where each set ended up."
        >
          <div className="stat-grid" style={{ marginTop: 24 }}>
            {stats.map((s) => (
              <div className="stat-cell" key={s.label}>
                <div className="sn tnum">{s.n}</div>
                <div className="sl">{s.label}</div>
                <div className="sx">{s.x}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link href="/propose/legoset?op=add" className="btn btn-ghost">
              + Propose a set
            </Link>
            <AdminAddButton type="legoset" />
          </div>
        </PageHead>
        <CollectionClient sets={sets} minifigs={minifigs} />
      </main>
      <Footer />
    </div>
  );
}
