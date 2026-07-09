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
  FileSpreadsheet,
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
  unfilledSchedulesToday,
} from "@/lib/dashboard";
import { formatLongDate, todayInTz } from "@/lib/tz";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SegmentedMeter } from "@/components/ui/segmented-meter";
import { DarkPanel } from "@/components/ui/dark-panel";

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

  const [
    comp,
    counts,
    guru,
    unfilledScheds,
    nClasses,
    nTeachers,
    nStudents,
    nSubjects,
  ] = await Promise.all([
    completenessToday(schoolId, today),
    monthCounts(schoolId, month, year),
    teacherMonthSummary(schoolId, month, year),
    unfilledSchedulesToday(schoolId, today, 8),
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

  const meterItems = comp.holiday
    ? [{ label: "Hari Libur", value: 100, percentage: 100, tone: "neutral" as const }]
    : [
        {
          label: "Terisi",
          value: comp.filled,
          percentage: comp.percent,
          tone: "success" as const,
          styleType: "solid" as const,
        },
        {
          label: "Belum Diisi",
          value: Math.max(0, comp.scheduled - comp.filled),
          percentage: Math.max(0, 100 - comp.percent),
          tone: "stripes" as const,
          styleType: "stripes" as const,
        },
      ];

  const darkPanelItems = unfilledScheds.map((s) => ({
    id: s.scheduleId,
    title: `${s.className} — Jam ke-${s.periodStart}${s.periodEnd > s.periodStart ? `-${s.periodEnd}` : ""}`,
    subtitle: "Belum ada entri jurnal",
    done: false,
  }));

  return (
    <>
      <PageHeader
        title="Dashboard Admin"
        description={`Pantauan jurnal — ${formatLongDate(today)}`}
      />

      {/* Journal monitoring */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Ringkasan Hari Ini</h2>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Progress & Meter box */}
        <div className="flex flex-col justify-between rounded-[1.5rem] bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <ProgressRing
              percentage={comp.holiday ? 100 : comp.percent}
              label={comp.holiday ? "Libur" : "Terisi"}
              sublabel={
                comp.holiday
                  ? undefined
                  : `${comp.filled} / ${comp.scheduled} Slot`
              }
            />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status KBM Hari Ini</p>
                <p className="text-lg font-semibold text-foreground">
                  {comp.holiday ? "Hari Libur Sekolah" : `${comp.percent}% Jurnal Terisi`}
                </p>
              </div>
              <SegmentedMeter items={meterItems} />
            </div>
          </div>
        </div>

        {/* Quick status cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            label="Guru tidak hadir (bln ini)"
            value={counts.tidakHadir}
            icon={AlertTriangle}
            tone="destructive"
            variant="inline"
          />
          <StatCard
            label="Entri dikoreksi guru"
            value={counts.corrected}
            icon={Pencil}
            tone="info"
            variant="inline"
          />
          <StatCard
            label="Buka Rekap Bulanan →"
            value="Ekspor & Kunci"
            icon={FileSpreadsheet}
            href="/admin/rekap"
            variant="cta"
          />
        </div>

        {/* Dark Panel Checklist */}
        <DarkPanel
          title="Jurnal Belum Diisi"
          countLabel={`${Math.max(0, comp.scheduled - comp.filled)}/${comp.scheduled}`}
          items={darkPanelItems}
          emptyMessage={
            comp.holiday
              ? "Hari libur, tidak ada KBM."
              : comp.scheduled === 0
                ? "Belum ada jadwal KBM hari ini."
                : "Semua kelas sudah terisi hari ini!"
          }
        />
      </div>

      {/* JP per guru bulan ini */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Kinerja Mengajar Bulan Ini</h2>
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <p className="text-sm font-semibold text-foreground">JP Terlaksana per Guru — Bulan Ini</p>
            <Link href="/admin/rekap" className="text-xs font-semibold text-primary hover:underline">
              Rincian di Rekap →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Guru</th>
                  <th className="px-6 py-3">Pertemuan</th>
                  <th className="px-6 py-3">JP Terlaksana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {guru.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                      Belum ada data jurnal bulan ini.
                    </td>
                  </tr>
                )}
                {guru.map((t) => (
                  <tr key={t.teacherId} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-foreground">{t.teacherName}</td>
                    <td className="px-6 py-3.5 tabular-nums">{t.pertemuan}</td>
                    <td className="px-6 py-3.5 tabular-nums font-semibold text-foreground">{t.jp}</td>
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
            variant="inline"
          />
        ))}
      </div>
    </>
  );
}
