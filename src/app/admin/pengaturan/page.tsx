import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { schools, type SchoolSettings } from "@/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm, type SchoolData } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;
  const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));

  const settings = school.settingsJson as SchoolSettings;
  const initial: SchoolData = {
    name: school.name,
    npsn: school.npsn,
    address: school.address,
    settings: {
      input_mode: settings.input_mode,
      auto_lock_day: settings.auto_lock_day,
      timezone: settings.timezone,
    },
  };

  return (
    <>
      <PageHeader
        title="Pengaturan Sekolah"
        description="Identitas sekolah, mode pengisian jurnal, penguncian, dan zona waktu."
      />
      <SettingsForm initial={initial} />
    </>
  );
}
