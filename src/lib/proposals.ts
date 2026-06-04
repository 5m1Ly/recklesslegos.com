import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
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
  }
}
