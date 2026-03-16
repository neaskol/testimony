import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/actions/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: profile, error } = await getCurrentProfile();

  if (error || !profile) {
    redirect("/login");
  }

  if (profile.role === "translator") {
    redirect("/translator/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={profile.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header profile={profile} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
