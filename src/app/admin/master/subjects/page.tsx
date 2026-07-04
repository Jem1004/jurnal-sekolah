import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { CsvImport } from "@/components/admin/csv-import";
import { CrudManager, type Field, type Row } from "@/components/admin/crud-manager";

const fields: Field[] = [
  { name: "code", label: "Kode", type: "text", placeholder: "MTK" },
  { name: "name", label: "Nama Mata Pelajaran", type: "text", required: true, placeholder: "Matematika" },
];

export default async function SubjectsPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;
  const rows = (await db
    .select()
    .from(subjects)
    .where(eq(subjects.schoolId, schoolId))
    .orderBy(asc(subjects.name))) as unknown as Row[];

  return (
    <>
      <PageHeader title="Mata Pelajaran" description="Daftar mata pelajaran sekolah." />
      <CsvImport
        endpoint="/api/v1/admin/subjects/import"
        title="Impor Mata Pelajaran dari CSV"
        columnsHint="code, name"
        template={"code,name\nMTK,Matematika\nBIN,Bahasa Indonesia\n"}
        templateName="template-mapel.csv"
      />
      <CrudManager
        slug="subjects"
        singular="Mata Pelajaran"
        fields={fields}
        initialRows={rows}
        searchKeys={["name", "code"]}
        searchPlaceholder="Cari nama atau kode…"
      />
    </>
  );
}
