import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

// Generated at /sitemap.xml. Static routes are listed explicitly; person
// profiles are enumerated from the database so newly-added people are indexed
// without touching this file.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1, lastModified: now },
    {
      url: `${SITE_URL}/timeline`,
      changeFrequency: "daily",
      priority: 0.9,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/videos`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/bodycam`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/documents`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/social`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/people`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/contributors`,
      changeFrequency: "weekly",
      priority: 0.5,
      lastModified: now,
    },
  ];

  const people = await prisma.person.findMany({ select: { id: true } });
  const personRoutes: MetadataRoute.Sitemap = people.map((p) => ({
    url: `${SITE_URL}/people/${p.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...personRoutes];
}
