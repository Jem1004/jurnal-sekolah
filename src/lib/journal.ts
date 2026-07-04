import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  schools,
  classes,
  classMembers,
  subjects,
  teachers,
  teachingAssignments,
  schedules,
  periodTemplates,
  holidays,
  journalEntries,
  auditLogs,
  users,
  type SchoolSettings,
} from "@/db/schema";
import { ApiError, mapDbError, type SessionUser } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { journalCreate, journalUpdate } from "@/lib/validation";
import { dayOfWeekOf } from "@/lib/tz";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PRESENT = ["HADIR", "TERLAMBAT", "DIGANTI", "TUGAS_MANDIRI"];

const DEFAULT_SETTINGS: SchoolSettings = {
  input_mode: "AB",
  auto_lock_day: 5,
  timezone: "Asia/Makassar",
};

export async function schoolSettings(schoolId: string): Promise<SchoolSettings> {
  if (!schoolId) return DEFAULT_SETTINGS;
  const [s] = await db.select().from(schools).where(eq(schools.id, schoolId));
  if (!s) return DEFAULT_SETTINGS;
  return (s.settingsJson as SchoolSettings) || DEFAULT_SETTINGS;
}

/** The class this secretary user manages, or null. */
export async function secretaryClass(session: SessionUser) {
  if (!session.studentId) return null;
  const [m] = await db
    .select({
      classId: classMembers.classId,
      academicYearId: classes.academicYearId,
      className: classes.name,
    })
    .from(classMembers)
    .innerJoin(classes, eq(classMembers.classId, classes.id))
    .where(
      and(
        eq(classMembers.studentId, session.studentId),
        eq(classMembers.isSecretary, true),
      ),
    );
  return m ?? null;
}

/** The class this teacher is homeroom (wali kelas) of, or null. */
export async function homeroomClass(session: SessionUser) {
  if (!session.teacherId) return null;
  const [c] = await db
    .select({ classId: classes.id, className: classes.name })
    .from(classes)
    .where(
      and(
        eq(classes.schoolId, session.schoolId),
        eq(classes.homeroomTeacherId, session.teacherId),
      ),
    );
  return c ?? null;
}

export async function schoolTeachers(schoolId: string) {
  return db
    .select({ id: teachers.id, name: teachers.name })
    .from(teachers)
    .where(eq(teachers.schoolId, schoolId))
    .orderBy(asc(teachers.name));
}

/** Slots (scheduled lessons) for a date, with any existing journal entry. */
export async function daySlots(opts: {
  schoolId: string;
  date: string;
  classId?: string;
  teacherId?: string;
}) {
  const { schoolId, date } = opts;
  const dow = dayOfWeekOf(date);

  const [holiday] = await db
    .select()
    .from(holidays)
    .where(and(eq(holidays.schoolId, schoolId), eq(holidays.date, date)));

  const conds: any[] = [
    eq(classes.schoolId, schoolId),
    eq(schedules.dayOfWeek, dow),
  ];
  if (opts.classId) conds.push(eq(schedules.classId, opts.classId));
  if (opts.teacherId)
    conds.push(eq(teachingAssignments.teacherId, opts.teacherId));

  const schedRows = await db
    .select({
      scheduleId: schedules.id,
      classId: schedules.classId,
      className: classes.name,
      academicYearId: schedules.academicYearId,
      periodNoStart: schedules.periodNoStart,
      periodNoEnd: schedules.periodNoEnd,
      assignmentId: schedules.teachingAssignmentId,
      subject: subjects.name,
      teacherId: teachers.id,
      teacher: teachers.name,
    })
    .from(schedules)
    .innerJoin(classes, eq(schedules.classId, classes.id))
    .innerJoin(
      teachingAssignments,
      eq(schedules.teachingAssignmentId, teachingAssignments.id),
    )
    .innerJoin(subjects, eq(teachingAssignments.subjectId, subjects.id))
    .innerJoin(teachers, eq(teachingAssignments.teacherId, teachers.id))
    .where(and(...conds))
    .orderBy(asc(classes.name), asc(schedules.periodNoStart));

  // Period template time map for the day.
  const tpls = await db
    .select()
    .from(periodTemplates)
    .where(
      and(
        eq(periodTemplates.schoolId, schoolId),
        eq(periodTemplates.dayOfWeek, dow),
      ),
    );
  const timeByPeriod = new Map<number, { start: string; end: string }>();
  for (const t of tpls)
    timeByPeriod.set(t.periodNo, { start: t.startTime, end: t.endTime });

  // Existing entries for the date within scope.
  const entryConds: any[] = [
    eq(journalEntries.schoolId, schoolId),
    eq(journalEntries.date, date),
  ];
  if (opts.classId) entryConds.push(eq(journalEntries.classId, opts.classId));
  const entryRows = await db
    .select()
    .from(journalEntries)
    .where(and(...entryConds));
  const entryByKey = new Map<string, (typeof entryRows)[number]>();
  for (const e of entryRows)
    entryByKey.set(`${e.classId}-${e.periodNoStart}`, e);

  const slots = schedRows.map((s) => {
    const e = entryByKey.get(`${s.classId}-${s.periodNoStart}`) ?? null;
    return {
      scheduleId: s.scheduleId,
      classId: s.classId,
      className: s.className,
      assignmentId: s.assignmentId,
      periodNoStart: s.periodNoStart,
      periodNoEnd: s.periodNoEnd,
      startTime: timeByPeriod.get(s.periodNoStart)?.start ?? null,
      endTime: timeByPeriod.get(s.periodNoEnd)?.end ?? null,
      subject: s.subject,
      teacherId: s.teacherId,
      teacher: s.teacher,
      entry: e
        ? {
            id: e.id,
            status: e.status,
            teacherAttendance: e.teacherAttendance,
            topic: e.topic,
            achievement: e.achievement,
            correctedByTeacher: e.correctedByTeacher,
          }
        : null,
    };
  });

  return {
    date,
    dayOfWeek: dow,
    holiday: holiday ? holiday.description : null,
    slots,
  };
}

