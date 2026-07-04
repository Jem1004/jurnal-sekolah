import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { academicYears } from "@/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { CrudManager, type Field, type Row } from "@/components/admin/crud-manager";

const fields: Field[] = [
  { name: "name", label: "Nama Tahun Ajaran", type: "text", required: true, placeholder: "2026/2027" },
  { name: "semester", label: "Semester", type: "number", required: true, help: "Isi 1 atau 2" },
  { name: "startDate", label: "Tanggal Mulai", type: "date" },
  { name: "endDate", label: "Tanggal Selesai", type: "date" },
  { name: "isActive", label: "Tahun ajaran aktif", type: "boolean" },
];

export default async function AcademicYearsPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;
  const rows = (await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.schoolId, schoolId))
    .orderBy(asc(academicYears.name))) as unknown as Row[];

  return (
    <>
      <PageHeader
        title="Tahun Ajaran"
        description="Kelola tahun ajaran & semester. Tandai satu sebagai aktif."
      />
      <CrudManager
        slug="academic-years"
        singular="Tahun Ajaran"
        fields={fields}
        initialRows={rows}
      />
    </>
  );
}
