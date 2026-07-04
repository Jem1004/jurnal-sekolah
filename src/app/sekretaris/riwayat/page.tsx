import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HOME_BY_ROLE } from "@/lib/roles";
import { schoolTeachers } from "@/lib/journal";
import { RoleHeader } from "@/components/role-header";
import { JournalList } from "@/components/journal/journal-list";

export default async function SekretarisRiwayatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SEKRETARIS") {
    redirect(HOME_BY_ROLE[session.user.role] ?? "/login");
  }
  const teachers = await schoolTeachers(session.user.schoolId);

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
        <h1 className="mb-4 text-xl font-bold">Riwayat Jurnal Kelas</h1>
        <JournalList query="" editable teachers={teachers} />
      </main>
    </>
  );
}
