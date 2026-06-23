import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  CIDisposition,
  CIECondition,
  CIELocation,
  CIESource,
  CISubthemes,
  CIType,
} from "@/generated/prisma/enums";
import {
  COLLECTION_DESCRIPTION,
  COLLECTION_ID,
  COLLECTION_TITLE,
  itemToFormValues,
  recomputeCollectionTotals,
} from "@/lib/collection";
import type { ProposalType } from "@/lib/proposal-types";
import type { SubmissionOp } from "@/lib/types";

// Server-only apply/coerce logic for accepted proposals. The isomorphic field
// registry + validation lives in src/lib/proposal-types.ts (client-safe).
export * from "@/lib/proposal-types";

// Transaction-client type, derived from $transaction's callback so it tracks
// whatever the generated client calls it.
type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

// ─── coercion (form strings → Prisma types) ──────────────────────────────────

const str = (v: unknown): string =>
  typeof v === "string" ? v.trim() : v == null ? "" : String(v);
const strOrDash = (v: unknown): string => str(v) || "—";
const bool = (v: unknown): boolean => v === true || v === "true";
const nurl = (v: unknown): string | null => str(v) || null;
const int = (v: unknown): number => {
  const n = Number(str(v));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};
const tags = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String);
  return str(v)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
};
/** Coerce a form string to an enum value, falling back when it isn't a member. */
const enumVal = <T extends Record<string, string>>(
  v: unknown,
  members: T,
  fallback: T[keyof T],
): T[keyof T] => {
  const s = str(v);
  return (Object.values(members) as string[]).includes(s)
    ? (s as T[keyof T])
    : fallback;
};

const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

/** Coerce one CollectionItemEntry row from the admin editor's structured payload. */
function coerceEntry(raw: unknown) {
  const e = asObj(raw);
  return {
    id: typeof e.id === "string" && e.id ? e.id : undefined,
    data: {
      condition: enumVal(e.condition, CIECondition, "USED"),
      location: enumVal(e.location, CIELocation, "STORE"),
      disposition: enumVal(e.disposition, CIDisposition, "FOR_SALE"),
      isCrack: bool(e.isCrack),
      isBuild: bool(e.isBuild),
      isBuildWOFigs: bool(e.isBuildWOFigs),
      costPrice: int(e.costPrice),
      displayPrice: int(e.displayPrice),
      sellPrice: int(e.sellPrice),
    },
  };
}

/** Coerce one CollectionItemEvaluation row from the structured payload. */
function coerceEval(raw: unknown) {
  const v = asObj(raw);
  return {
    id: typeof v.id === "string" && v.id ? v.id : undefined,
    source: enumVal(v.source, CIESource, "MANUAL"),
    data: {
      value: int(v.value),
      valueLow: int(v.valueLow),
      valueHigh: int(v.valueHigh),
      retail: int(v.retail),
      note: str(v.note),
    },
  };
}

/** Generate a collision-safe id for a newly created content row. */
function genId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/**
 * Apply an accepted proposal to the real content tables, inside the caller's
 * transaction. An explicit per-type switch keeps Prisma's create/update typing.
 */
