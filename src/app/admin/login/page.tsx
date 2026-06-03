import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PageHead } from "@/components/page-head";
import { getAdminFromCookie } from "@/lib/admin-auth";
import { LoginClient } from "./login-client";

export default async function AdminLoginPage() {
  const admin = await getAdminFromCookie();
  if (admin) redirect("/admin");

  return (
    <div>
      <Nav />
      <main>
        <PageHead
          crumb={<span>Admin</span>}
          title="Moderator sign in"
          sub="Enter your admin email to receive a 6-digit sign-in code."
        />
        <div
          className="wrap section-sm"
          style={{ paddingTop: 8, maxWidth: 460 }}
        >
          <LoginClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
