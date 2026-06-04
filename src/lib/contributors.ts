import "server-only";
import { createHash } from "node:crypto";

/** Normalize an email for hashing/lookup (trim + lowercase). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Stable, non-reversible key for an email — lets us recognize a returning
 *  contributor without retaining the plaintext of someone who declined storage. */
export function hashEmail(email: string): string {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

/** Redact an email for public display: "jane@gmail.com" → "j•••@gmail.com". */
export function redactEmail(email: string): string {
  const [user, domain] = normalizeEmail(email).split("@");
  if (!domain || !user) return "•••";
  const dots = "•".repeat(Math.max(1, Math.min(user.length - 1, 3)));
  return `${user.slice(0, 1)}${dots}@${domain}`;
}
