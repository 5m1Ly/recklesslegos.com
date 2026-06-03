import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Idempotent admin seed. Safe to run on every deploy — it only upserts admin
// accounts and never touches timeline/content/submission data.
//
// Admins come from the SEED_ADMIN_EMAILS env var (comma-separated). If unset,
// the initial admin hbouma01@gmail.com is seeded so the dashboard is reachable.

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});

async function main() {
  // Treat unset OR empty (e.g. an undefined GitHub secret → "") as the default.
  const raw = process.env.SEED_ADMIN_EMAILS?.trim() || "hbouma01@gmail.com";
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));

  if (emails.length === 0) {
    console.warn("No valid admin emails in SEED_ADMIN_EMAILS — nothing to do.");
    return;
  }

  for (const email of emails) {
    await prisma.adminUser.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    console.log(`✓ admin ensured: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
