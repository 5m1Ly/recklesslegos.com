import Link from "next/link";
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

  // Sets count once; minifigs count by quantity (duplicates are common).
  const setSum = (rows: { currentValue: number }[]) =>
    rows.reduce((total, s) => total + s.currentValue, 0);
  const figSum = (rows: { currentValue: number; quantity: number }[]) =>
    rows.reduce((total, m) => total + m.currentValue * m.quantity, 0);

  const byStatus = (status: string) => ({
    sets: sets.filter((s) => s.status === status),
    figs: minifigs.filter((m) => m.status === status),
  });
  const withBandM = byStatus("With Bricks & Minifigs");
  const sold = byStatus("Sold");

  const figCount = minifigs.reduce((n, m) => n + m.quantity, 0);
  const pl = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  const stats = [
    {
      n: fmtMoney(setSum(sets) + figSum(minifigs)),
      label: "Total collection value",
      x: `${pl(sets.length, "set")} · ${pl(figCount, "minifig")} · current market value`,
    },
    {
      n: fmtMoney(setSum(withBandM.sets) + figSum(withBandM.figs)),
      label: "Still with Bricks & Minifigs",
      x: `${pl(withBandM.sets.length, "set")} · ${pl(withBandM.figs.length, "minifig")}`,
    },
    {
      n: fmtMoney(setSum(sold.sets) + figSum(sold.figs)),
      label: "Sold",
      x: `${pl(sold.sets.length, "set")} · ${pl(sold.figs.length, "minifig")}`,
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
          <div style={{ marginTop: 18 }}>
            <Link href="/propose/legoset?op=add" className="btn btn-ghost">
              + Propose a set
            </Link>
          </div>
        </PageHead>
        <CollectionClient sets={sets} minifigs={minifigs} />
      </main>
      <Footer />
    </div>
  );
}
