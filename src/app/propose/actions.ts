"use server";

import type { Prisma } from "@/generated/prisma/client";
import { hashEmail, redactEmail } from "@/lib/contributors";
import { prisma } from "@/lib/db";
import {
  isProposalType,
  loadContentRow,
  type ProposalType,
  validateProposal,
} from "@/lib/proposals";
import type { SubmissionOp } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  submissionId?: string;
}

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

/** Step 1 (content types) — create a draft submission from a proposed change. */
export async function startContentSubmission(input: {
  contentType: ProposalType;
  op: SubmissionOp;
  targetId?: string | null;
  payload: Record<string, unknown>;
}): Promise<ActionResult> {
  if (!isProposalType(input.contentType))
    return { ok: false, error: "Unknown content type." };
  if (!["add", "edit", "remove"].includes(input.op))
    return { ok: false, error: "Invalid operation." };
  if (input.op !== "add" && !input.targetId)
    return { ok: false, error: "No item selected to change." };

  if (input.op !== "add" && input.targetId) {
    const exists = await loadContentRow(
      prisma,
      input.contentType,
      input.targetId,
    );
    if (!exists) return { ok: false, error: "That item no longer exists." };
  }

  if (input.op !== "remove") {
    const err = validateProposal(input.contentType, input.op, input.payload);
    if (err) return { ok: false, error: err };
  }

  const sub = await prisma.submission.create({
    data: {
      contentType: input.contentType,
      op: input.op,
      targetId: input.targetId ?? null,
      payload:
        input.op === "remove"
          ? undefined
          : (input.payload as Prisma.InputJsonValue),
      email: "",
      status: "draft",
    },
    select: { id: true },
  });

  return { ok: true, submissionId: sub.id };
}

/** Whether this email already has consent answers on file (so the UI can skip
 *  re-asking). Pure lookup — safe to call before the email is verified. */
export async function getConsentStatus(
  email: string,
): Promise<{ onFile: boolean }> {
  if (!isEmail(email)) return { onFile: false };
  const c = await prisma.contributor.findUnique({
    where: { emailHash: hashEmail(email) },
    select: { id: true },
  });
  return { onFile: !!c };
}

/** Record the two consent answers (+ optional display name) for a submission
 *  whose email has been verified. Upserts the Contributor keyed by email hash. */
export async function recordConsent(input: {
  submissionId: string;
  displayName?: string | null;
  consentStoreEmail: boolean;
  consentListPublicly: boolean;
}): Promise<ActionResult> {
  const sub = await prisma.submission.findUnique({
    where: { id: input.submissionId },
    select: { email: true, emailVerified: true },
  });
  if (!sub || !sub.emailVerified || !sub.email)
    return { ok: false, error: "Verify your email first." };

  const emailHash = hashEmail(sub.email);
  const displayName = input.displayName?.trim() || null;
  const redactedEmail = input.consentListPublicly
    ? redactEmail(sub.email)
    : null;

  await prisma.contributor.upsert({
    where: { emailHash },
    create: {
      emailHash,
      displayName,
      redactedEmail,
      consentStoreEmail: input.consentStoreEmail,
      consentListPublicly: input.consentListPublicly,
    },
    update: {
      displayName,
      redactedEmail,
      consentStoreEmail: input.consentStoreEmail,
      consentListPublicly: input.consentListPublicly,
    },
  });

  return { ok: true };
}
