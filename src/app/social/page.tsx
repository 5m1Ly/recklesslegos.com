import Link from "next/link";
import { AdminAddButton } from "@/components/admin-content";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/site";
import { SocialClient } from "./social-client";

export const metadata = pageMetadata({
  title: "Social Posts",
  description:
    "Archived social-media posts from across platforms documenting the Bricks & Minifigs takeover and the missing Mansell LEGO Star Wars collection.",
  path: "/social",
});

export default async function SocialPage() {
  const [social, coverageVideos] = await Promise.all([
    prisma.socialPost.findMany({
      orderBy: { date: "desc" },
      include: { event: true },
    }),
    prisma.video.findMany({
      where: { tier: "coverage" },
      orderBy: { date: "asc" },
    }),
  ]);

  const platforms = [
    "X",
    "Reddit",
    "TikTok",
    "Instagram",
    "Facebook",
    "YouTube",
  ];

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={
            <span>
              <Link href="/">Home</Link> / Social media
            </span>
          }
          title="Social media archive"
          sub="Public posts from the involved parties across five platforms, plus third-party video coverage of the controversy."
        >
          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link href="/propose/social?op=add" className="btn btn-ghost">
              + Propose an addition
            </Link>
            <AdminAddButton type="social" />
          </div>
        </PageHead>
        <SocialClient
          social={social}
          platforms={platforms}
          coverageVideos={coverageVideos}
        />
      </main>
      <Footer />
    </div>
  );
}