export async function applyProposal(
  tx: Tx,
  type: ProposalType,
  op: SubmissionOp,
  targetId: string | null,
  payload: Record<string, unknown>,
): Promise<void> {
  const p = payload;

  switch (type) {
    case "video": {
      if (op === "remove") {
        if (targetId) await tx.video.delete({ where: { id: targetId } });
        return;
      }
      const data = {
        tier: str(p.tier),
        title: str(p.title),
        source: str(p.source),
        platform: str(p.platform),
        date: str(p.date),
        dur: strOrDash(p.dur),
        official: bool(p.official),
        url: nurl(p.url),
      };
      if (op === "add")
        await tx.video.create({
          data: { id: genId("v"), views: "—", ...data },
        });
      else if (targetId)
        await tx.video.update({ where: { id: targetId }, data });
      return;
    }
    case "bodycam": {
      if (op === "remove") {
        if (targetId) await tx.bodycam.delete({ where: { id: targetId } });
        return;
      }
      const data = {
        title: str(p.title),
        officer: strOrDash(p.officer),
        unit: strOrDash(p.unit),
        date: str(p.date),
        time: strOrDash(p.time),
        dur: strOrDash(p.dur),
        location: strOrDash(p.location),
        type: strOrDash(p.type),
        released: strOrDash(p.released),
        url: nurl(p.url),
      };
      if (op === "add")
        await tx.bodycam.create({ data: { id: genId("bc"), ...data } });
      else if (targetId)
        await tx.bodycam.update({ where: { id: targetId }, data });
      return;
    }
    case "document": {
      if (op === "remove") {
        if (targetId) await tx.document.delete({ where: { id: targetId } });
        return;
      }
      const data = {
        title: str(p.title),
        type: str(p.type),
        source: str(p.source),
        date: str(p.date),
        pages: int(p.pages),
        tags: tags(p.tags),
        summary: str(p.summary),
        url: nurl(p.url),
      };
      if (op === "add")
        await tx.document.create({ data: { id: genId("d"), ...data } });
      else if (targetId)
        await tx.document.update({ where: { id: targetId }, data });
      return;
    }
    case "social": {
      if (op === "remove") {
        if (targetId) await tx.socialPost.delete({ where: { id: targetId } });
        return;
      }
      const data = {
        platform: str(p.platform),
        author: str(p.author),
        handle: strOrDash(p.handle),
        date: str(p.date),
        text: str(p.text),
        verified: bool(p.verified),
        url: nurl(p.url),
      };
      if (op === "add")
        await tx.socialPost.create({
          data: {
            id: genId("s"),
            likes: "—",
            reposts: "—",
            replies: "—",
            ...data,
          },
        });
      else if (targetId)
        await tx.socialPost.update({ where: { id: targetId }, data });
      return;
    }
    case "person": {
      if (op === "remove") {
        if (targetId) await tx.person.delete({ where: { id: targetId } });
        return;
      }
      const data = {
        name: str(p.name),
        role: str(p.role),
        org: str(p.org),
        side: str(p.side),
        bio: str(p.bio),
        verified: bool(p.verified),
        orgFlag: bool(p.orgFlag),
      };
      if (op === "add")
        await tx.person.create({ data: { id: genId("p"), ...data } });
      else if (targetId)
        await tx.person.update({ where: { id: targetId }, data });
      return;
    }
    case "legoset": {
      if (op === "remove") {
        // Entries + evaluations cascade on delete (see collection.prisma).
        if (targetId)
          await tx.collectionItem.delete({ where: { id: targetId } });
        if (targetId) await recomputeCollectionTotals(tx, COLLECTION_ID);
        return;
      }

      // The collection container must exist before items attach to it.
      await tx.collection.upsert({
        where: { id: COLLECTION_ID },
        update: {},
        create: {
          id: COLLECTION_ID,
          title: COLLECTION_TITLE,
          description: COLLECTION_DESCRIPTION,
        },
      });

      const itemData = {
        name: str(p.name),
        legoRef: str(p.legoRef),
        type: enumVal(p.type, CIType, "SET"),
        subtheme: enumVal(p.subtheme, CISubthemes, "STARWARS"),
        year: int(p.year),
        pieces: int(p.pieces),
        imageUrl: nurl(p.imageUrl),
        notes: str(p.notes),
      };

      // ── Structured payload (admin editor): full lists of entries + sources ──
      if (Array.isArray(p.entries) || Array.isArray(p.evaluations)) {
        const entries = (Array.isArray(p.entries) ? p.entries : []).map(
          coerceEntry,
        );
        const evals = (Array.isArray(p.evaluations) ? p.evaluations : []).map(
          coerceEval,
        );
        const autoEvaluate =
          p.autoEvaluate == null ? true : bool(p.autoEvaluate);

        let id: string;
        if (op === "add") {
          id = genId("ls");
          await tx.collectionItem.create({
            data: {
              id,
              collectionId: COLLECTION_ID,
              autoEvaluate,
              ...itemData,
            },
          });
        } else if (targetId) {
          id = targetId;
          await tx.collectionItem.update({
            where: { id },
            data: { ...itemData, autoEvaluate },
          });
        } else {
          return;
        }

        // Sync entries: delete the ones the editor dropped, update the rest,
        // create the new (id-less) ones. One entry = one owned copy.
        const keepEntryIds = entries
          .map((e) => e.id)
          .filter((x): x is string => !!x);
        await tx.collectionItemEntry.deleteMany({
          where: {
            itemId: id,
            ...(keepEntryIds.length ? { id: { notIn: keepEntryIds } } : {}),
          },
        });
        for (const e of entries) {
          if (e.id)
            await tx.collectionItemEntry.update({
              where: { id: e.id },
              data: e.data,
            });
          else
            await tx.collectionItemEntry.create({
              data: { itemId: id, ...e.data },
            });
        }

        // Sync evaluations (one row per source; CONTRIBUTORS may repeat).
        const keepEvalIds = evals
          .map((e) => e.id)
          .filter((x): x is string => !!x);
        await tx.collectionItemEvaluation.deleteMany({
          where: {
            itemId: id,
            ...(keepEvalIds.length ? { id: { notIn: keepEvalIds } } : {}),
          },
        });
        for (const ev of evals) {
          if (ev.id)
            await tx.collectionItemEvaluation.update({
              where: { id: ev.id },
              data: { source: ev.source, ...ev.data },
            });
          else
            await tx.collectionItemEvaluation.create({
              data: { itemId: id, source: ev.source, ...ev.data },
            });
        }

        await recomputeCollectionTotals(tx, COLLECTION_ID);
        return;
      }

      // ── Flat payload (public propose flow): item + 1 entry + 1 reading ──
      const entryData = {
        condition: enumVal(p.condition, CIECondition, "USED"),
        location: enumVal(p.location, CIELocation, "STORE"),
        disposition: enumVal(p.disposition, CIDisposition, "FOR_SALE"),
        isCrack: bool(p.isCrack),
        isBuild: bool(p.isBuild),
        isBuildWOFigs: bool(p.isBuildWOFigs),
        costPrice: int(p.costPrice),
        displayPrice: int(p.displayPrice),
        sellPrice: int(p.sellPrice),
      };

      // The single price reading on the form. A BrickEconomy value entered by
      // hand is a manual override → flip autoEvaluate off so the cron leaves it.
      const evalSource = enumVal(p.evalSource, CIESource, "BRICKECONOMY");
      const evalData = {
        value: int(p.value),
        valueLow: int(p.valueLow),
        valueHigh: int(p.valueHigh),
        note: str(p.evalNote),
      };
      const hasEval =
        evalData.value > 0 || evalData.valueLow > 0 || evalData.valueHigh > 0;
      const manualBrickeconomy = hasEval && evalSource === "BRICKECONOMY";

      let itemId: string;
      if (op === "add") {
        itemId = genId("ls");
        await tx.collectionItem.create({
          data: {
            id: itemId,
            collectionId: COLLECTION_ID,
            autoEvaluate: !manualBrickeconomy,
            ...itemData,
            entries: { create: [entryData] },
          },
        });
      } else if (targetId) {
        itemId = targetId;
        await tx.collectionItem.update({
          where: { id: itemId },
          data: {
            ...itemData,
            ...(manualBrickeconomy ? { autoEvaluate: false } : {}),
          },
        });
        // Update the primary (oldest) entry, or create one if none exists yet.
        const primary = await tx.collectionItemEntry.findFirst({
          where: { itemId },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (primary)
          await tx.collectionItemEntry.update({
            where: { id: primary.id },
            data: entryData,
          });
        else
          await tx.collectionItemEntry.create({
            data: { itemId, ...entryData },
          });
      } else {
        return;
      }

      if (hasEval) {
        // Contributor suggestions accrue (one row each); every other source keeps
        // a single row per item that we update in place.
        const existing =
          evalSource === "CONTRIBUTORS"
            ? null
            : await tx.collectionItemEvaluation.findFirst({
                where: { itemId, source: evalSource },
                select: { id: true },
              });
        if (existing)
          await tx.collectionItemEvaluation.update({
            where: { id: existing.id },
            data: evalData,
          });
        else
          await tx.collectionItemEvaluation.create({
            data: { itemId, source: evalSource, ...evalData },
          });
      }

      await recomputeCollectionTotals(tx, COLLECTION_ID);
      return;
    }
  }
}

/**
 * Load an existing content row as a flat payload, for prefilling edit/remove
 * proposals. Returns null if the row doesn't exist.
 */
export async function loadContentRow(
  prisma: PrismaClient,
  type: ProposalType,
  id: string,
): Promise<Record<string, unknown> | null> {
  switch (type) {
    case "video":
      return prisma.video.findUnique({ where: { id } });
    case "bodycam":
      return prisma.bodycam.findUnique({ where: { id } });
    case "document":
      return prisma.document.findUnique({ where: { id } });
    case "social":
      return prisma.socialPost.findUnique({ where: { id } });
    case "person":
      return prisma.person.findUnique({ where: { id } });
    case "legoset": {
      const item = await prisma.collectionItem.findUnique({
        where: { id },
        include: {
          entries: { orderBy: { createdAt: "asc" } },
          evaluations: true,
        },
      });
      return item ? itemToFormValues(item) : null;
    }
  }
}
