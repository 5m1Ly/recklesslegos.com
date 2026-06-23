import Link from "next/link";
import { CollectionAddButton } from "@/components/collection-admin";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import type { CIDisposition, CIESource } from "@/generated/prisma/enums";
import {
  avgValue,
  entryLocationLabel,
  itemToEditData,
  SOURCE_LABELS,
  SOURCE_ORDER,
  sourceValueMap,
} from "@/lib/collection";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/site";
import { fmtMoney } from "@/lib/types";
import { CollectionClient, type ItemView } from "./collection-client";

export const metadata = pageMetadata({
  title: "The LEGO Star Wars Collection",
  description:
    "An itemized inventory of Bryan Mansell's LEGO Star Wars collection — each item's value across multiple price sources, plus per-source totals for the full collection.",
  path: "/collection",
});

// A collection item with the relations the view needs.
type ItemWithRelations = Awaited<ReturnType<typeof loadItems>>[number];

function loadItems() {
  return prisma.collectionItem.findMany({
    include: {
      entries: { orderBy: { createdAt: "asc" } },
      evaluations: true,
    },
  });
}

/** Build the serializable card view from a DB item. */
function toView(item: ItemWithRelations): ItemView {
  const evals = item.evaluations;
  const svMap = sourceValueMap(evals);
  const sources = SOURCE_ORDER.filter((src) => (svMap.get(src) ?? 0) > 0).map(
    (src) => {
      const rows = evals.filter((e) => e.source === src);
      const lows = rows.map((r) => r.valueLow).filter((x) => x > 0);
      const highs = rows.map((r) => r.valueHigh).filter((x) => x > 0);
      return {
        source: src,
        value: svMap.get(src) ?? 0,
        valueLow: lows.length ? Math.min(...lows) : 0,
        valueHigh: highs.length ? Math.max(...highs) : 0,
        note: rows.map((r) => r.note).find((n) => n.trim()) ?? "",
      };
    },
  );

  const primary = item.entries[0];
  const brickeconomy = evals.find((e) => e.source === "BRICKECONOMY");

  return {
    id: item.id,
    name: item.name,
    legoRef: item.legoRef,
    type: item.type,
    year: item.year,
    pieces: item.pieces,
    imageUrl: item.imageUrl,
    notes: item.notes,
    quantity: item.entries.length,
    retail: brickeconomy?.retail ?? 0,
    avg: avgValue(evals),
    disposition: primary?.disposition ?? "HELD",
    location: primary?.location ?? "UNKNOWN",
    sources,
    entries: item.entries.map((e) => ({
      id: e.id,
      locationLabel: entryLocationLabel(e),
      condition: e.condition,
      disposition: e.disposition,
      costPrice: e.costPrice,
      displayPrice: e.displayPrice,
      sellPrice: e.sellPrice,
    })),
    edit: itemToEditData(item),
  };
}

export default async function CollectionPage() {
  const items = await loadItems();
  const views = items.map(toView).sort((a, b) => b.avg - a.avg);
  const sets = views.filter((v) => v.type === "SET");
  const minifigs = views.filter((v) => v.type === "MINIFIGURE");

  // Per-owned-copy value/counts: a row's quantity is how many Bryan owns.
  const sumAvg = (vs: ItemView[]) =>
    vs.reduce((t, v) => t + v.avg * v.quantity, 0);
  const countQty = (vs: ItemView[]) => vs.reduce((t, v) => t + v.quantity, 0);
  const pl = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

  // Per-source totals across the whole collection (the headline ask).
  const perSource = new Map<CIESource, number>();
  for (const it of items) {
    for (const [src, val] of sourceValueMap(it.evaluations))
      perSource.set(src, (perSource.get(src) ?? 0) + val * it.entries.length);
  }

  const grp = (d: CIDisposition) => ({
    sets: sets.filter((v) => v.disposition === d),
    figs: minifigs.filter((v) => v.disposition === d),
  });
  const breakdown = (g: { sets: ItemView[]; figs: ItemView[] }) =>
    `${pl(countQty(g.sets), "set")} · ${pl(countQty(g.figs), "minifig")}`;
  const held = grp("HELD");
  const sold = grp("SOLD");

  const stats = [
    {
      n: fmtMoney(sumAvg(views)),
      label: "Total collection value",
      x: `${breakdown({ sets, figs: minifigs })} · cross-source average`,
    },
    ...SOURCE_ORDER.filter((src) => (perSource.get(src) ?? 0) > 0).map(
      (src) => ({
        n: fmtMoney(perSource.get(src) ?? 0),
        label: `${SOURCE_LABELS[src]} total`,
        x: "market value across the collection",
      }),
    ),
    {
      n: fmtMoney(sumAvg([...held.sets, ...held.figs])),
      label: "Still with Bricks & Minifigs",
      x: breakdown(held),
    },
    {
      n: fmtMoney(sumAvg([...sold.sets, ...sold.figs])),
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
          sub="An itemized inventory of Bryan Mansell's LEGO Star Wars collection. Each item's value is averaged across the price sources that have it; the totals below break the collection down by source and by where each item ended up."
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
              + Propose an item
            </Link>
            <CollectionAddButton />
          </div>
        </PageHead>
        <CollectionClient sets={sets} minifigs={minifigs} />
      </main>
      <Footer />
    </div>
  );
}
