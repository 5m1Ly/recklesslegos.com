import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { hashEmail } from "@/lib/contributors";
import { prisma } from "@/lib/db";

const COOKIE = "contributor_session";

/** How long a contributor stays "logged in" after verifying their email once. */
export const CONTRIB_SESSION_TTL_DAYS = 30;

export interface ContributorIdentity {
  email: string;
}

/** Create a contributor session for a verified email and set the cookie. */
export async function createContributorSession(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + CONTRIB_SESSION_TTL_DAYS * 86_400_000,
  );
  await prisma.contributorSession.create({
    data: {
      token,
      email: normalized,
      emailHash: hashEmail(normalized),
      expiresAt,
    },
  });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Resolve the current contributor from the session cookie, or null. */
export async function getContributorFromCookie(): Promise<ContributorIdentity | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.contributorSession.findUnique({
    where: { token },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;

  return { email: session.email };
}

/** Delete the current contributor session and clear the cookie. */
export async function destroyContributorSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await prisma.contributorSession.deleteMany({ where: { token } });
  }
  store.delete(COOKIE);
}
