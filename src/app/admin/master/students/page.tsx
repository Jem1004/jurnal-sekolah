import { count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { students } from "@/db/schema";
import { classOptions } from "@/lib/admin-data";
import { PageHeader } from "@/components/admin/page-header";
import { StudentImport } from "@/components/admin/student-import";
import { CrudManager, type Field } from "@/components/admin/crud-manager";

const fields: Field[] = [
  { name: "name", label: "Nama Siswa", type: "text", required: true },
  { name: "nisn", label: "NISN", type: "text" },
  {
    name: "gender",
    label: "Jenis Kelamin",
    type: "select",
    options: [
      { value: "L", label: "Laki-laki" },
      { value: "P", label: "Perempuan" },
    ],
  },
];

export default async function StudentsPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  // Server-side search: don't ship the whole roster to the client. The table
  // stays empty until the admin types a name/NISN (searched on the server).
  const [totalRow, clsOpts] = await Promise.all([
    db
      .select({ c: count() })
      .from(students)
      .where(eq(students.schoolId, schoolId)),
    classOptions(schoolId),
  ]);
  const total = totalRow[0]?.c ?? 0;

  return (
    <>
      <PageHeader
        title="Siswa"
        description={`${total} siswa terdaftar. Cari nama/NISN, impor via CSV, atau tambah satu per satu.`}
      />
      <StudentImport classes={clsOpts} />
      <CrudManager
        slug="students"
        singular="Siswa"
        fields={fields}
        initialRows={[]}
        requireFilter
        serverSearch
        searchPlaceholder="Cari nama atau NISN…"
      />
    </>
  );
}
