"use server";

import {
  CODE_TTL_MINUTES,
  codeExpiry,
  codeMatches,
  generateCode,
  hashCode,
  isWellFormedCode,
  MAX_CODE_ATTEMPTS,
} from "@/lib/codes";
import { createContributorSession } from "@/lib/contributor-auth";
import { hashEmail } from "@/lib/contributors";
import { prisma } from "@/lib/db";
import { sendAdminSubmissionNotice, sendVerifyCode } from "@/lib/mail";
import { validateRefs } from "@/lib/timeline";
import type { RefType, SubmissionOp } from "@/lib/types";

export interface ContribInput {
  op: SubmissionOp;
  targetId?: string | null;
  date: string;
  title: string;
  description: string;
  ongoing: boolean;
  refs: { refType: RefType; refId: string }[];
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  submissionId?: string;
}

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

function validateInput(input: ContribInput): string | null {
  if (!["add", "edit", "remove"].includes(input.op))
    return "Invalid operation.";

  if (input.op === "remove") {
    if (!input.targetId) return "No timeline entry selected to remove.";
    return null;
  }
  if (input.op === "edit" && !input.targetId)
    return "No timeline entry selected to edit.";

  if (!input.date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(input.date))
    return "A valid date (YYYY-MM-DD) is required.";
  if (!input.title.trim()) return "A title is required.";
  if (!input.description.trim()) return "A description is required.";
  if (input.refs.length > 25) return "Too many references.";
  return null;
}

/** Step 1 — create a draft submission from the contributor's proposed change. */
export async function startSubmission(
  input: ContribInput,
): Promise<ActionResult> {
  const err = validateInput(input);
  if (err) return { ok: false, error: err };

  if ((input.op === "edit" || input.op === "remove") && input.targetId) {
    const exists = await prisma.timelineEntry.findUnique({
      where: { id: input.targetId },
      select: { id: true },
    });
    if (!exists)
      return { ok: false, error: "That timeline entry no longer exists." };
  }

  if (input.op !== "remove" && !(await validateRefs(input.refs)))
    return { ok: false, error: "One or more references are invalid." };

  const sub = await prisma.submission.create({
    data: {
      op: input.op,
      targetId: input.targetId ?? null,
      date: input.op === "remove" ? null : input.date,
      title: input.op === "remove" ? null : input.title,
      description: input.op === "remove" ? null : input.description,
      ongoing: input.op === "remove" ? false : input.ongoing,
      refs: input.op === "remove" ? undefined : input.refs,
      email: "",
      status: "draft",
    },
    select: { id: true },
  });

  return { ok: true, submissionId: sub.id };
}

/** Step 2 — record email + opt-in, issue and email a 6-digit code. */
export async function sendContribCode(
  submissionId: string,
  email: string,
  wantsUpdates: boolean,
): Promise<ActionResult> {
  if (!isEmail(email))
    return { ok: false, error: "Enter a valid email address." };

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, status: true, codeExpires: true },
  });
  if (!sub || sub.status !== "draft")
    return { ok: false, error: "This submission can no longer be edited." };

  // Basic resend cooldown (30s).
  if (sub.codeExpires) {
    const issuedAt = sub.codeExpires.getTime() - CODE_TTL_MINUTES * 60_000;
    if (Date.now() - issuedAt < 30_000)
      return {
        ok: false,
        error: "Please wait a moment before requesting another code.",
      };
  }

  const code = generateCode();
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      email: email.trim().toLowerCase(),
      emailHash: hashEmail(email),
      wantsUpdates,
      emailVerified: false,
      codeHash: hashCode(code),
      codeExpires: codeExpiry(Date.now()),
      codeAttempts: 0,
    },
  });

  await sendVerifyCode(email.trim().toLowerCase(), code, "contribution");
  return { ok: true };
}

/** Step 3 — verify the 6-digit code. */
export async function verifyContribCode(
  submissionId: string,
  code: string,
): Promise<ActionResult> {
  if (!isWellFormedCode(code))
    return { ok: false, error: "Enter the 6-digit code." };

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      status: true,
      email: true,
      codeHash: true,
      codeExpires: true,
      codeAttempts: true,
    },
  });
  if (!sub || sub.status !== "draft" || !sub.codeHash || !sub.codeExpires)
    return { ok: false, error: "Request a code first." };

  if (sub.codeExpires.getTime() < Date.now())
    return { ok: false, error: "That code expired. Request a new one." };
  if (sub.codeAttempts >= MAX_CODE_ATTEMPTS)
    return { ok: false, error: "Too many attempts. Request a new code." };

  if (!codeMatches(code, sub.codeHash)) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { codeAttempts: { increment: 1 } },
    });
    return { ok: false, error: "Incorrect code." };
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { emailVerified: true, codeHash: null, codeExpires: null },
  });

  // Verifying once logs the contributor in, so future add/edit/remove
  // proposals can skip the email-code step entirely.
  if (sub.email) await createContributorSession(sub.email);

  return { ok: true };
}

/** Step 4 — submit the verified draft into the moderation queue. */
export async function finalizeSubmission(
  submissionId: string,
): Promise<ActionResult> {
  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { status: true, emailVerified: true },
  });
  if (!sub) return { ok: false, error: "Submission not found." };
  if (sub.status !== "draft")
    return { ok: false, error: "This submission was already sent." };
  if (!sub.emailVerified)
    return { ok: false, error: "Verify your email before submitting." };

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "pending" },
  });

  // Notify all admins of the proposed change. Best-effort: a mail failure must
  // not fail the submission the contributor just completed.
  try {
    const [admins, full] = await Promise.all([
      prisma.adminUser.findMany({ select: { email: true } }),
      prisma.submission.findUnique({
        where: { id: submissionId },
        select: {
          op: true,
          title: true,
          date: true,
          description: true,
          email: true,
        },
      }),
    ]);
    if (full) {
      await sendAdminSubmissionNotice(
        admins.map((a) => a.email),
        full,
      );
    }
  } catch (err) {
    console.error("[submission] admin notify failed:", err);
  }

  return { ok: true };
}
