import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { classes } from "@/db/schema";
import { academicYearOptions, teacherOptions } from "@/lib/admin-data";
import { PageHeader } from "@/components/admin/page-header";
import { CrudManager, type Field, type Row } from "@/components/admin/crud-manager";

export default async function ClassesPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const [rows, ayOpts, teacherOpts] = await Promise.all([
    db.select().from(classes).where(eq(classes.schoolId, schoolId)).orderBy(asc(classes.name)),
    academicYearOptions(schoolId),
    teacherOptions(schoolId),
  ]);

  const fields: Field[] = [
    { name: "name", label: "Nama Kelas", type: "text", required: true, placeholder: "VII-A" },
    { name: "gradeLevel", label: "Tingkat", type: "number", required: true, help: "Angka, mis. 7" },
    { name: "academicYearId", label: "Tahun Ajaran", type: "select", required: true, lookup: "academicYears" },
    { name: "homeroomTeacherId", label: "Wali Kelas", type: "select", lookup: "teachers" },
  ];

  return (
    <>
      <PageHeader title="Kelas" description="Rombongan belajar per tahun ajaran." />
      <CrudManager
        slug="classes"
        singular="Kelas"
        fields={fields}
        initialRows={rows as unknown as Row[]}
        lookups={{ academicYears: ayOpts, teachers: teacherOpts }}
      />
    </>
  );
}
