import "server-only";
import { prisma } from "@/lib/db";
import {
  REF_TYPES,
  type RefOption,
  type RefType,
  type TimelineEntryBase,
  type TimelineRefBase,
} from "@/lib/types";

interface RawRef {
  refType: string;
  refId: string;
}

/**
 * Resolve a flat list of {refType, refId} into display-ready refs (label +
 * href), batching one query per type. Unknown/missing items are dropped.
 */
export async function resolveRefs(refs: RawRef[]): Promise<TimelineRefBase[]> {
  const byType = new Map<RefType, Set<string>>();
  for (const r of refs) {
    const t = r.refType as RefType;
    if (!REF_TYPES[t]) continue;
    if (!byType.has(t)) byType.set(t, new Set());
    byType.get(t)?.add(r.refId);
  }

  const labels = new Map<string, string>(); // `${type}:${id}` -> label
  const key = (t: RefType, id: string) => `${t}:${id}`;

  const ids = (t: RefType) => [...(byType.get(t) ?? [])];

  await Promise.all([
    byType.has("video") &&
      prisma.video
        .findMany({ where: { id: { in: ids("video") } } })
        .then((rows) => {
          for (const v of rows) labels.set(key("video", v.id), v.title);
        }),
    byType.has("bodycam") &&
      prisma.bodycam
        .findMany({ where: { id: { in: ids("bodycam") } } })
        .then((rows) => {
          for (const b of rows) labels.set(key("bodycam", b.id), b.title);
        }),
    byType.has("document") &&
      prisma.document
        .findMany({ where: { id: { in: ids("document") } } })
        .then((rows) => {
          for (const d of rows) labels.set(key("document", d.id), d.title);
        }),
    byType.has("social") &&
      prisma.socialPost
        .findMany({ where: { id: { in: ids("social") } } })
        .then((rows) => {
          for (const s of rows)
            labels.set(key("social", s.id), `${s.author} on ${s.platform}`);
        }),
    byType.has("person") &&
      prisma.person
        .findMany({ where: { id: { in: ids("person") } } })
        .then((rows) => {
          for (const p of rows) labels.set(key("person", p.id), p.name);
        }),
  ]);

  const out: TimelineRefBase[] = [];
  for (const r of refs) {
    const t = r.refType as RefType;
    const label = labels.get(key(t, r.refId));
    if (!label) continue;
    out.push({
      refType: t,
      refId: r.refId,
      label,
      href: REF_TYPES[t].href(r.refId),
    });
  }
  return out;
}

/** All published timeline entries, oldest-first, with resolved refs. */
export async function getTimelineEntries(): Promise<TimelineEntryBase[]> {
  const entries = await prisma.timelineEntry.findMany({
    orderBy: { date: "asc" },
    include: { refs: true },
  });

  return Promise.all(
    entries.map(async (e) => ({
      id: e.id,
      date: e.date,
      title: e.title,
      description: e.description,
      ongoing: e.ongoing,
      refs: await resolveRefs(e.refs),
    })),
  );
}

/** Every existing content item that can be referenced from a timeline entry. */
export async function getRefOptions(): Promise<RefOption[]> {
  const [videos, bodycam, documents, social, people] = await Promise.all([
    prisma.video.findMany({ orderBy: { date: "asc" } }),
    prisma.bodycam.findMany({ orderBy: { date: "asc" } }),
    prisma.document.findMany({ orderBy: { date: "asc" } }),
    prisma.socialPost.findMany({ orderBy: { date: "asc" } }),
    prisma.person.findMany({ orderBy: { name: "asc" } }),
  ]);

  const out: RefOption[] = [];
  for (const v of videos)
    out.push({
      refType: "video",
      refId: v.id,
      label: v.title,
      meta: `${v.source} · ${v.platform}`,
      date: v.date,
    });
  for (const b of bodycam)
    out.push({
      refType: "bodycam",
      refId: b.id,
      label: b.title,
      meta: `${b.unit} · ${b.location}`,
      date: b.date,
    });
  for (const d of documents)
    out.push({
      refType: "document",
      refId: d.id,
      label: d.title,
      meta: `${d.type} · ${d.source}`,
      date: d.date,
    });
  for (const s of social)
    out.push({
      refType: "social",
      refId: s.id,
      label: `${s.author} on ${s.platform}`,
      meta: s.text.slice(0, 80),
      date: s.date,
    });
  for (const p of people)
    out.push({
      refType: "person",
      refId: p.id,
      label: p.name,
      meta: `${p.role}${p.org ? ` · ${p.org}` : ""}`,
      date: "",
    });

  return out;
}

/** Validate that every (refType, refId) points to a real content item. */
export async function validateRefs(refs: RawRef[]): Promise<boolean> {
  if (refs.length === 0) return true;
  const resolved = await resolveRefs(refs);
  return resolved.length === refs.length;
}
