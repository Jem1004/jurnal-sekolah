import {
  AlertTriangle,
  Pencil,
  FileSpreadsheet,
} from "lucide-react";
import { auth } from "@/auth";
import { schoolSettings } from "@/lib/journal";
import {
  completenessToday,
  monthCounts,
  unfilledSchedulesToday,
} from "@/lib/dashboard";
import { formatLongDate, todayInTz } from "@/lib/tz";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SegmentedMeter } from "@/components/ui/segmented-meter";
import { DarkPanel } from "@/components/ui/dark-panel";

export default async function AdminDashboard() {
  const session = await auth();
  const schoolId = session!.user.schoolId;
  const settings = await schoolSettings(schoolId);
  const today = todayInTz(settings.timezone);
  const [year, month] = today.split("-").map(Number);

  const [comp, counts, unfilledScheds] = await Promise.all([
    completenessToday(schoolId, today),
    monthCounts(schoolId, month, year),
    unfilledSchedulesToday(schoolId, today, 8),
  ]);

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

      {/* Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Summary & Actions (7 Cols) */}
        <div className="space-y-6 lg:col-span-7">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status Pembelajaran Hari Ini
          </h2>
          
          {/* Progress Ring and Composition Meter */}
          <div className="rounded-[1.5rem] bg-card p-6 border border-border/40 shadow-none">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <ProgressRing
                percentage={comp.holiday ? 100 : comp.percent}
                label={comp.holiday ? "Libur" : "Terisi"}
                sublabel={
                  comp.holiday
                    ? undefined
                    : `${comp.filled} / ${comp.scheduled} Slot`
                }
              />
              <div className="flex-1 w-full space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Kepatuhan Pengisian</p>
                  <p className="text-xl font-bold text-foreground">
                    {comp.holiday ? "Hari Libur Sekolah" : `${comp.percent}% Jurnal Terisi`}
                  </p>
                </div>
                <SegmentedMeter items={meterItems} />
              </div>
            </div>
          </div>

          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tindakan & Rekap Bulanan
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="sm:col-span-2">
              <StatCard
                label="Buka Rekap Bulanan →"
                value="Ekspor Laporan & Kunci Jurnal"
                icon={FileSpreadsheet}
                href="/admin/rekap"
                variant="cta"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Action Checklist Panel (5 Cols) */}
        <div className="space-y-6 lg:col-span-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Checklist Tindak Lanjut
          </h2>
          
          <DarkPanel
            title="Jurnal Belum Diisi"
            countLabel={`${Math.max(0, comp.scheduled - comp.filled)}/${comp.scheduled}`}
            items={darkPanelItems}
            emptyMessage={
              comp.holiday
                ? "Hari libur KBM."
                : comp.scheduled === 0
                  ? "Belum ada jadwal KBM hari ini."
                  : "Semua kelas sudah terisi hari ini!"
            }
          />
        </div>
      </div>
    </>
  );
}
