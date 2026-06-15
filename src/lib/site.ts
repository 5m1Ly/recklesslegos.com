// Central place for site-wide identity used by metadata, sitemap, and robots.
// SITE_URL drives `metadataBase`, canonical URLs, sitemap entries, and the
// `Sitemap:` line in robots.txt. It falls back to the production domain so a
// missing env var never yields a relative (broken) absolute URL.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://recklessbricks.com"
).replace(/\/$/, "");

export const SITE_NAME = "RecklessBricks";

export const SITE_DESCRIPTION =
  "A centralized archive of the videos, documents, social-media posts, and developments surrounding the hostile Bricks & Minifigs franchise takeover and the disappearance of Bryan Mansell's ~$200,000 LEGO Star Wars collection — the case investigator Reckless Ben was brought in to help recover.";

/**
 * Build a per-page `Metadata` object with a self-consistent title, description,
 * canonical URL, and matching Open Graph / Twitter fields. The root layout's
 * title template appends "— RecklessBricks", so `title` here is the bare page
 * name (e.g. "Timeline"). `path` is the route's absolute path (e.g. "/timeline").
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): import("next").Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      url: path,
    },
    twitter: {
      title: `${title} — ${SITE_NAME}`,
      description,
    },
  };
}
