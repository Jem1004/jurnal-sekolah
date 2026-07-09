import { and, asc, between, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  classes,
  schedules,
  holidays,
  journalEntries,
  teachers,
  teachingAssignments,
} from "@/db/schema";
import { dayOfWeekOf, monthRange } from "@/lib/tz";

/** Journal completeness for a given date (scheduled KBM slots vs filled). */
export async function completenessToday(
  schoolId: string,
  date: string,
  classId?: string,
) {
  const [hol] = await db
    .select({ id: holidays.id })
    .from(holidays)
    .where(and(eq(holidays.schoolId, schoolId), eq(holidays.date, date)));
  if (hol) return { scheduled: 0, filled: 0, percent: 100, holiday: true };

  const dow = dayOfWeekOf(date);
  const schedConds = [
    eq(classes.schoolId, schoolId),
    eq(schedules.dayOfWeek, dow),
  ];
  if (classId) schedConds.push(eq(schedules.classId, classId));
  const [{ c: scheduled }] = await db
    .select({ c: count() })
    .from(schedules)
    .innerJoin(classes, eq(schedules.classId, classes.id))
    .where(and(...schedConds));

  const entryConds = [
    eq(journalEntries.schoolId, schoolId),
    eq(journalEntries.date, date),
  ];
  if (classId) entryConds.push(eq(journalEntries.classId, classId));
  const [{ c: filled }] = await db
    .select({ c: count() })
    .from(journalEntries)
    .where(and(...entryConds));

  return {
    scheduled,
    filled,
    percent: scheduled ? Math.min(100, Math.round((filled / scheduled) * 100)) : 100,
    holiday: false,
  };
}

/** Month counts: Tidak Hadir entries and teacher-corrected entries. */
export async function monthCounts(
  schoolId: string,
  month: number,
  year: number,
  classId?: string,
) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const { end } = monthRange(start);

  const base = [
    eq(journalEntries.schoolId, schoolId),
    between(journalEntries.date, start, end),
  ];
  if (classId) base.push(eq(journalEntries.classId, classId));

  const [{ c: tidakHadir }] = await db
    .select({ c: count() })
    .from(journalEntries)
    .where(and(...base, eq(journalEntries.teacherAttendance, "TIDAK_HADIR")));

  const [{ c: corrected }] = await db
    .select({ c: count() })
    .from(journalEntries)
    .where(and(...base, eq(journalEntries.correctedByTeacher, true)));

  return { tidakHadir, corrected };
}

/**
 * Lightweight per-teacher summary for the month (single GROUP BY) — pertemuan
 * & JP terlaksana only. The full planned-vs-realized breakdown lives in Rekap.
 */
export async function teacherMonthSummary(
  schoolId: string,
  month: number,
  year: number,
) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const { end } = monthRange(start);

  const rows = await db
    .select({
      teacherId: teachers.id,
      teacherName: teachers.name,
      pertemuan: count(),
      jp: sql<number>`coalesce(sum(${journalEntries.jpCount}), 0)`,
    })
    .from(journalEntries)
    .innerJoin(
      teachingAssignments,
      eq(journalEntries.teachingAssignmentId, teachingAssignments.id),
    )
    .innerJoin(teachers, eq(teachingAssignments.teacherId, teachers.id))
    .where(
      and(
        eq(journalEntries.schoolId, schoolId),
        between(journalEntries.date, start, end),
        inArray(journalEntries.teacherAttendance, ["HADIR", "TERLAMBAT"]),
      ),
    )
    .groupBy(teachers.id, teachers.name)
    .orderBy(asc(teachers.name));

  return rows.map((r) => ({
    teacherId: r.teacherId,
    teacherName: r.teacherName,
    pertemuan: Number(r.pertemuan),
    jp: Number(r.jp),
  }));
}

/**
 * Returns today's scheduled classes that do not yet have a journal entry.
 */
export async function unfilledSchedulesToday(
  schoolId: string,
  date: string,
  limit = 8,
) {
  const dow = dayOfWeekOf(date);

  const allScheds = await db
    .select({
      scheduleId: schedules.id,
      className: classes.name,
      periodStart: schedules.periodNoStart,
      periodEnd: schedules.periodNoEnd,
    })
    .from(schedules)
    .innerJoin(classes, eq(schedules.classId, classes.id))
    .where(and(eq(classes.schoolId, schoolId), eq(schedules.dayOfWeek, dow)));

  const filledRows = await db
    .select({ scheduleId: journalEntries.scheduleId })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.schoolId, schoolId),
        eq(journalEntries.date, date),
      ),
    );

  const filledSet = new Set(
    filledRows.map((r) => r.scheduleId).filter(Boolean),
  );

  const unfilled = allScheds.filter((s) => !filledSet.has(s.scheduleId));
  return unfilled.slice(0, limit);
}