/** Full entry detail incl. absences and labels. */
export async function getEntryDetail(id: string) {
  const [row] = await db
    .select({
      e: journalEntries,
      subject: subjects.name,
      className: classes.name,
      teacher: teachers.name,
      filledBy: users.name,
    })
    .from(journalEntries)
    .leftJoin(
      teachingAssignments,
      eq(journalEntries.teachingAssignmentId, teachingAssignments.id),
    )
    .leftJoin(subjects, eq(teachingAssignments.subjectId, subjects.id))
    .leftJoin(teachers, eq(teachingAssignments.teacherId, teachers.id))
    .innerJoin(classes, eq(journalEntries.classId, classes.id))
    .innerJoin(users, eq(journalEntries.filledByUserId, users.id))
    .where(eq(journalEntries.id, id));
  if (!row) return null;

  return {
    ...row.e,
    subject: row.subject,
    className: row.className,
    teacher: row.teacher,
    filledByName: row.filledBy,
  };
}

function jpFor(
  attendance: string | null,
  activityType: string,
  blockLen: number,
) {
  if (activityType !== "KBM") return 0;
  if (!attendance || attendance === "TIDAK_HADIR") return 0;
  return blockLen;
}

function enforceMode(role: string, mode: SchoolSettings["input_mode"]) {
  if (role === "ADMIN") return;
  if (role === "SEKRETARIS" && mode === "B") {
    throw new ApiError(403, "Sekolah memakai Mode B: hanya guru yang mengisi.");
  }
  if (role === "GURU" && mode === "A") {
    throw new ApiError(
      403,
      "Sekolah memakai Mode A: pengisian oleh sekretaris kelas.",
    );
  }
}

export async function createEntry(session: SessionUser, body: unknown) {
  const data = journalCreate.parse(body);
  const settings = await schoolSettings(session.schoolId);
  enforceMode(session.role, settings.input_mode);

  let classId: string;
  let academicYearId: string;
  let assignmentId: string | null = null;
  let periodNoStart: number;
  let periodNoEnd: number;
  let activityType = data.activityType ?? "KBM";

  if (data.scheduleId) {
    const [s] = await db
      .select({
        classId: schedules.classId,
        academicYearId: schedules.academicYearId,
        periodNoStart: schedules.periodNoStart,
        periodNoEnd: schedules.periodNoEnd,
        assignmentId: schedules.teachingAssignmentId,
        teacherId: teachingAssignments.teacherId,
      })
      .from(schedules)
      .innerJoin(
        teachingAssignments,
        eq(schedules.teachingAssignmentId, teachingAssignments.id),
      )
      .where(eq(schedules.id, data.scheduleId));
    if (!s) throw new ApiError(404, "Jadwal tidak ditemukan.");
    classId = s.classId;
    academicYearId = s.academicYearId;
    assignmentId = s.assignmentId;
    periodNoStart = s.periodNoStart;
    periodNoEnd = s.periodNoEnd;
    activityType = "KBM";

    await authorizeForClassOrTeacher(session, classId, s.teacherId);
  } else {
    // Insidental / non-KBM entry.
    if (!data.classId || data.periodNoStart == null || data.periodNoEnd == null) {
      throw new ApiError(
        400,
        "Untuk entri tanpa jadwal, sertakan classId, periodNoStart, periodNoEnd.",
      );
    }
    const [cls] = await db
      .select()
      .from(classes)
      .where(
        and(eq(classes.id, data.classId), eq(classes.schoolId, session.schoolId)),
      );
    if (!cls) throw new ApiError(404, "Kelas tidak ditemukan.");
    classId = cls.id;
    academicYearId = cls.academicYearId;
    periodNoStart = data.periodNoStart;
    periodNoEnd = data.periodNoEnd;
    await authorizeForClassOrTeacher(session, classId, null);
  }

  const blockLen = periodNoEnd - periodNoStart + 1;
  const attendance = data.teacherAttendance ?? null;
  const jpCount = jpFor(attendance, activityType, blockLen);

  let entryId: string;
  try {
    const [row] = await db
      .insert(journalEntries)
      .values({
        schoolId: session.schoolId,
        academicYearId,
        classId,
        date: data.date,
        scheduleId: data.scheduleId ?? null,
        teachingAssignmentId: assignmentId,
        periodNoStart,
        periodNoEnd,
        jpCount,
        teacherAttendance: attendance as any,
        substituteTeacherId: data.substituteTeacherId ?? null,
        topic: data.topic ?? null,
        achievement: data.achievement ?? null,
        notes: data.notes ?? null,
        absentCount: data.absentCount ?? null,
        activityType: activityType as any,
        status: "TERCATAT",
        filledByUserId: session.id,
      })
      .returning({ id: journalEntries.id });
    entryId = row.id;
  } catch (e) {
    mapDbError(e); // 23505 -> "slot sudah terisi"
    throw e;
  }

  await writeAudit({
    userId: session.id,
    action: "create",
    entity: "journal_entry",
    entityId: entryId,
    diff: { date: data.date, classId, periodNoStart, attendance, jpCount },
  });

  return getEntryDetail(entryId);
}

