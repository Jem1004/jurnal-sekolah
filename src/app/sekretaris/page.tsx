import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HOME_BY_ROLE } from "@/lib/roles";
import { RoleHeader } from "@/components/role-header";
import { TodayBoard } from "@/components/journal/today-board";

export default async function SekretarisPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SEKRETARIS") {
    redirect(HOME_BY_ROLE[session.user.role] ?? "/login");
  }

  return (
    <>
      <RoleHeader
        title="ASTRO JURNAL"
        subtitle={session.user.name ?? "Sekretaris"}
        nav={[
          { href: "/sekretaris", label: "Hari Ini" },
          { href: "/sekretaris/riwayat", label: "Riwayat" },
        ]}
      />
      <main className="mx-auto w-full max-w-2xl px-4 py-5">
        <TodayBoard role="SEKRETARIS" />
      </main>
    </>
  );
}
