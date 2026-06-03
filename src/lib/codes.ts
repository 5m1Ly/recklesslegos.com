import { createHash, randomInt, timingSafeEqual } from "node:crypto";

/** Lifetime of a verification / login code in minutes. */
export const CODE_TTL_MINUTES = 10;
/** Max wrong attempts before a code is invalidated. */
export const MAX_CODE_ATTEMPTS = 5;
/** Length of admin session in days. */
export const SESSION_TTL_DAYS = 14;

/** Generate a zero-padded 6-digit code as a string. */
export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Hash a code (or token) with SHA-256, hex-encoded. */
export function hashCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

/** Constant-time comparison of a submitted code against a stored hash. */
export function codeMatches(submitted: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(submitted), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Expiry timestamp for a freshly issued code. */
export function codeExpiry(now: number): Date {
  return new Date(now + CODE_TTL_MINUTES * 60_000);
}

/** Whether a 6-digit numeric code is well-formed. */
export function isWellFormedCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
