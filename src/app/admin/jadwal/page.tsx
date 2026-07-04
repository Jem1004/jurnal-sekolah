import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  classes,
  subjects,
  teachers,
  teachingAssignments,
  periodTemplates,
  schedules,
} from "@/db/schema";
import { PageHeader } from "@/components/admin/page-header";
import {
  ScheduleGrid,
  type Asg,
  type Cls,
  type Sch,
  type Tpl,
} from "@/components/admin/schedule-grid";

export default async function JadwalPage() {
  const session = await auth();
  const schoolId = session!.user.schoolId;

  const classRows = await db
    .select()
    .from(classes)
    .where(eq(classes.schoolId, schoolId))
    .orderBy(asc(classes.name));

  const asgRows = await db
    .select({
      id: teachingAssignments.id,
      classId: teachingAssignments.classId,
      subject: subjects.name,
      teacher: teachers.name,
    })
    .from(teachingAssignments)
    .innerJoin(subjects, eq(teachingAssignments.subjectId, subjects.id))
    .innerJoin(teachers, eq(teachingAssignments.teacherId, teachers.id))
    .where(eq(subjects.schoolId, schoolId));

  const tplRows = await db
    .select({
      dayOfWeek: periodTemplates.dayOfWeek,
      periodNo: periodTemplates.periodNo,
      startTime: periodTemplates.startTime,
    })
    .from(periodTemplates)
    .where(
      and(
        eq(periodTemplates.schoolId, schoolId),
        eq(periodTemplates.type, "KBM"),
      ),
    );

  const schedRows = await db
    .select({
      id: schedules.id,
      classId: schedules.classId,
      dayOfWeek: schedules.dayOfWeek,
      periodNoStart: schedules.periodNoStart,
      periodNoEnd: schedules.periodNoEnd,
      teachingAssignmentId: schedules.teachingAssignmentId,
    })
    .from(schedules)
    .innerJoin(classes, eq(schedules.classId, classes.id))
    .where(eq(classes.schoolId, schoolId));

  const classData: Cls[] = classRows.map((c) => ({
    id: c.id,
    name: c.name,
    academicYearId: c.academicYearId,
  }));
  const assignments: Asg[] = asgRows.map((a) => ({
    id: a.id,
    classId: a.classId,
    label: `${a.subject} — ${a.teacher}`,
    short: `${a.subject} · ${a.teacher.split(",")[0].split(" ")[0]}`,
  }));

  return (
    <>
      <PageHeader
        title="Jadwal Pelajaran"
        description="Susun jadwal mingguan per kelas. Klik + untuk mengisi slot."
      />
      {classData.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Belum ada kelas. Tambahkan kelas terlebih dahulu.
        </p>
      ) : (
        <ScheduleGrid
          classes={classData}
          assignments={assignments}
          templates={tplRows as Tpl[]}
          schedules={schedRows as Sch[]}
        />
      )}
    </>
  );
}
