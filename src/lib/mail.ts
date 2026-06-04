import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

const FROM = process.env.SMTP_FROM ?? "RecklessBricks <no-reply@localhost>";

let cached: Transporter | null = null;

/**
 * Build (and cache) the nodemailer transport from env. Returns null when SMTP
 * is not configured, in which case callers fall back to logging the message to
 * the server console (useful for local development).
 */
function getTransport(): Transporter | null {
  if (cached) return cached;
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;

  cached = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return cached;
}

async function send(to: string, subject: string, text: string, html: string) {
  const transport = getTransport();
  if (!transport) {
    // No SMTP configured — log a single concise line so the flow stays testable.
    console.log(`[mail] (no SMTP) would send to ${to} — ${subject}`);
    return;
  }
  await transport.sendMail({ from: FROM, to, subject, text, html });
}

function wrap(title: string, body: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
  <h2 style="margin:0 0 12px">${title}</h2>
  ${body}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="font-size:12px;color:#888">RecklessBricks archive · This is an automated message.</p>
  </body></html>`;
}

/** Send a 6-digit verification code (contributor email-verify or admin login). */
export async function sendVerifyCode(
  to: string,
  code: string,
  context: "contribution" | "admin login",
) {
  // Always surface the code in the server console as a single, greppable line,
  // in every environment and regardless of SMTP — this is how codes are read
  // from the logs (e.g. `journalctl -u <svc> -f | grep VERIFY-CODE`).
  console.log(
    `[VERIFY-CODE] ${context} code for ${to}: ${code} (expires in 10 minutes)`,
  );

  const subject = `Your ${context} verification code: ${code}`;
  const text = `Your verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`;
  const html = wrap(
    "Your verification code",
    `<p>Use this code to confirm your ${context}:</p>
     <p style="font-size:30px;font-weight:700;letter-spacing:6px;font-family:monospace">${code}</p>
     <p style="color:#666">This code expires in 10 minutes.</p>`,
  );
  await send(to, subject, text, html);
}

type DecisionStatus = "accepted" | "modified" | "rejected";

/** Notify a contributor (who opted in) about the outcome of their submission. */
export async function sendSubmissionUpdate(
  to: string,
  status: DecisionStatus,
  entryTitle: string,
  adminNote?: string | null,
) {
  const headline =
    status === "accepted"
      ? "Your timeline contribution was published"
      : status === "modified"
        ? "Your timeline contribution was edited and published"
        : "Your timeline contribution was not published";

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const noteHtml = adminNote
    ? `<p style="background:#f6f6f6;padding:10px 12px;border-radius:6px"><strong>Note from the moderator:</strong><br/>${adminNote}</p>`
    : "";
  const noteText = adminNote ? `\n\nNote from the moderator: ${adminNote}` : "";

  const text = `${headline}\n\nSubmission: "${entryTitle}"${noteText}\n\n${site ? `View the timeline: ${site}/timeline` : ""}`;
  const html = wrap(
    headline,
    `<p>Regarding your submission: <strong>${entryTitle}</strong></p>
     ${noteHtml}
     ${site ? `<p><a href="${site}/timeline">View the timeline →</a></p>` : ""}`,
  );
  await send(to, `Timeline update: ${entryTitle}`, text, html);
}

/** Escape user-supplied text before interpolating it into an HTML email. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notify every admin that a contributor has proposed a change (a submission
 * that just entered the moderation queue). Best-effort: callers should not let
 * a mail failure block the submission.
 */
export async function sendAdminSubmissionNotice(
  adminEmails: string[],
  submission: {
    op: string;
    title: string | null;
    date: string | null;
    description: string | null;
    email: string;
  },
): Promise<void> {
  if (adminEmails.length === 0) return;

  const opLabel =
    submission.op === "add"
      ? "New timeline entry"
      : submission.op === "edit"
        ? "Edit to a timeline entry"
        : "Removal request";
  const title = submission.title ?? "(timeline entry)";
  const submitter = submission.email || "(anonymous)";
  const desc = submission.description?.trim();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const subject = `New submission pending review: ${title}`;
  const text = [
    `${opLabel} was proposed and is awaiting moderation.`,
    "",
    `Type: ${submission.op}`,
    submission.date ? `Date: ${submission.date}` : null,
    `Title: ${title}`,
    desc ? `Details: ${desc}` : null,
    `Submitted by: ${submitter}`,
    "",
    site
      ? `Review it: ${site}/admin`
      : "Open the admin dashboard to review it.",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const html = wrap(
    "New submission pending review",
    `<p><strong>${esc(opLabel)}</strong> was proposed and is awaiting moderation.</p>
     <p style="margin:0"><strong>Type:</strong> ${esc(submission.op)}</p>
     ${submission.date ? `<p style="margin:0"><strong>Date:</strong> ${esc(submission.date)}</p>` : ""}
     <p style="margin:0"><strong>Title:</strong> ${esc(title)}</p>
     ${desc ? `<p><strong>Details:</strong> ${esc(desc)}</p>` : ""}
     <p style="margin:0"><strong>Submitted by:</strong> ${esc(submitter)}</p>
     ${site ? `<p><a href="${site}/admin">Review it in the admin dashboard →</a></p>` : ""}`,
  );

  // BCC so admins don't see each other's addresses; `to` is the From identity.
  const transport = getTransport();
  if (!transport) {
    console.log(
      `[mail] (no SMTP) would notify ${adminEmails.length} admin(s) — ${subject}`,
    );
    return;
  }
  await transport.sendMail({
    from: FROM,
    to: FROM,
    bcc: adminEmails,
    subject,
    text,
    html,
  });
}
