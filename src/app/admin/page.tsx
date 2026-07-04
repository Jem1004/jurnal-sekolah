import Link from "next/link";
import { count, eq } from "drizzle-orm";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Library,
  Pencil,
  School,
  UsersRound,
  BookOpenCheck,
} from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  classes,
  teachers,
  students,
  subjects,
  teachingAssignments,
  schedules,
} from "@/db/schema";
import { schoolSettings } from "@/lib/journal";
import {
  completenessToday,
  monthCounts,
  teacherMonthSummary,
} from "@/lib/dashboard";
import { formatLongDate, todayInTz } from "@/lib/tz";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countWhere(table: any, schoolId: string) {
  const [{ c }] = await db
    .select({ c: count() })
    .from(table)
    .where(eq(table.schoolId, schoolId));
  return c;
}

export default async function AdminDashboard() {
  const session = await auth();
  const schoolId = session!.user.schoolId;
  const settings = await schoolSettings(schoolId);
  const today = todayInTz(settings.timezone);
  const [year, month] = today.split("-").map(Number);

  const [comp, counts, guru, nClasses, nTeachers, nStudents, nSubjects] =
    await Promise.all([
      completenessToday(schoolId, today),
      monthCounts(schoolId, month, year),
      teacherMonthSummary(schoolId, month, year),
      countWhere(classes, schoolId),
      countWhere(teachers, schoolId),
      countWhere(students, schoolId),
      countWhere(subjects, schoolId),
    ]);
  const [{ c: nAssignments }] = await db
    .select({ c: count() })
    .from(teachingAssignments);
  const [{ c: nSchedules }] = await db.select({ c: count() }).from(schedules);

  const stats = [
    { label: "Kelas", value: nClasses, icon: School, href: "/admin/master/classes" },
    { label: "Guru", value: nTeachers, icon: GraduationCap, href: "/admin/master/teachers" },
    { label: "Siswa", value: nStudents, icon: UsersRound, href: "/admin/master/students" },
    { label: "Mata Pelajaran", value: nSubjects, icon: Library, href: "/admin/master/subjects" },
    { label: "Penugasan", value: nAssignments, icon: BookOpenCheck, href: "/admin/master/assignments" },
    { label: "Slot Jadwal", value: nSchedules, icon: CalendarDays, href: "/admin/jadwal" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard Admin"
        description={`Pantauan jurnal — ${formatLongDate(today)}`}
      />

      {/* Journal monitoring */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Ringkasan Hari Ini</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={`Kelengkapan hari ini${!comp.holiday ? ` (${comp.filled}/${comp.scheduled})` : ""}`}
          value={comp.holiday ? "Libur" : `${comp.percent}%`}
          icon={CheckCircle2}
          tone="default"
        />
        <StatCard
          label="Guru tidak hadir (bln ini)"
          value={counts.tidakHadir}
          icon={AlertTriangle}
          tone="destructive"
        />
        <StatCard
          label="Entri dikoreksi guru"
          value={counts.corrected}
          icon={Pencil}
          tone="info"
        />
        <Link href="/admin/rekap" className="block h-full">
          <Card className="h-full border-primary bg-primary-muted transition-colors hover:border-primary/80">
            <CardContent className="flex h-full flex-col justify-center p-4">
              <CalendarDays className="mb-2 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">Buka Rekap Bulanan →</p>
              <p className="text-xs text-muted-foreground">Excel / PDF / Kunci</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* JP per guru bulan ini */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Kinerja Mengajar Bulan Ini</h2>
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">JP Terlaksana per Guru — Bulan Ini</p>
            <Link href="/admin/rekap" className="text-xs font-medium text-primary hover:underline">
              Rincian di Rekap →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Guru</th>
                  <th className="px-4 py-2 font-medium">Pertemuan</th>
                  <th className="px-4 py-2 font-medium">JP Terlaksana</th>
                </tr>
              </thead>
              <tbody>
                {guru.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      Belum ada data jurnal bulan ini.
                    </td>
                  </tr>
                )}
                {guru.map((t) => (
                  <tr key={t.teacherId} className="border-t border-border">
                    <td className="px-4 py-2">{t.teacherName}</td>
                    <td className="px-4 py-2">{t.pertemuan}</td>
                    <td className="px-4 py-2">{t.jp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Master data counts */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Data Master</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            href={s.href}
          />
        ))}
      </div>
    </>
  );
}
