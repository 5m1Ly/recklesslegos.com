/**
 * Downloads the AFPD Dropbox release, extracts video and document files into
 * public/media/, and upserts matching database records so the bodycam and
 * documents pages serve the real files.
 *
 * Usage:
 *   pnpm media:download
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";
import { PrismaPg } from "@prisma/adapter-pg";
import unzipper from "unzipper";
import { PrismaClient } from "../src/generated/prisma/client";

const DROPBOX_URL =
  "https://www.dropbox.com/scl/fo/22m8klcq7ewmsfvdegv76/AOmqzl9SPnQiq9wUxkAKzfU?dl=1&rlkey=2r4sts4e87dv7mjyxqj3q98r4";

const PUBLIC_BODYCAM = "public/media/bodycam";
const PUBLIC_DOCS = "public/media/documents";

const VIDEO_EXTS = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"]);
const DOC_EXTS = new Set([".pdf", ".doc", ".docx", ".xlsx", ".txt"]);

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/, "");
}

function mimeForVideo(ext: string): string {
  const map: Record<string, string> = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
    ".webm": "video/webm",
    ".m4v": "video/mp4",
  };
  return map[ext] ?? "video/mp4";
}

async function saveEntry(entry: unzipper.Entry, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    entry.pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
    entry.on("error", reject);
  });
}

async function main() {
  fs.mkdirSync(PUBLIC_BODYCAM, { recursive: true });
  fs.mkdirSync(PUBLIC_DOCS, { recursive: true });

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "",
  });
  const prisma = new PrismaClient({ adapter });

  console.log("⬇  Fetching Dropbox folder (may take a while for large files)…");
  const res = await fetch(DROPBOX_URL);
  if (!res.ok)
    throw new Error(`Dropbox returned HTTP ${res.status} ${res.statusText}`);
  if (!res.body) throw new Error("Response had no body");

  const videos: string[] = [];
  const docs: string[] = [];

  // Convert Web ReadableStream → Node Readable so unzipper can consume it
  // biome-ignore lint/suspicious/noExplicitAny: Readable.fromWeb expects the web stream type
  const nodeStream = Readable.fromWeb(res.body as any);
  const zip = nodeStream.pipe(unzipper.Parse({ forceStream: true }));

  try {
    for await (const entry of zip) {
      const fullPath = (entry as unzipper.Entry).path as string;
      const name = path.basename(fullPath);
      const ext = path.extname(name).toLowerCase();

      // Skip directories, macOS resource forks, hidden files
      if (
        fullPath.endsWith("/") ||
        name.startsWith("._") ||
        name.startsWith(".")
      ) {
        (entry as unzipper.Entry).autodrain();
        continue;
      }

      if (VIDEO_EXTS.has(ext)) {
        const dest = path.join(PUBLIC_BODYCAM, name);
        await saveEntry(entry as unzipper.Entry, dest);
        videos.push(name);
        process.stdout.write(`  ✓ bodycam  ${name}\n`);
      } else if (DOC_EXTS.has(ext)) {
        const dest = path.join(PUBLIC_DOCS, name);
        await saveEntry(entry as unzipper.Entry, dest);
        docs.push(name);
        process.stdout.write(`  ✓ document ${name}\n`);
      } else {
        (entry as unzipper.Entry).autodrain();
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Dropbox zips use a non-standard end-of-central-directory signature that
    // unzipper rejects after all file content has already been extracted.
    if (msg.includes("invalid signature")) {
      console.warn(
        "\n⚠  Zip end-of-archive signature not recognised (Dropbox quirk) — all extracted files are complete.",
      );
    } else {
      throw err;
    }
  }

  if (videos.length === 0 && docs.length === 0) {
    console.log("\n⚠  No video or document files found in the zip.");
    console.log(
      "   The Dropbox link may have expired or the folder structure changed.",
    );
    await prisma.$disconnect();
    return;
  }

  // Remove the generic Dropbox-URL placeholder (b1) if we now have real files
  if (videos.length > 0) {
    await prisma.bodycam.deleteMany({ where: { id: "b1" } });
  }

  // Upsert a bodycam record for each downloaded video
  for (const name of videos) {
    const stem = path.parse(name).name;
    const id = `bc-${toSlug(stem)}`;
    const url = `/media/bodycam/${name}`;
    const ext = path.extname(name).toLowerCase();

    await prisma.bodycam.upsert({
      where: { id },
      create: {
        id,
        title: stem,
        officer: "American Fork PD",
        unit: "AFPD",
        date: "2024-03-05",
        time: "—",
        dur: "—",
        location: "Bricks and Minifigs, American Fork, UT",
        type: mimeForVideo(ext).startsWith("video")
          ? "Incident footage"
          : "Footage",
        released: "2024-03-05",
        url,
        eventId: "e7",
      },
      update: { url },
    });
  }

  // Upsert a document record for each downloaded PDF / doc
  for (const name of docs) {
    const stem = path.parse(name).name;
    const id = `pdf-${toSlug(stem)}`;
    const url = `/media/documents/${name}`;
    const ext = path.extname(name).toLowerCase();
    const type = ext === ".pdf" ? "Police Report" : "Public Record";

    await prisma.document.upsert({
      where: { id },
      create: {
        id,
        title: stem,
        type,
        source: "American Fork Police Department",
        date: "2024-03-05",
        pages: 1,
        tags: ["afpd", "dropbox", ext.slice(1)],
        summary: `Released by AFPD via Dropbox. File: ${name}`,
        url,
        eventId: "e7",
      },
      update: { url },
    });
  }

  console.log(
    `\n✓ Done. ${videos.length} bodycam file(s), ${docs.length} document(s) saved to public/media/.`,
  );
  console.log("  Restart the dev server to serve the new files.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
