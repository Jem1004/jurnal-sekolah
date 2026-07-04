import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, students } from "@/db/schema";
import { teacherOptions } from "@/lib/admin-data";
import { ROLE_LABEL } from "@/lib/roles";
import { PageHeader } from "@/components/admin/page-header";
import {
  CrudManager,
  type Field,
  type Option,
  type Row,
} from "@/components/admin/crud-manager";

export default async function UsersPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const [rows, teacherOpts, studentRows] = await Promise.all([
    db.select().from(users).where(eq(users.schoolId, schoolId)).orderBy(asc(users.name)),
    teacherOptions(schoolId),
    db.select().from(students).where(eq(students.schoolId, schoolId)).orderBy(asc(students.name)),
  ]);
  const studentOpts: Option[] = studentRows.map((s) => ({ value: s.id, label: s.name }));

  const roleOptions: Option[] = (
    Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[]
  ).map((r) => ({ value: r, label: ROLE_LABEL[r] }));

  const fields: Field[] = [
    { name: "name", label: "Nama", type: "text", required: true },
    { name: "username", label: "Username", type: "text", required: true, help: "Huruf kecil, angka, . _ -" },
    { name: "password", label: "Password", type: "password", createOnly: true, required: true, help: "Minimal 6 karakter" },
    { name: "role", label: "Peran", type: "select", required: true, options: roleOptions },
    { name: "email", label: "Email", type: "text", hideInTable: true },
    { name: "teacherId", label: "Tautkan ke Guru (opsional)", type: "select", options: teacherOpts, hideInTable: true },
    { name: "studentId", label: "Tautkan ke Siswa (opsional)", type: "select", options: studentOpts, hideInTable: true },
    { name: "isActive", label: "Aktif", type: "boolean" },
  ];

  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Akun login. Sekretaris & guru cukup username tanpa email."
      />
      <CrudManager
        slug="users"
        singular="Pengguna"
        fields={fields}
        initialRows={rows as unknown as Row[]}
      />
    </>
  );
}
