import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  teachers,
  classes,
  subjects,
  academicYears,
  teachingAssignments,
} from "@/db/schema";
import type { Option } from "@/components/admin/crud-manager";

export async function teacherOptions(schoolId: string): Promise<Option[]> {
  const rows = await db
    .select()
    .from(teachers)
    .where(eq(teachers.schoolId, schoolId))
    .orderBy(asc(teachers.name));
  return rows.map((r) => ({
    value: r.id,
    label: r.nip ? `${r.name} (${r.nip})` : r.name,
  }));
}

export async function classOptions(schoolId: string): Promise<Option[]> {
  const rows = await db
    .select()
    .from(classes)
    .where(eq(classes.schoolId, schoolId))
    .orderBy(asc(classes.name));
  return rows.map((r) => ({ value: r.id, label: r.name }));
}

export async function subjectOptions(schoolId: string): Promise<Option[]> {
  const rows = await db
    .select()
    .from(subjects)
    .where(eq(subjects.schoolId, schoolId))
    .orderBy(asc(subjects.name));
  return rows.map((r) => ({ value: r.id, label: r.name }));
}

export async function academicYearOptions(
  schoolId: string,
): Promise<Option[]> {
  const rows = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.schoolId, schoolId))
    .orderBy(asc(academicYears.name));
  return rows.map((r) => ({
    value: r.id,
    label: `${r.name} — Semester ${r.semester}${r.isActive ? " (aktif)" : ""}`,
  }));
}

/** Assignments as options, labelled "Mapel · Kelas · Guru". */
export async function assignmentOptions(
  schoolId: string,
): Promise<Option[]> {
  const rows = await db
    .select({
      id: teachingAssignments.id,
      subject: subjects.name,
      cls: classes.name,
      teacher: teachers.name,
    })
    .from(teachingAssignments)
    .innerJoin(subjects, eq(teachingAssignments.subjectId, subjects.id))
    .innerJoin(classes, eq(teachingAssignments.classId, classes.id))
    .innerJoin(teachers, eq(teachingAssignments.teacherId, teachers.id))
    .where(eq(subjects.schoolId, schoolId))
    .orderBy(asc(classes.name), asc(subjects.name));
  return rows.map((r) => ({
    value: r.id,
    label: `${r.subject} · ${r.cls} · ${r.teacher}`,
  }));
}
