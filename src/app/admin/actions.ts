"use server";

import { revalidatePath } from "next/cache";
import { createSession, destroySession, requireAdmin } from "@/lib/admin-auth";
import {
  codeExpiry,
  codeMatches,
  generateCode,
  hashCode,
  isWellFormedCode,
  MAX_CODE_ATTEMPTS,
} from "@/lib/codes";
import { prisma } from "@/lib/db";
import { sendSubmissionUpdate, sendVerifyCode } from "@/lib/mail";
import { validateRefs } from "@/lib/timeline";
import type { RefType } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

// ── Admin passwordless login ──────────────────────────────────────────────

/** Issue a login code if (and only if) the email is a registered admin. */
export async function requestAdminCode(email: string): Promise<ActionResult> {
  if (!isEmail(email))
    return { ok: false, error: "Enter a valid email address." };
  const normalized = email.trim().toLowerCase();

  let admin: { id: string } | null = null;
  try {
    admin = await prisma.adminUser.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
  } catch (e) {
    // Surface DB / missing-migration problems instead of failing silently.
    console.error(`[admin-login] DB error looking up ${normalized}:`, e);
    return { ok: false, error: "Server error. Please try again later." };
  }

  // Only send to real admins, but always report success to avoid enumeration.
  if (admin) {
    const code = generateCode();
    await prisma.adminLoginCode.deleteMany({ where: { email: normalized } });
    await prisma.adminLoginCode.create({
      data: {
        email: normalized,
        codeHash: hashCode(code),
        expiresAt: codeExpiry(Date.now()),
      },
    });
    await sendVerifyCode(normalized, code, "admin login");
  } else {
    console.log(
      `[admin-login] no admin account for ${normalized} — no code sent. Seed it with: pnpm db:seed`,
    );
  }

  return { ok: true };
}

/** Verify a login code and start a session. */
export async function verifyAdminCode(
  email: string,
  code: string,
): Promise<ActionResult> {
  const normalized = email.trim().toLowerCase();
  if (!isEmail(normalized) || !isWellFormedCode(code))
    return { ok: false, error: "Enter your email and the 6-digit code." };

  const record = await prisma.adminLoginCode.findFirst({
    where: { email: normalized },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return { ok: false, error: "Request a code first." };
  if (record.expiresAt.getTime() < Date.now())
    return { ok: false, error: "That code expired. Request a new one." };
  if (record.attempts >= MAX_CODE_ATTEMPTS)
    return { ok: false, error: "Too many attempts. Request a new code." };

  if (!codeMatches(code, record.codeHash)) {
    await prisma.adminLoginCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Incorrect code." };
  }

  await prisma.adminLoginCode.deleteMany({ where: { email: normalized } });
  await createSession(normalized);
  return { ok: true };
}

export async function adminLogout(): Promise<void> {
  await destroySession();
}

// ── Admin management ──────────────────────────────────────────────────────

export async function addAdmin(email: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isEmail(email))
    return { ok: false, error: "Enter a valid email address." };
  const normalized = email.trim().toLowerCase();

  const existing = await prisma.adminUser.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "That email is already an admin." };

  await prisma.adminUser.create({ data: { email: normalized } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function removeAdmin(email: string): Promise<ActionResult> {
  const me = await requireAdmin();
  const normalized = email.trim().toLowerCase();
  if (normalized === me.email)
    return { ok: false, error: "You can't remove yourself." };

  const count = await prisma.adminUser.count();
  if (count <= 1)
    return { ok: false, error: "At least one admin is required." };

  await prisma.adminUser.deleteMany({ where: { email: normalized } });
  await prisma.adminSession.deleteMany({ where: { email: normalized } });
  revalidatePath("/admin");
  return { ok: true };
}

// ── Moderation decisions ──────────────────────────────────────────────────

export type DecisionAction = "accept" | "modify_accept" | "reject";

export interface DecisionEdits {
  date: string;
  title: string;
  description: string;
  ongoing: boolean;
  refs: { refType: RefType; refId: string }[];
}

interface SubmissionPayload {
  date: string;
  title: string;
  description: string;
  ongoing: boolean;
  refs: { refType: RefType; refId: string }[];
}

function refsFromJson(value: unknown): { refType: RefType; refId: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (r): r is { refType: RefType; refId: string } =>
        !!r && typeof r === "object" && "refType" in r && "refId" in r,
    )
    .map((r) => ({ refType: r.refType, refId: r.refId }));
}

/** Accept (optionally with edits) or reject a pending submission. */
export async function decideSubmission(
  submissionId: string,
  action: DecisionAction,
  edits: DecisionEdits | null,
  note: string | null,
): Promise<ActionResult> {
  await requireAdmin();

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
  });
  if (!sub) return { ok: false, error: "Submission not found." };
  if (sub.status !== "pending")
    return { ok: false, error: "This submission was already decided." };

  const adminNote = note?.trim() || null;

  if (action === "reject") {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "rejected", decidedAt: new Date(), adminNote },
    });
    if (sub.wantsUpdates)
      await sendSubmissionUpdate(
        sub.email,
        "rejected",
        sub.title ?? "your submission",
        adminNote,
      );
    revalidatePath("/admin");
    revalidatePath("/timeline");
    revalidatePath("/");
    return { ok: true };
  }

  // accept / modify_accept
  const useEdits = action === "modify_accept" && edits;

  // Build the effective payload for add/edit operations.
  let payload: SubmissionPayload | null = null;
  if (sub.op !== "remove") {
    payload = useEdits
      ? {
          date: edits.date,
          title: edits.title,
          description: edits.description,
          ongoing: edits.ongoing,
          refs: edits.refs,
        }
      : {
          date: sub.date ?? "",
          title: sub.title ?? "",
          description: sub.description ?? "",
          ongoing: sub.ongoing,
          refs: refsFromJson(sub.refs),
        };

    if (
      !payload.date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(payload.date) ||
      !payload.title.trim() ||
      !payload.description.trim()
    )
      return { ok: false, error: "Date, title and description are required." };

    if (!(await validateRefs(payload.refs)))
      return { ok: false, error: "One or more references are invalid." };
  }

  await prisma.$transaction(async (tx) => {
    if (sub.op === "add" && payload) {
      await tx.timelineEntry.create({
        data: {
          date: payload.date,
          title: payload.title,
          description: payload.description,
          ongoing: payload.ongoing,
          refs: { create: payload.refs },
        },
      });
    } else if (sub.op === "edit" && payload && sub.targetId) {
      await tx.timelineRef.deleteMany({ where: { entryId: sub.targetId } });
      await tx.timelineEntry.update({
        where: { id: sub.targetId },
        data: {
          date: payload.date,
          title: payload.title,
          description: payload.description,
          ongoing: payload.ongoing,
          refs: { create: payload.refs },
        },
      });
    } else if (sub.op === "remove" && sub.targetId) {
      await tx.timelineEntry.deleteMany({ where: { id: sub.targetId } });
    }

    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: "accepted",
        decidedAt: new Date(),
        adminNote,
        // Persist any admin edits onto the submission record for the audit trail.
        ...(useEdits
          ? {
              date: edits.date,
              title: edits.title,
              description: edits.description,
              ongoing: edits.ongoing,
              refs: edits.refs,
            }
          : {}),
      },
    });
  });

  if (sub.wantsUpdates)
    await sendSubmissionUpdate(
      sub.email,
      useEdits ? "modified" : "accepted",
      payload?.title ?? sub.title ?? "your submission",
      adminNote,
    );

  revalidatePath("/admin");
  revalidatePath("/timeline");
  revalidatePath("/");
  return { ok: true };
}
