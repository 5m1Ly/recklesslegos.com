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
  const sets = await prisma.legoSet.findMany({
    orderBy: { currentValue: "desc" },
  });

  const sum = (rows: { currentValue: number }[]) =>
    rows.reduce((total, s) => total + s.currentValue, 0);

  const withBandM = sets.filter((s) => s.status === "With Bricks & Minifigs");
  const sold = sets.filter((s) => s.status === "Sold");

  const stats = [
    {
      n: fmtMoney(sum(sets)),
      label: "Total collection value",
      x: `${sets.length} set${sets.length === 1 ? "" : "s"} · current market value`,
    },
    {
      n: fmtMoney(sum(withBandM)),
      label: "Still with Bricks & Minifigs",
      x: `${withBandM.length} set${withBandM.length === 1 ? "" : "s"}`,
    },
    {
      n: fmtMoney(sum(sold)),
      label: "Sold",
      x: `${sold.length} set${sold.length === 1 ? "" : "s"}`,
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
        <CollectionClient sets={sets} />
      </main>
      <Footer />
    </div>
  );
}
