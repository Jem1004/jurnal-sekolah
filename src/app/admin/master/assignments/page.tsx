import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { teachingAssignments } from "@/db/schema";
import {
  academicYearOptions,
  classOptions,
  subjectOptions,
  teacherOptions,
} from "@/lib/admin-data";
import { PageHeader } from "@/components/admin/page-header";
import { BulkAssign } from "@/components/admin/bulk-assign";
import { CrudManager, type Field, type Row } from "@/components/admin/crud-manager";

export default async function AssignmentsPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const [rows, ayOpts, teacherOpts, subjectOpts, classOpts] = await Promise.all([
    db.select().from(teachingAssignments).orderBy(asc(teachingAssignments.createdAt)),
    academicYearOptions(schoolId),
    teacherOptions(schoolId),
    subjectOptions(schoolId),
    classOptions(schoolId),
  ]);

  const fields: Field[] = [
    { name: "academicYearId", label: "Tahun Ajaran", type: "select", required: true, lookup: "academicYears" },
    { name: "classId", label: "Kelas", type: "select", required: true, lookup: "classes" },
    { name: "subjectId", label: "Mata Pelajaran", type: "select", required: true, lookup: "subjects" },
    { name: "teacherId", label: "Guru", type: "select", required: true, lookup: "teachers" },
  ];

  return (
    <>
      <PageHeader
        title="Penugasan Mengajar"
        description="Siapa mengajar mapel apa di kelas mana. Dipakai untuk menyusun jadwal."
        action={
          <BulkAssign
            academicYears={ayOpts}
            teachers={teacherOpts}
            subjects={subjectOpts}
            classes={classOpts}
          />
        }
      />
      <CrudManager
        slug="assignments"
        singular="Penugasan"
        fields={fields}
        initialRows={rows as unknown as Row[]}
        lookups={{
          academicYears: ayOpts,
          teachers: teacherOpts,
          subjects: subjectOpts,
          classes: classOpts,
        }}
        requireFilter
        filters={[
          { key: "classId", label: "Kelas", lookup: "classes" },
          { key: "teacherId", label: "Guru", lookup: "teachers" },
          { key: "subjectId", label: "Mapel", lookup: "subjects" },
        ]}
      />
    </>
  );
}
