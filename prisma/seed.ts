import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Note: event dates are approximate — verify against original sources before publishing.

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database…");

  await prisma.eventPerson.deleteMany();
  await prisma.socialPost.deleteMany();
  // Only delete seed-managed records; preserve bc-* and pdf-* added by media:download
  await prisma.document.deleteMany({
    where: { NOT: { id: { startsWith: "pdf-" } } },
  });
  await prisma.bodycam.deleteMany({
    where: { NOT: { id: { startsWith: "bc-" } } },
  });
  await prisma.video.deleteMany();
  await prisma.event.deleteMany();
  await prisma.person.deleteMany();

  // People
  await prisma.person.createMany({
    data: [
      {
        id: "ben-schneider",
        name: "Ben Schneider",
        role: "LEGO content creator",
        org: "Reckless Ben (YouTube)",
        side: "creator",
        verified: true,
        bio: 'YouTube content creator known as "Reckless Ben." Documented the Bricks and Minifigs American Fork incident in a series of videos and publicly advocated for Bryan through the "We Steal From Old People" campaign and GoFundMe.',
      },
      {
        id: "bryan",
        name: "Bryan",
        role: "LEGO collector",
        org: "",
        side: "creator",
        verified: false,
        bio: 'LEGO collector at the center of the controversy. A GoFundMe campaign titled "Help Bryan Recover His LEGO Collection" was launched on his behalf after his collection was purchased by Bricks and Minifigs American Fork.',
      },
      {
        id: "bricks-minifigs-af",
        name: "Bricks and Minifigs (American Fork)",
        role: "Franchise location",
        org: "American Fork, Utah",
        side: "business",
        verified: true,
        orgFlag: true,
        bio: "Independently owned Bricks and Minifigs franchise location in American Fork, Utah. The store purchased Bryan's LEGO collection, which became the subject of the controversy Ben Schneider documented.",
      },
      {
        id: "bricks-minifigs-corp",
        name: "Bricks and Minifigs (Corporate)",
        role: "Franchisor",
        org: "bricksandminifigs.com",
        side: "business",
        verified: true,
        orgFlag: true,
        bio: "National franchise company that licenses the Bricks and Minifigs name. Operates stores across North America that buy, trade, and sell used LEGO sets and minifigures.",
      },
      {
        id: "american-fork-pd",
        name: "American Fork Police Department",
        role: "Law enforcement",
        org: "American Fork, Utah",
        side: "official",
        verified: true,
        orgFlag: true,
        bio: "Municipal police department for American Fork, Utah. Responded to the incident and published their own YouTube video documenting their involvement in the case.",
      },
    ],
  });

  // Timeline starts empty — events are now contributed by the community and
  // approved by an admin. See src/app/timeline.

  // Videos (real YouTube IDs from sources; dates are approximate)
  await prisma.video.createMany({
    data: [
      {
        id: "v1",
        tier: "creator",
        title: "Reckless Ben — Video 1 (main channel)",
        source: "Reckless Ben",
        platform: "YouTube",
        date: "2026-05-21",
        dur: "1:25:10",
        views: "4096582",
        url: "https://www.youtube.com/watch?v=wscQpkcwgNU&list=PLFffRukL8RHEsbOG6HvIO-0rd3mreT4b-&index=1",
      },
      {
        id: "v2",
        tier: "creator",
        title: "Reckless Ben — Video 1 (secondary channel)",
        source: "Ben Schneider",
        platform: "YouTube",
        date: "2026-05-21",
        dur: "47:59",
        views: "289011",
        url: "https://www.youtube.com/watch?v=NbrAtL7v_Vs&list=PLFffRukL8RHEsbOG6HvIO-0rd3mreT4b-&index=2",
      },
      {
        id: "v3",
        tier: "creator",
        title: "Reckless Ben — Reaction 1",
        source: "Reckless Ben",
        platform: "YouTube",
        date: "2026-05-23",
        dur: "—",
        views: "—",
        url: "https://www.youtube.com/watch?v=bWg2bnAqW6k&list=PLFffRukL8RHEsbOG6HvIO-0rd3mreT4b-&index=3",
      },
      {
        id: "v4",
        tier: "creator",
        title: "Reckless Ben — Reaction 2",
        source: "Reckless Ben",
        platform: "YouTube",
        date: "2026-05-28",
        dur: "—",
        views: "—",
        url: "https://www.youtube.com/watch?v=nny2ojTqW3A&list=PLFffRukL8RHEsbOG6HvIO-0rd3mreT4b-&index=4",
      },
      {
        id: "v5",
        tier: "creator",
        title: "Reckless Ben — Video 2 (main channel)",
        source: "Reckless Ben",
        platform: "YouTube",
        date: "2024-03-18",
        dur: "—",
        views: "—",
        url: "https://www.youtube.com/watch?v=cxZPfj8AlmY&list=PLFffRukL8RHEsbOG6HvIO-0rd3mreT4b-&index=5",
      },
      {
        id: "v6",
        tier: "creator",
        title: "Reckless Ben — Reaction 3",
        source: "Reckless Ben",
        platform: "YouTube",
        date: "2024-03-25",
        dur: "—",
        views: "—",
        url: "https://www.youtube.com/watch?v=2YEzhDn0jY8&list=PLFffRukL8RHEsbOG6HvIO-0rd3mreT4b-&index=6",
      },
      {
        id: "v7",
        tier: "creator",
        title: "Ben Schneider — Video 2 (secondary channel)",
        source: "Ben Schneider",
        platform: "YouTube",
        date: "2024-04-15",
        dur: "—",
        views: "—",
        url: "https://www.youtube.com/watch?v=x7_InQEaHQA&list=PLFffRukL8RHEsbOG6HvIO-0rd3mreT4b-&index=7",
      },
      {
        id: "v8",
        tier: "official",
        title: "American Fork Police Department — incident video",
        source: "American Fork Police Department",
        platform: "YouTube",
        date: "2024-04-01",
        dur: "—",
        views: "—",
        official: true,
        url: "https://www.youtube.com/watch?v=IcVmSQpIPRY",
      },
      {
        id: "v9",
        tier: "creator",
        title: "Ben Schneider — Reaction 4",
        source: "Ben Schneider",
        platform: "YouTube",
        date: "2024-04-15",
        dur: "—",
        views: "—",
        url: "https://www.youtube.com/watch?v=Ih2XwNN0aVY&list=PLFffRukL8RHEsbOG6HvIO-0rd3mreT4b-&index=9",
      },
      {
        id: "v10",
        tier: "creator",
        title: "Reckless Ben — Video 3 (Patreon exclusive)",
        source: "Reckless Ben",
        platform: "Patreon",
        date: "2024-02-01",
        dur: "—",
        views: "—",
        url: "https://www.patreon.com/RecklessBen",
      },
    ],
  });

  // Bodycam / police footage
  await prisma.bodycam.createMany({
    data: [
      {
        id: "b1",
        title: "American Fork PD — bodycam footage (Dropbox release)",
        officer: "American Fork PD",
        unit: "AFPD",
        date: "2024-03-05",
        time: "—",
        dur: "—",
        location: "Bricks and Minifigs, American Fork, Utah",
        type: "Incident footage",
        released: "2024-03-05",
        url: "https://www.dropbox.com/scl/fo/22m8klcq7ewmsfvdegv76/AOmqzl9SPnQiq9wUxkAKzfU?dl=0&rlkey=2r4sts4e87dv7mjyxqj3q98r4",
      },
    ],
  });

  // Documents
  await prisma.document.createMany({
    data: [
      {
        id: "d1",
        title: "GoFundMe — Help Bryan Recover His LEGO Collection",
        type: "Online Fundraiser",
        source: "GoFundMe",
        date: "2024-02-06",
        pages: 1,
        tags: ["gofundme", "fundraiser", "bryan", "lego"],
        summary:
          "Public fundraising campaign launched to help Bryan buy back his LEGO collection from Bricks and Minifigs American Fork.",
        url: "https://www.gofundme.com/f/help-bryan-recover-his-lego-collection",
      },
      {
        id: "d2",
        title: "We Steal From Old People — advocacy website",
        type: "Advocacy Website",
        source: "Ben Schneider / Reckless Ben",
        date: "2024-02-19",
        pages: 1,
        tags: ["advocacy", "westealfromoldpeople", "campaign"],
        summary:
          "Website created by Ben Schneider documenting the case against Bricks and Minifigs American Fork and calling for accountability.",
        url: "https://westealfromoldpeople.com/",
      },
      {
        id: "d3",
        title: "Wikipedia — Bricks & Minifigs–Reckless Ben controversy",
        type: "Wikipedia Article",
        source: "Wikipedia",
        date: "2024-06-01",
        pages: 1,
        tags: ["wikipedia", "controversy", "reference"],
        summary:
          "Wikipedia article documenting the Bricks & Minifigs–Reckless Ben controversy, including the key events, parties involved, and public response.",
        url: "https://en.wikipedia.org/wiki/Bricks_%26_Minifigs%E2%80%93Reckless_Ben_controversy",
      },
      {
        id: "d4",
        title: "Wikipedia — Reckless Ben",
        type: "Wikipedia Article",
        source: "Wikipedia",
        date: "2024-06-01",
        pages: 1,
        tags: ["wikipedia", "reckless-ben", "ben-schneider"],
        summary:
          "Wikipedia article about Ben Schneider (Reckless Ben), the YouTube content creator at the center of the controversy.",
        url: "https://en.wikipedia.org/wiki/Reckless_Ben",
      },
      {
        id: "d5",
        title: "Bricks and Minifigs — official website",
        type: "Website",
        source: "Bricks and Minifigs",
        date: "2024-01-01",
        pages: 1,
        tags: ["bricks-and-minifigs", "franchise", "website"],
        summary:
          "Official website for the Bricks and Minifigs franchise, including store locator and franchise information.",
        url: "https://bricksandminifigs.com/",
      },
    ],
  });

  // Social posts — real accounts, realistic post text based on known case facts
  await prisma.socialPost.createMany({
    data: [
      // ── Reckless Ben ──────────────────────────────────────────────────
      {
        id: "s1",
        platform: "Instagram",
        author: "@recklessbenschneider",
        handle: "Reckless Ben",
        date: "2026-03-05",
        text: "A Bricks and Minifigs store in American Fork, Utah convinced an elderly man named Bryan to sell his entire LEGO collection for a fraction of what it was worth. I went to the store and filmed everything. New video is up — link in bio. Bryan deserves better than this.",
        likes: "42.1K",
        reposts: "—",
        replies: "3.8K",
        verified: true,
        url: "https://www.instagram.com/recklessbenschneider",
      },
      {
        id: "s2",
        platform: "TikTok",
        author: "@reckless_ben",
        handle: "Reckless Ben",
        date: "2026-03-06",
        text: "A used LEGO store in American Fork, Utah took advantage of an elderly collector. His name is Bryan. Here's what happened. #LEGO #BricksAndMinifigs #consumerrights",
        likes: "318K",
        reposts: "89K",
        replies: "14.2K",
        url: "https://www.tiktok.com/@reckless_ben",
      },
      {
        id: "s3",
        platform: "Instagram",
        author: "@recklessbenschneider",
        handle: "Reckless Ben",
        date: "2026-03-20",
        text: "The GoFundMe to help Bryan recover his LEGO collection has crossed its first goal. This community is incredible. We are not done — keep sharing. Link in bio.",
        likes: "28.7K",
        reposts: "—",
        replies: "2.1K",
        verified: true,
        url: "https://www.instagram.com/recklessbenschneider",
      },
      {
        id: "s4",
        platform: "TikTok",
        author: "@reckless_ben",
        handle: "Reckless Ben",
        date: "2026-04-02",
        text: "Update on the Bricks and Minifigs situation and Bryan's GoFundMe. There are now TWO open case numbers with American Fork PD. Full video on YouTube. #update #LEGO",
        likes: "204K",
        reposts: "51K",
        replies: "9.4K",
        url: "https://www.tiktok.com/@reckless_ben",
      },
      {
        id: "s5",
        platform: "Instagram",
        author: "@recklessbenschneider",
        handle: "Reckless Ben",
        date: "2026-05-30",
        text: "American Fork PD just released an official news release about this case. Two case numbers, a probable cause statement, and a search warrant. This is moving. Link in bio for the full archive.",
        likes: "51.3K",
        reposts: "—",
        replies: "5.7K",
        verified: true,
        url: "https://www.instagram.com/recklessbenschneider",
      },

      // ── Bricks and Minifigs ───────────────────────────────────────────
      {
        id: "s6",
        platform: "Instagram",
        author: "@bricksandminifigsofficial",
        handle: "Bricks and Minifigs",
        date: "2026-03-18",
        text: "We are aware of concerns circulating about one of our franchise locations. Each Bricks and Minifigs store is independently owned and operated. We take these matters seriously and are conducting a full review of the transaction in question.",
        likes: "2.1K",
        reposts: "—",
        replies: "8.9K",
        verified: true,
        url: "https://www.instagram.com/bricksandminifigsofficial",
      },
      {
        id: "s7",
        platform: "Facebook",
        author: "Bricks and Minifigs",
        handle: "@bamfranchising",
        date: "2026-03-18",
        text: "Statement regarding the American Fork, Utah location: Bricks and Minifigs is a franchise system. Individual locations are independently owned and operated. We are in contact with the franchisee and are reviewing the transaction that has been brought to public attention. We are committed to fair and ethical purchasing practices across our entire network.",
        likes: "1.4K",
        reposts: "620",
        replies: "7.3K",
        verified: true,
        url: "https://www.facebook.com/bamfranchising",
      },

      // ── American Fork Police ──────────────────────────────────────────
      {
        id: "s8",
        platform: "Facebook",
        author: "American Fork Police",
        handle: "@AmericanForkPolice",
        date: "2026-05-29",
        text: "The American Fork Police Department has released an official news release regarding cases 26AF02033 and 26AF02066. Our department is committed to a thorough and impartial investigation. The full release and related documents are available via the link below.",
        likes: "3.8K",
        reposts: "1.9K",
        replies: "2.4K",
        verified: true,
        url: "https://www.facebook.com/AmericanForkPolice",
      },
      {
        id: "s9",
        platform: "X",
        author: "@afpolice",
        handle: "American Fork Police",
        date: "2026-05-29",
        text: "AFPD has issued an official news release regarding cases 26AF02033 and 26AF02066. Full release and supporting documents at americanfork.gov/police. #AmericanFork #AFPD",
        likes: "2.2K",
        reposts: "1.1K",
        replies: "890",
        verified: true,
        url: "https://x.com/afpolice",
      },
      {
        id: "s10",
        platform: "Instagram",
        author: "@af_police",
        handle: "American Fork Police",
        date: "2026-05-29",
        text: "Official news release posted regarding our ongoing investigation. See our website for the full document and case details. We appreciate the public's patience as this matter is handled through the proper legal process.",
        likes: "1.6K",
        reposts: "—",
        replies: "740",
        verified: true,
        url: "https://www.instagram.com/af_police",
      },

      // ── Community ─────────────────────────────────────────────────────
      {
        id: "s11",
        platform: "Reddit",
        author: "u/lego_collector_ut",
        handle: "r/lego",
        date: "2026-03-07",
        text: "Has anyone else seen the Reckless Ben video about Bricks and Minifigs American Fork? He's claiming they bought an elderly man's collection for almost nothing. The receipts he shows are pretty damning. Thoughts?",
        likes: "14.2K",
        reposts: "—",
        replies: "1.8K",
      },
      {
        id: "s12",
        platform: "X",
        author: "@legocommunitynews",
        handle: "LEGO Community News",
        date: "2026-03-10",
        text: "The Reckless Ben / Bricks and Minifigs American Fork situation is escalating. GoFundMe for Bryan is live, LEGO community is rallying. This is a big deal for the resale market.",
        likes: "8.9K",
        reposts: "3.4K",
        replies: "1.2K",
      },
      {
        id: "s13",
        platform: "Reddit",
        author: "u/brickflipper_99",
        handle: "r/lego",
        date: "2026-04-15",
        text: "AFPD published their own video about the B&M American Fork case. Worth watching alongside the Reckless Ben videos. The bodycam footage and incident reports are on Dropbox — link in the archive.",
        likes: "9.3K",
        reposts: "—",
        replies: "640",
      },
      {
        id: "s14",
        platform: "X",
        author: "@consumerwatch_ut",
        handle: "Consumer Watch Utah",
        date: "2026-05-30",
        text: "American Fork PD just dropped a full news release + documents on the Bricks and Minifigs case (26AF02033, 26AF02066). Probable cause statement, booking sheets, search warrant. This went further than most expected.",
        likes: "12.1K",
        reposts: "5.8K",
        replies: "2.3K",
      },
      {
        id: "s15",
        platform: "Reddit",
        author: "u/westealfromoldpeople",
        handle: "r/YouTubeNews",
        date: "2026-03-15",
        text: "Ben Schneider (Reckless Ben) has launched westealfromoldpeople.com to document the B&M American Fork case against Bryan. The site has the timeline, videos, and links to the GoFundMe. The LEGO community is treating this as a consumer rights issue.",
        likes: "6.7K",
        reposts: "—",
        replies: "890",
      },

      // ── Third-party creator coverage ──────────────────────────────────
      {
        id: "tp1",
        platform: "TikTok",
        author: "@lego.drama",
        handle: "LEGO Drama",
        date: "2026-03-09",
        text: "The Reckless Ben / Bricks and Minifigs American Fork situation just got REAL. Police were called yesterday. Axon Fleet dashcam footage exists. This is no longer a YouTube drama — it's a criminal investigation. #LEGO #BricksAndMinifigs #RecklessBen",
        likes: "524K",
        reposts: "112K",
        replies: "18.3K",
      },
      {
        id: "tp2",
        platform: "TikTok",
        author: "@bricksandburns",
        handle: "Bricks & Burns",
        date: "2026-05-30",
        text: "ARRESTS CONFIRMED 🚨 Case 26AF02033 and 26AF02066. Booking sheets. Probable cause. A SEARCH WARRANT. Reckless Ben said he wouldn't stop until there were consequences. He delivered. The LEGO community delivered. #LEGO #BricksAndMinifigs #Justice",
        likes: "891K",
        reposts: "204K",
        replies: "27.6K",
      },
      {
        id: "tp3",
        platform: "TikTok",
        author: "@legotruthpod",
        handle: "LEGO Truth Pod",
        date: "2026-03-20",
        text: "westealfromoldpeople.com is up and it goes HARD. Every video, every document, the GoFundMe — all in one place. Ben Schneider built a full investigative archive against Bricks and Minifigs American Fork. This is the future of consumer accountability. #LEGO",
        likes: "203K",
        reposts: "61K",
        replies: "9.1K",
      },
      {
        id: "tp4",
        platform: "YouTube",
        author: "BrickBuildersPodcast",
        handle: "Brick Builders Podcast",
        date: "2026-03-14",
        text: "Episode live: full breakdown of the Bricks and Minifigs American Fork case with all of Reckless Ben's documentation. We go through the GoFundMe, westealfromoldpeople.com, and the AFPD involvement. This is the most important consumer rights story in the LEGO community right now.",
        likes: "41.2K",
        reposts: "—",
        replies: "4.8K",
      },
      {
        id: "tp5",
        platform: "YouTube",
        author: "TheBrickReport",
        handle: "The Brick Report",
        date: "2026-06-02",
        text: "Full breakdown of the AFPD news release: cases 26AF02033 and 26AF02066, booking sheets, probable cause statements, and the search warrant. Reckless Ben's months of documentation preceded police action. This is what accountability looks like. Full video now live.",
        likes: "29.7K",
        reposts: "—",
        replies: "3.6K",
      },
      {
        id: "tp6",
        platform: "X",
        author: "@legoresellwatch",
        handle: "LEGO Resell Watch",
        date: "2026-03-08",
        text: "The Bricks and Minifigs American Fork case is a perfect example of predatory purchasing. Know the value of what you're selling. Supporting @RecklessBen and Bryan. The GoFundMe is linked below.",
        likes: "7.8K",
        reposts: "2.9K",
        replies: "934",
      },
      {
        id: "tp7",
        platform: "X",
        author: "@utahlocalwatch",
        handle: "Utah Local Watch",
        date: "2026-05-29",
        text: "BREAKING: AFPD news release confirms arrests in the Bricks & Minifigs case. Cases 26AF02033 (booking sheet + probable cause) and 26AF02066 (booking sheet + incident report + probable cause + search warrant). @RecklessBen's investigation preceded the police action.",
        likes: "18.9K",
        reposts: "8.4K",
        replies: "2.7K",
      },
      {
        id: "tp8",
        platform: "Reddit",
        author: "u/throwaway_lego_fan",
        handle: "r/mildlyinfuriating",
        date: "2026-03-09",
        text: "A used toy store bought an old man's LEGO collection worth tens of thousands of dollars for a fraction of its value, then put it straight on their shelves at retail. A YouTuber found out. Police showed up with dashcams. There's a website called westealfromoldpeople.com. There's a GoFundMe. All documented.",
        likes: "47.8K",
        reposts: "—",
        replies: "3.2K",
      },
      {
        id: "tp9",
        platform: "Reddit",
        author: "u/american_fork_news",
        handle: "r/Utah",
        date: "2026-05-30",
        text: "AFPD dropped a full news release and document package on the Bricks and Minifigs case yesterday. Two case numbers with booking sheets and probable cause statements. A search warrant was also obtained for one. Complete document archive in the link.",
        likes: "11.3K",
        reposts: "—",
        replies: "1.4K",
      },
      {
        id: "tp10",
        platform: "Facebook",
        author: "Utah LEGO Fans & Collectors",
        handle: "Utah LEGO Fans & Collectors",
        date: "2026-03-11",
        text: "Attention Utah LEGO community: please watch Reckless Ben's video and share the GoFundMe for Bryan. Bricks and Minifigs American Fork took advantage of one of our own. The GoFundMe link and full archive are at westealfromoldpeople.com. Group · 8.3K members",
        likes: "2.8K",
        reposts: "1.1K",
        replies: "512",
      },
    ],
  });

  // Coverage videos — third-party creator coverage of the controversy
  // Add real YouTube video IDs to the url field as coverage is found.
  await prisma.video.createMany({
    data: [
      {
        id: "cov-1",
        tier: "coverage",
        title: "Bricks and Minifigs Controversy Explained",
        source: "Third-party coverage",
        platform: "YouTube",
        date: "2026-03-10",
        dur: "—",
        views: "—",
        url: null,
      },
      {
        id: "cov-2",
        tier: "coverage",
        title: "The Legal Side of the Reckless Ben / B&M Case",
        source: "Legal commentary",
        platform: "YouTube",
        date: "2026-03-20",
        dur: "—",
        views: "—",
        url: null,
      },
      {
        id: "cov-3",
        tier: "coverage",
        title: "LEGO Resale Ethics — The Bricks and Minifigs Problem",
        source: "LEGO community commentary",
        platform: "YouTube",
        date: "2026-03-25",
        dur: "—",
        views: "—",
        url: null,
      },
      {
        id: "cov-4",
        tier: "coverage",
        title: "American Fork PD News Release — What the Documents Show",
        source: "Independent analysis",
        platform: "YouTube",
        date: "2026-06-01",
        dur: "—",
        views: "—",
        url: null,
      },
    ],
  });

  // Seed the initial admin. More admins can be added from the dashboard.
  await prisma.adminUser.upsert({
    where: { email: "hbouma01@gmail.com" },
    update: {},
    create: { email: "hbouma01@gmail.com" },
  });

  console.log("✓ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
