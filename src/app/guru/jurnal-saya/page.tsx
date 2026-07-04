import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HOME_BY_ROLE } from "@/lib/roles";
import { schoolTeachers } from "@/lib/journal";
import { RoleHeader } from "@/components/role-header";
import { JournalList } from "@/components/journal/journal-list";

export default async function JurnalSayaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "GURU") {
    redirect(HOME_BY_ROLE[session.user.role] ?? "/login");
  }
  const teachers = await schoolTeachers(session.user.schoolId);

  return (
    <>
      <RoleHeader
        title="ASTRO JURNAL"
        subtitle={session.user.name ?? "Guru"}
        nav={[
          { href: "/guru", label: "Beranda" },
          { href: "/guru/jurnal-saya", label: "Jurnal Saya" },
        ]}
      />
      <main className="mx-auto w-full max-w-2xl px-4 py-5">
        <h1 className="mb-1 text-xl font-bold">Jurnal Saya</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Entri mengajar atas nama Anda. Ketuk untuk melengkapi capaian atau
          mengoreksi data.
        </p>
        <JournalList
          query=""
          editable
          teachers={teachers}
          emptyText="Belum ada entri. Jurnal terisi otomatis saat sekretaris mencatat, atau isi sendiri dari Beranda."
        />
      </main>
    </>
  );
}
