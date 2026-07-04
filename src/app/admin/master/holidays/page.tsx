import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { CrudManager, type Field, type Row } from "@/components/admin/crud-manager";

const fields: Field[] = [
  { name: "date", label: "Tanggal", type: "date", required: true },
  { name: "description", label: "Keterangan", type: "text", required: true, placeholder: "HUT Kemerdekaan RI" },
];

export default async function HolidaysPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;
  const rows = (await db
    .select()
    .from(holidays)
    .where(eq(holidays.schoolId, schoolId))
    .orderBy(asc(holidays.date))) as unknown as Row[];

  return (
    <>
      <PageHeader
        title="Hari Libur"
        description="Tanggal libur tidak dihitung sebagai jurnal yang belum diisi."
      />
      <CrudManager slug="holidays" singular="Hari Libur" fields={fields} initialRows={rows} />
    </>
  );
}