export async function updateEntry(
  session: SessionUser,
  id: string,
  body: unknown,
) {
  const [entry] = await db
    .select({
      e: journalEntries,
      asgTeacher: teachingAssignments.teacherId,
    })
    .from(journalEntries)
    .leftJoin(
      teachingAssignments,
      eq(journalEntries.teachingAssignmentId, teachingAssignments.id),
    )
    .where(eq(journalEntries.id, id));
  if (!entry) throw new ApiError(404, "Entri tidak ditemukan.");
  if (entry.e.schoolId !== session.schoolId)
    throw new ApiError(403, "Bukan milik sekolah Anda.");
  if (entry.e.status === "TERKUNCI") {
    throw new ApiError(
      403,
      "Entri sudah terkunci. Minta admin membuka kunci untuk mengubah.",
    );
  }

  // Authorization
  const isRelatedTeacher =
    session.role === "GURU" &&
    (entry.asgTeacher === session.teacherId ||
      entry.e.substituteTeacherId === session.teacherId);
  if (session.role === "ADMIN") {
    // ok
  } else if (session.role === "SEKRETARIS") {
    const sc = await secretaryClass(session);
    if (!sc || sc.classId !== entry.e.classId)
      throw new ApiError(403, "Bukan kelas Anda.");
  } else if (session.role === "GURU") {
    if (!isRelatedTeacher)
      throw new ApiError(403, "Entri ini di luar penugasan Anda.");
  } else {
    throw new ApiError(403, "Anda tidak berhak mengubah entri ini.");
  }

  const data = journalUpdate.parse(body);
  const set: Record<string, unknown> = { lastEditedByUserId: session.id, updatedAt: new Date() };

  if (data.teacherAttendance !== undefined) {
    set.teacherAttendance = data.teacherAttendance;
    const blockLen = entry.e.periodNoEnd - entry.e.periodNoStart + 1;
    set.jpCount = jpFor(
      data.teacherAttendance,
      entry.e.activityType,
      blockLen,
    );
  }
  if (data.substituteTeacherId !== undefined)
    set.substituteTeacherId = data.substituteTeacherId;
  if (data.topic !== undefined) set.topic = data.topic;
  if (data.achievement !== undefined) set.achievement = data.achievement;
  if (data.notes !== undefined) set.notes = data.notes;
  if (data.absentCount !== undefined) set.absentCount = data.absentCount;
  if (data.activityType !== undefined) set.activityType = data.activityType;

  // "Koreksi" = a related teacher changed factual data (not just capaian/notes).
  const changedData =
    data.teacherAttendance !== undefined ||
    data.topic !== undefined ||
    data.substituteTeacherId !== undefined ||
    data.absentCount !== undefined ||
    data.activityType !== undefined;
  if (isRelatedTeacher && changedData) set.correctedByTeacher = true;

  await db.update(journalEntries).set(set).where(eq(journalEntries.id, id));

  await writeAudit({
    userId: session.id,
    action: "update",
    entity: "journal_entry",
    entityId: id,
    diff: {
      by: session.role,
      changes: Object.keys(set).filter(
        (k) => !["lastEditedByUserId", "updatedAt"].includes(k),
      ),
    },
  });

  return getEntryDetail(id);
}

