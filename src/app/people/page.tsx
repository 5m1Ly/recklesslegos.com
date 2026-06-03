import Link from "next/link";
import { Footer } from "@/components/footer";
import { Icons } from "@/components/icons";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { prisma } from "@/lib/db";
import { PeopleClient } from "./people-client";

export default async function PeoplePage() {
  const people = await prisma.person.findMany({
    include: {
      events: true,
    },
  });

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={
            <span>
              <Link href="/">Home</Link> / People involved
            </span>
          }
          title="People involved"
          sub="A reference directory of the public figures and organizations in the record — limited to their public roles and publicly available information. No private contact details are listed."
        >
          <div
            className="card card-pad"
            style={{
              marginTop: 22,
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              maxWidth: 680,
              background: "var(--ink-2)",
            }}
          >
            <Icons.shield
              style={{
                width: 18,
                height: 18,
                color: "var(--amber)",
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <p
              className="body-txt"
              style={{ fontSize: 13.5, margin: 0, color: "var(--tx-2)" }}
            >
              This directory documents only public-facing roles and conduct. It
              contains no home addresses, private contact information, or
              personal details — and in this demo, every individual is
              fictional.
            </p>
          </div>
        </PageHead>
        <PeopleClient people={people} />
      </main>
      <Footer />
    </div>
  );
}
