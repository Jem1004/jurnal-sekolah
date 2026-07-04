import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Pencil, Printer } from "lucide-react";
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

  return (
    <>
      <RoleHeader title="ASTRO JURNAL" subtitle={`Kepala Sekolah`} />
      <main className="mx-auto w-full max-w-2xl space-y-5 px-4 py-5">
        <p className="text-sm text-muted-foreground">{formatLongDate(today)}</p>

        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Kelengkapan hari ini"
            value={comp.holiday ? "Libur" : `${comp.percent}%`}
            icon={CheckCircle2}
            tone="default"
          />
          <StatCard
            label="Tidak hadir (bln ini)"
            value={counts.tidakHadir}
            icon={AlertTriangle}
            tone="destructive"
          />
          <StatCard
            label="Dikoreksi guru"
            value={counts.corrected}
            icon={Pencil}
            tone="info"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">
                JP per Guru — {MONTH_LABEL[month - 1]} {year}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Guru</th>
                    <th className="px-4 py-2 font-medium">Pertemuan</th>
                    <th className="px-4 py-2 font-medium">JP</th>
                  </tr>
                </thead>
                <tbody>
                  {guru.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                        Belum ada data bulan ini.
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

        <div className="flex flex-wrap gap-2">
          <a
            href={`/rekap/cetak?type=guru&${q}`}
            target="_blank"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-secondary"
          >
            <Printer className="h-4 w-4" /> Cetak Rekap Guru
          </a>
          <a
            href={`/rekap/cetak?type=absen&${q}`}
            target="_blank"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-secondary"
          >
            <Printer className="h-4 w-4" /> Cetak Ketidakhadiran
          </a>
          <a
            href={`/api/v1/reports/monthly?type=guru&${q}&format=xlsx`}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-secondary"
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel Guru
          </a>
        </div>
      </main>
    </>
  );
}