async function authorizeForClassOrTeacher(
  session: SessionUser,
  classId: string,
  slotTeacherId: string | null,
) {
  if (session.role === "ADMIN") return;
  if (session.role === "SEKRETARIS") {
    const sc = await secretaryClass(session);
    if (!sc || sc.classId !== classId)
      throw new ApiError(403, "Anda hanya bisa mengisi jurnal kelas Anda.");
    return;
  }
  if (session.role === "GURU") {
    if (slotTeacherId && slotTeacherId === session.teacherId) return;
    throw new ApiError(403, "Slot ini di luar penugasan mengajar Anda.");
  }
  throw new ApiError(403, "Anda tidak berhak membuat entri.");
}

export async function listEntries(
  session: SessionUser,
  params: URLSearchParams,
) {
  const conds: any[] = [eq(journalEntries.schoolId, session.schoolId)];

  const dateFrom = params.get("date_from");
  const dateTo = params.get("date_to");
  const classId = params.get("class_id");
  const attendance = params.get("attendance");
  if (dateFrom) conds.push(gte(journalEntries.date, dateFrom));
  if (dateTo) conds.push(lte(journalEntries.date, dateTo));
  if (attendance) conds.push(eq(journalEntries.teacherAttendance, attendance as any));

  // Role scoping
  if (session.role === "SEKRETARIS") {
    const sc = await secretaryClass(session);
    conds.push(eq(journalEntries.classId, sc?.classId ?? "none"));
  } else if (session.role === "GURU") {
    const asgs = await db
      .select({ id: teachingAssignments.id })
      .from(teachingAssignments)
      .where(eq(teachingAssignments.teacherId, session.teacherId ?? "none"));
    const ids = asgs.map((a) => a.id);
    const teacherCond = ids.length
      ? or(
          inArray(journalEntries.teachingAssignmentId, ids),
          eq(journalEntries.substituteTeacherId, session.teacherId ?? "none"),
        )
      : eq(journalEntries.substituteTeacherId, session.teacherId ?? "none");
    conds.push(teacherCond);
  } else if (session.role === "WALI_KELAS") {
    const hc = await homeroomClass(session);
    conds.push(eq(journalEntries.classId, hc?.classId ?? "none"));
    if (classId) conds.push(eq(journalEntries.classId, classId));
  } else {
    // ADMIN / KEPSEK
    if (classId) conds.push(eq(journalEntries.classId, classId));
  }

  const rows = await db
    .select({
      id: journalEntries.id,
      date: journalEntries.date,
      className: classes.name,
      subject: subjects.name,
      teacher: teachers.name,
      periodNoStart: journalEntries.periodNoStart,
      periodNoEnd: journalEntries.periodNoEnd,
      jpCount: journalEntries.jpCount,
      teacherAttendance: journalEntries.teacherAttendance,
      topic: journalEntries.topic,
      achievement: journalEntries.achievement,
      status: journalEntries.status,
      correctedByTeacher: journalEntries.correctedByTeacher,
    })
    .from(journalEntries)
    .innerJoin(classes, eq(journalEntries.classId, classes.id))
    .leftJoin(
      teachingAssignments,
      eq(journalEntries.teachingAssignmentId, teachingAssignments.id),
    )
    .leftJoin(subjects, eq(teachingAssignments.subjectId, subjects.id))
    .leftJoin(teachers, eq(teachingAssignments.teacherId, teachers.id))
    .where(and(...conds))
    .orderBy(desc(journalEntries.date), asc(journalEntries.periodNoStart))
    .limit(300);

  return rows;
}

export async function entryHistory(session: SessionUser, id: string) {
  const [entry] = await db
    .select({ schoolId: journalEntries.schoolId })
    .from(journalEntries)
    .where(eq(journalEntries.id, id));
  if (!entry || entry.schoolId !== session.schoolId)
    throw new ApiError(404, "Entri tidak ditemukan.");

  return db
    .select({
      action: auditLogs.action,
      diff: auditLogs.diffJson,
      at: auditLogs.createdAt,
      by: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(
      and(eq(auditLogs.entity, "journal_entry"), eq(auditLogs.entityId, id)),
    )
    .orderBy(asc(auditLogs.createdAt));
}

export async function autocomplete(
  session: SessionUser,
  assignmentId: string,
  field: "topic" | "achievement",
  q: string,
) {
  const col = field === "achievement" ? journalEntries.achievement : journalEntries.topic;
  const rows = await db
    .selectDistinct({ v: col })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.schoolId, session.schoolId),
        eq(journalEntries.teachingAssignmentId, assignmentId),
        sql`${col} is not null`,
        q ? ilike(col, `%${q}%`) : sql`true`,
      ),
    )
    .limit(8);
  return rows.map((r) => r.v).filter(Boolean);
}
