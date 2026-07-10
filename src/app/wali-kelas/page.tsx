import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { HOME_BY_ROLE } from "@/lib/roles";
import { homeroomClass, schoolSettings, schoolTeachers } from "@/lib/journal";
import { completenessToday } from "@/lib/dashboard";
import { reportKetidakhadiran } from "@/lib/reports";
import { formatLongDate, todayInTz } from "@/lib/tz";
import { RoleHeader } from "@/components/role-header";
import { JournalList } from "@/components/journal/journal-list";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function WaliKelasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "WALI_KELAS") {
    redirect(HOME_BY_ROLE[session.user.role] ?? "/login");
  }
  const schoolId = session.user.schoolId;
  const hc = await homeroomClass(session.user as never);

  const settings = await schoolSettings(schoolId);
  const today = todayInTz(settings.timezone);
  const [year, month] = today.split("-").map(Number);

  if (!hc) {
    return (
      <>
        <RoleHeader title="ASTRO JURNAL" subtitle={session.user.name ?? "Wali Kelas"} />
        <main className="mx-auto w-full max-w-2xl px-4 py-6">
          <p className="rounded-2xl bg-warning-muted px-4 py-3 text-sm font-medium text-warning">
            Akun Anda belum ditetapkan sebagai wali kelas mana pun. Hubungi admin.
          </p>
        </main>
      </>
    );
  }

  const [comp, anomali, teachers] = await Promise.all([
    completenessToday(schoolId, today, hc.classId),
    reportKetidakhadiran(schoolId, month, year),
    schoolTeachers(schoolId),
  ]);
  const rows = anomali.rows.filter((r) => r.className === hc.className);

  return (
    <>
      <RoleHeader
        title="ASTRO JURNAL"
        subtitle={`Wali Kelas ${hc.className}`}
      />
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
        <p className="text-sm font-medium text-muted-foreground">{formatLongDate(today)}</p>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label={`Kelengkapan hari ini${!comp.holiday ? ` (${comp.filled}/${comp.scheduled})` : ""}`}
            value={comp.holiday ? "Libur" : `${comp.percent}%`}
            icon={CheckCircle2}
            tone="default"
            variant="inline"
          />
          <StatCard
            label="Anomali bulan ini"
            value={rows.length}
            icon={AlertTriangle}
            tone="destructive"
            variant="inline"
          />
        </div>

        {rows.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-border px-6 py-4">
                <p className="text-sm font-semibold text-foreground">
                  Slot Belum Diisi / Guru Tidak Hadir
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 100).map((r, i) => (
                      <tr key={i} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-3 font-medium text-foreground">{r.date}</td>
                        <td className="px-6 py-3">{r.subject}</td>
                        <td className="px-6 py-3 text-xs text-muted-foreground">
                          Jam {r.jam}
                        </td>
                        <td className="px-6 py-3">
                          {r.status === "TIDAK_HADIR" ? (
                            <Badge tone="danger">Tidak Hadir</Badge>
                          ) : (
                            <Badge tone="warning">Belum Diisi</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Jurnal Kelas {hc.className}
          </h2>
          <JournalList query="" editable={false} teachers={teachers} />
        </div>
      </main>
    </>
  );
}
