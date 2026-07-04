import { redirect } from "next/navigation";
import { and, between, eq, inArray } from "drizzle-orm";
import { CalendarCheck, Clock } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { journalEntries, teachingAssignments } from "@/db/schema";
import { HOME_BY_ROLE } from "@/lib/roles";
import { schoolSettings } from "@/lib/journal";
import { monthRange, todayInTz } from "@/lib/tz";
import { RoleHeader } from "@/components/role-header";
import { TodayBoard } from "@/components/journal/today-board";
import { StatCard } from "@/components/ui/stat-card";

export default async function GuruPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "GURU") {
    redirect(HOME_BY_ROLE[session.user.role] ?? "/login");
  }
  const teacherId = session.user.teacherId;
  const settings = await schoolSettings(session.user.schoolId);
  const { start, end } = monthRange(todayInTz(settings.timezone));

  // JP terlaksana bulan ini (kehadiran HADIR/TERLAMBAT pada penugasan sendiri).
  let jp = 0;
  let meetings = 0;
  if (teacherId) {
    const asgs = await db
      .select({ id: teachingAssignments.id })
      .from(teachingAssignments)
      .where(eq(teachingAssignments.teacherId, teacherId));
    const ids = asgs.map((a) => a.id);
    if (ids.length) {
      const rows = await db
        .select({
          jpCount: journalEntries.jpCount,
          attendance: journalEntries.teacherAttendance,
        })
        .from(journalEntries)
        .where(
          and(
            inArray(journalEntries.teachingAssignmentId, ids),
            between(journalEntries.date, start, end),
          ),
        );
      for (const r of rows) {
        if (r.attendance === "HADIR" || r.attendance === "TERLAMBAT") {
          jp += r.jpCount;
          meetings += 1;
        }
      }
    }
  }

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
      <main className="mx-auto w-full max-w-2xl space-y-5 px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="JP terlaksana bulan ini"
            value={jp}
            icon={Clock}
            tone="default"
          />
          <StatCard
            label="Pertemuan bulan ini"
            value={meetings}
            icon={CalendarCheck}
            tone="default"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Jadwal Mengajar</h2>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <TodayBoard role="GURU" />
        </div>
      </main>
    </>
  );
}
