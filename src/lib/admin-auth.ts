import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_TTL_DAYS } from "@/lib/codes";
import { prisma } from "@/lib/db";

const COOKIE = "admin_session";

export interface AdminIdentity {
  email: string;
}

/** Create a session for an admin email and set the httpOnly cookie. */
export async function createSession(email: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  await prisma.adminSession.create({ data: { token, email, expiresAt } });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Resolve the current admin from the session cookie, or null. Also confirms the
 * email is still an active admin (so removing an admin revokes access).
 */
export async function getAdminFromCookie(): Promise<AdminIdentity | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({ where: { token } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { email: session.email },
  });
  if (!admin) return null;

  return { email: session.email };
}

/** Throw if the caller is not an authenticated admin; otherwise return them. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getAdminFromCookie();
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

/** Delete the current session and clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await prisma.adminSession.deleteMany({ where: { token } });
  }
  store.delete(COOKIE);
}
