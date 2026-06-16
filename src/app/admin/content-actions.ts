"use server";

import { revalidatePath } from "next/cache";
import { getAdminFromCookie, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  applyProposal,
  isProposalType,
  loadContentRow,
  PROPOSAL_TYPES,
  type ProposalType,
  validateProposal,
} from "@/lib/proposals";
import type { SubmissionOp } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface AdminContentChange {
  type: ProposalType;
  op: SubmissionOp;
  targetId?: string | null;
  payload?: Record<string, unknown>;
}

/** The current admin (from the session cookie), or null. */
export async function getAdminContentSession(): Promise<{
  email: string;
} | null> {
  return getAdminFromCookie();
}

/**
 * Apply an admin's content change directly to the real tables — the admin
 * analogue of the contributor proposal flow, minus the Submission/moderation
 * step. Every call is gated by requireAdmin(); the client `isAdmin` flag only
 * decides whether the controls render.
 */
export async function applyAdminContentChange(
  input: AdminContentChange,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "You must be signed in as an admin." };
  }

  const { type, op } = input;
  if (!isProposalType(type))
    return { ok: false, error: "Unknown content type." };
  if (!["add", "edit", "remove"].includes(op))
    return { ok: false, error: "Invalid operation." };

  const targetId = input.targetId ?? null;
  const payload = input.payload ?? {};

  if (op !== "add" && !targetId)
    return { ok: false, error: "No item selected to change." };

  if (op !== "add" && targetId) {
    const exists = await loadContentRow(prisma, type, targetId);
    if (!exists) return { ok: false, error: "That item no longer exists." };
  }

  if (op !== "remove") {
    const err = validateProposal(type, op, payload);
    if (err) return { ok: false, error: err };
  }

  await prisma.$transaction((tx) =>
    applyProposal(tx, type, op, targetId, payload),
  );

  // Content pages plus the home page (stats / timeline preview) may change.
  revalidatePath(PROPOSAL_TYPES[type].basePath);
  revalidatePath("/");
  return { ok: true };
}
