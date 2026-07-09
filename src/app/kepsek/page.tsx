import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Pencil,
  Printer,
} from "lucide-react";
import { auth } from "@/auth";
import { HOME_BY_ROLE } from "@/lib/roles";
import { schoolSettings } from "@/lib/journal";
import {
  completenessToday,
  monthCounts,
  teacherMonthSummary,
} from "@/lib/dashboard";
import { MONTH_LABEL, formatLongDate, todayInTz } from "@/lib/tz";
import { RoleHeader } from "@/components/role-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SegmentedMeter } from "@/components/ui/segmented-meter";

export default async function KepsekPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "KEPSEK") {
    redirect(HOME_BY_ROLE[session.user.role] ?? "/login");
  }
  const schoolId = session.user.schoolId;
  const settings = await schoolSettings(schoolId);
  const today = todayInTz(settings.timezone);
  const [year, month] = today.split("-").map(Number);

  const [comp, counts, guru] = await Promise.all([
    completenessToday(schoolId, today),
    monthCounts(schoolId, month, year),
    teacherMonthSummary(schoolId, month, year),
  ]);

  const q = `month=${month}&year=${year}`;

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

  return (
    <>
      <RoleHeader title="ASTRO JURNAL" subtitle="Kepala Sekolah" />
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
        <p className="text-sm font-medium text-muted-foreground">
          {formatLongDate(today)}
        </p>

        {/* Ringkasan Kepatuhan & Progress */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <p className="text-xs font-medium text-muted-foreground">
                    Status Kepatuhan Hari Ini
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {comp.holiday
                      ? "Hari Libur Sekolah"
                      : `${comp.percent}% Jurnal Terisi`}
                  </p>
                </div>
                <SegmentedMeter items={meterItems} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 justify-center">
            <StatCard
              label="Kelengkapan hari ini"
              value={comp.holiday ? "Libur" : `${comp.percent}%`}
              icon={CheckCircle2}
              tone="default"
              variant="inline"
            />
            <StatCard
              label="Tidak hadir (bln ini)"
              value={counts.tidakHadir}
              icon={AlertTriangle}
              tone="destructive"
              variant="inline"
            />
            <StatCard
              label="Dikoreksi guru"
              value={counts.corrected}
              icon={Pencil}
              tone="info"
              variant="inline"
            />
          </div>
        </div>

        {/* Executive Print / Export buttons */}
        <div className="flex flex-wrap gap-2.5">
          <a
            href={`/rekap/cetak?type=guru&${q}`}
            target="_blank"
            className="inline-flex h-11 items-center gap-2.5 rounded-full border border-border bg-card px-5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Printer className="size-4" /> Cetak Rekap Guru
          </a>
          <a
            href={`/rekap/cetak?type=absen&${q}`}
            target="_blank"
            className="inline-flex h-11 items-center gap-2.5 rounded-full border border-border bg-card px-5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Printer className="size-4" /> Cetak Ketidakhadiran
          </a>
          <a
            href={`/api/v1/reports/monthly?type=guru&${q}&format=xlsx`}
            className="inline-flex h-11 items-center gap-2.5 rounded-full border border-border bg-card px-5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            <FileSpreadsheet className="size-4" /> Excel Guru
          </a>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border px-6 py-4">
              <p className="text-sm font-semibold text-foreground">
                JP per Guru — {MONTH_LABEL[month - 1]} {year}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Guru</th>
                    <th className="px-6 py-3">Pertemuan</th>
                    <th className="px-6 py-3">JP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {guru.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                        Belum ada data bulan ini.
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
      </main>
    </>
  );
}
