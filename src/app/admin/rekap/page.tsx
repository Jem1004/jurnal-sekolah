import { auth } from "@/auth";
import { classOptions } from "@/lib/admin-data";
import { schoolSettings } from "@/lib/journal";
import { todayInTz } from "@/lib/tz";
import { PageHeader } from "@/components/admin/page-header";
import { RekapClient } from "@/components/admin/rekap-client";

export default async function RekapPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;
  const [classes, settings] = await Promise.all([
    classOptions(schoolId),
    schoolSettings(schoolId),
  ]);
  const today = todayInTz(settings.timezone);
  const [year, month] = today.split("-").map(Number);

  return (
    <>
      <PageHeader
        title="Rekap Bulanan"
        description="Rekap per guru, per kelas (jurnal), dan ketidakhadiran. Unduh Excel, cetak PDF, atau kunci bulan."
      />
      <RekapClient classes={classes} defaultMonth={month} defaultYear={year} />
    </>
  );
}
