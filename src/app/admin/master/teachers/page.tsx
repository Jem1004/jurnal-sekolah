import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import { CsvImport } from "@/components/admin/csv-import";
import { CrudManager, type Field, type Row } from "@/components/admin/crud-manager";

const fields: Field[] = [
  { name: "name", label: "Nama Guru", type: "text", required: true, placeholder: "Budi Santoso, S.Pd" },
  { name: "nip", label: "NIP", type: "text" },
  { name: "phone", label: "No. HP", type: "text", placeholder: "08xx" },
];

export default async function TeachersPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;
  const rows = (await db
    .select()
    .from(teachers)
    .where(eq(teachers.schoolId, schoolId))
    .orderBy(asc(teachers.name))) as unknown as Row[];

  return (
    <>
      <PageHeader title="Guru" description="Data guru pengajar." />
      <CsvImport
        endpoint="/api/v1/admin/teachers/import"
        title="Impor Guru dari CSV"
        columnsHint="name, nip, phone"
        template={"name,nip,phone\nBudi Santoso, S.Pd,198501012010011001,08123456789\n"}
        templateName="template-guru.csv"
      />
      <CrudManager
        slug="teachers"
        singular="Guru"
        fields={fields}
        initialRows={rows}
        searchKeys={["name", "nip"]}
        searchPlaceholder="Cari nama atau NIP…"
      />
    </>
  );
}
