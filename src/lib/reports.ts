import { and, between, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  classes,
  subjects,
  teachers,
  teachingAssignments,
  schedules,
  periodTemplates,
  holidays,
  journalEntries,
  users,
} from "@/db/schema";
import { dayOfWeekOf, datesInMonth, MONTH_LABEL } from "@/lib/tz";
import { ATTENDANCE_LABELS, hhmm } from "@/lib/labels";

const PRESENT = ["HADIR", "TERLAMBAT"];

function periodLabel(month: number, year: number) {
  return `${MONTH_LABEL[month - 1]} ${year}`;
}

/** Occurrences of each weekday (1..7) in the month, excluding holidays. */
async function workingDaysByDow(
  schoolId: string,
  month: number,
  year: number,
) {
  const dates = datesInMonth(year, month);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const hols = await db
    .select({ date: holidays.date })
    .from(holidays)
    .where(and(eq(holidays.schoolId, schoolId), between(holidays.date, start, end)));
  const holSet = new Set(hols.map((h) => h.date));

  const occ: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  for (const d of dates) {
    if (holSet.has(d)) continue;
    occ[dayOfWeekOf(d)] += 1;
  }
  return { occ, dates, holSet, start, end };
}

export type PerGuruReport = Awaited<ReturnType<typeof reportPerGuru>>;
export type PerKelasReport = Awaited<ReturnType<typeof reportPerKelas>>;
export type KetidakhadiranReport = Awaited<
  ReturnType<typeof reportKetidakhadiran>
>;

/** Rekap per guru: pertemuan, JP terlaksana vs seharusnya, %kehadiran. */
export async function reportPerGuru(
  schoolId: string,
  month: number,
  year: number,
) {
  const { occ, start, end } = await workingDaysByDow(schoolId, month, year);

  const asgRows = await db
    .select({
      id: teachingAssignments.id,
      teacherId: teachers.id,
      teacherName: teachers.name,
      subject: subjects.name,
      className: classes.name,
    })
    .from(teachingAssignments)
    .innerJoin(teachers, eq(teachingAssignments.teacherId, teachers.id))
    .innerJoin(subjects, eq(teachingAssignments.subjectId, subjects.id))
    .innerJoin(classes, eq(teachingAssignments.classId, classes.id))
    .where(eq(teachers.schoolId, schoolId));

  const schedRows = await db
    .select({
      assignmentId: schedules.teachingAssignmentId,
      dayOfWeek: schedules.dayOfWeek,
      start: schedules.periodNoStart,
      end: schedules.periodNoEnd,
    })
    .from(schedules)
    .innerJoin(classes, eq(schedules.classId, classes.id))
    .where(eq(classes.schoolId, schoolId));

  const entryRows = await db
    .select({
      assignmentId: journalEntries.teachingAssignmentId,
      attendance: journalEntries.teacherAttendance,
      jpCount: journalEntries.jpCount,
      substituteTeacherId: journalEntries.substituteTeacherId,
      date: journalEntries.date,
      className: classes.name,
      subject: subjects.name,
      periodNoStart: journalEntries.periodNoStart,
      periodNoEnd: journalEntries.periodNoEnd,
      topic: journalEntries.topic,
    })
    .from(journalEntries)
    .innerJoin(classes, eq(journalEntries.classId, classes.id))
    .leftJoin(
      teachingAssignments,
      eq(journalEntries.teachingAssignmentId, teachingAssignments.id),
    )
    .leftJoin(subjects, eq(teachingAssignments.subjectId, subjects.id))
    .where(
      and(
        eq(journalEntries.schoolId, schoolId),
        between(journalEntries.date, start, end),
      ),
    );

  // Planned JP per assignment.
  const plannedByAsg = new Map<string, number>();
  for (const s of schedRows) {
    const blockLen = s.end - s.start + 1;
    const plus = (occ[s.dayOfWeek] ?? 0) * blockLen;
    plannedByAsg.set(
      s.assignmentId,
      (plannedByAsg.get(s.assignmentId) ?? 0) + plus,
    );
  }

  // Realized per assignment.
  const realizedByAsg = new Map<string, { jp: number; pertemuan: number }>();
  const jpPengganti = new Map<string, number>(); // teacherId -> jp
  const dailyByTeacher = new Map<
    string,
    {
      date: string;
      className: string;
      subject: string | null;
      jam: string;
      attendance: string | null;
      jp: number;
      topic: string | null;
    }[]
  >();

  const asgToTeacher = new Map(asgRows.map((a) => [a.id, a.teacherId]));

  for (const e of entryRows) {
    if (e.assignmentId && e.attendance && PRESENT.includes(e.attendance)) {
      const r = realizedByAsg.get(e.assignmentId) ?? { jp: 0, pertemuan: 0 };
      r.jp += e.jpCount;
      r.pertemuan += 1;
      realizedByAsg.set(e.assignmentId, r);

      const teacherId = asgToTeacher.get(e.assignmentId);
      if (teacherId) {
        const list = dailyByTeacher.get(teacherId) ?? [];
        list.push({
          date: e.date,
          className: e.className,
          subject: e.subject,
          jam: `${e.periodNoStart}${e.periodNoEnd !== e.periodNoStart ? `-${e.periodNoEnd}` : ""}`,
          attendance: e.attendance,
          jp: e.jpCount,
          topic: e.topic,
        });
        dailyByTeacher.set(teacherId, list);
      }
    }
    if (e.attendance === "DIGANTI" && e.substituteTeacherId) {
      jpPengganti.set(
        e.substituteTeacherId,
        (jpPengganti.get(e.substituteTeacherId) ?? 0) + e.jpCount,
      );
    }
  }

  // Group assignments by teacher.
  const teacherMap = new Map<
    string,
    {
      teacherId: string;
      teacherName: string;
      rows: {
        subject: string;
        className: string;
        pertemuan: number;
        jpTerlaksana: number;
        jpSeharusnya: number;
        selisih: number;
        persen: number;
      }[];
    }
  >();

  for (const a of asgRows) {
    const planned = plannedByAsg.get(a.id) ?? 0;
    const realized = realizedByAsg.get(a.id) ?? { jp: 0, pertemuan: 0 };
    if (planned === 0 && realized.jp === 0) continue; // skip empty rows
    const t = teacherMap.get(a.teacherId) ?? {
      teacherId: a.teacherId,
      teacherName: a.teacherName,
      rows: [],
    };
    t.rows.push({
      subject: a.subject,
      className: a.className,
      pertemuan: realized.pertemuan,
      jpTerlaksana: realized.jp,
      jpSeharusnya: planned,
      selisih: realized.jp - planned,
      persen: planned > 0 ? Math.round((realized.jp / planned) * 100) : 0,
    });
    teacherMap.set(a.teacherId, t);
  }

  const teacherReports = [...teacherMap.values()]
    .map((t) => {
      const pertemuan = t.rows.reduce((s, r) => s + r.pertemuan, 0);
      const jpTerlaksana = t.rows.reduce((s, r) => s + r.jpTerlaksana, 0);
      const jpSeharusnya = t.rows.reduce((s, r) => s + r.jpSeharusnya, 0);
      return {
        ...t,
        daily: (dailyByTeacher.get(t.teacherId) ?? []).sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
        totals: {
          pertemuan,
          jpTerlaksana,
          jpSeharusnya,
          selisih: jpTerlaksana - jpSeharusnya,
          persen: jpSeharusnya > 0 ? Math.round((jpTerlaksana / jpSeharusnya) * 100) : 0,
          jpPengganti: jpPengganti.get(t.teacherId) ?? 0,
        },
      };
    })
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName));

  return {
    type: "guru" as const,
    period: { month, year, label: periodLabel(month, year) },
    teachers: teacherReports,
  };
}

export type ReportRange = { start: string; end: string; label: string };

/** Rekap per kelas: menyerupai jurnal fisik (harian). Rentang bebas (minggu/bulan). */
export async function reportPerKelas(
  schoolId: string,
  classId: string,
  range: ReportRange,
) {
  const { start, end } = range;

  const [cls] = await db
    .select({ name: classes.name })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)));

  // Peta waktu slot: (hari, jam ke-) -> jam mulai/selesai, untuk kolom "Jam Ke-"
  // bergaya jurnal fisik (mis. 07.30 - 08.10).
  const tpls = await db
    .select({
      dayOfWeek: periodTemplates.dayOfWeek,
      periodNo: periodTemplates.periodNo,
      startTime: periodTemplates.startTime,
      endTime: periodTemplates.endTime,
    })
    .from(periodTemplates)
    .where(eq(periodTemplates.schoolId, schoolId));
  const timeOf = new Map<string, { start: string; end: string }>();
  for (const t of tpls)
    timeOf.set(`${t.dayOfWeek}-${t.periodNo}`, {
      start: t.startTime,
      end: t.endTime,
    });

  const rows = await db
    .select({
      date: journalEntries.date,
      periodNoStart: journalEntries.periodNoStart,
      periodNoEnd: journalEntries.periodNoEnd,
      subject: subjects.name,
      teacher: teachers.name,
      topic: journalEntries.topic,
      achievement: journalEntries.achievement,
      jpCount: journalEntries.jpCount,
      attendance: journalEntries.teacherAttendance,
      activityType: journalEntries.activityType,
      notes: journalEntries.notes,
      absentCount: journalEntries.absentCount,
      filledBy: users.name,
      filledByRole: users.role,
    })
    .from(journalEntries)
    .leftJoin(
      teachingAssignments,
      eq(journalEntries.teachingAssignmentId, teachingAssignments.id),
    )
    .leftJoin(subjects, eq(teachingAssignments.subjectId, subjects.id))
    .leftJoin(teachers, eq(teachingAssignments.teacherId, teachers.id))
    .innerJoin(users, eq(journalEntries.filledByUserId, users.id))
    .where(
      and(
        eq(journalEntries.schoolId, schoolId),
        eq(journalEntries.classId, classId),
        between(journalEntries.date, start, end),
      ),
    )
    .orderBy(journalEntries.date, journalEntries.periodNoStart);

  // Group by date; non-KBM go to notes.
  const byDate = new Map<
    string,
    {
      kbm: typeof rows;
      special: string[];
    }
  >();
  for (const r of rows) {
    const g = byDate.get(r.date) ?? { kbm: [] as typeof rows, special: [] };
    if (r.activityType === "KBM") {
      g.kbm.push(r);
    } else {
      g.special.push(
        `${r.activityType}${r.topic ? `: ${r.topic}` : ""}${r.notes ? ` (${r.notes})` : ""}`,
      );
    }
    byDate.set(r.date, g);
  }

  return {
    type: "kelas" as const,
    period: { label: range.label, start, end },
    className: cls?.name ?? "-",
    days: [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, g]) => {
        const dow = dayOfWeekOf(date);
        return {
          date,
          entries: g.kbm.map((r) => {
            const t0 = timeOf.get(`${dow}-${r.periodNoStart}`);
            const t1 = timeOf.get(`${dow}-${r.periodNoEnd}`);
            const waktu =
              t0 && t1 ? `${hhmm(t0.start)} - ${hhmm(t1.end)}` : "-";
            return {
              // Kolom "No" jurnal fisik = nomor jam pelajaran.
              no: r.periodNoStart,
              jam: `${r.periodNoStart}${r.periodNoEnd !== r.periodNoStart ? `-${r.periodNoEnd}` : ""}`,
              waktu,
              subject: r.subject,
              teacher: r.teacher,
              topic: r.topic,
              achievement: r.achievement,
              jp: r.jpCount,
              absen: r.absentCount,
              attendance: r.attendance ? ATTENDANCE_LABELS[r.attendance] : "-",
              pencatat:
                r.filledByRole === "GURU"
                  ? "Diisi guru"
                  : `Dicatat ${r.filledBy}`,
            };
          }),
          special: g.special,
        };
      }),
  };
}

/** Rekap ketidakhadiran: slot terjadwal tanpa entri, atau entri TIDAK_HADIR. */
export async function reportKetidakhadiran(
  schoolId: string,
  month: number,
  year: number,
) {
  const { dates, holSet, start, end } = await workingDaysByDow(
    schoolId,
    month,
    year,
  );

  const schedRows = await db
    .select({
      classId: schedules.classId,
      className: classes.name,
      dayOfWeek: schedules.dayOfWeek,
      periodNoStart: schedules.periodNoStart,
      periodNoEnd: schedules.periodNoEnd,
      subject: subjects.name,
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
    .where(eq(classes.schoolId, schoolId));

  const entryRows = await db
    .select({
      classId: journalEntries.classId,
      date: journalEntries.date,
      periodNoStart: journalEntries.periodNoStart,
      attendance: journalEntries.teacherAttendance,
    })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.schoolId, schoolId),
        between(journalEntries.date, start, end),
      ),
    );
  const entryByKey = new Map<string, string | null>();
  for (const e of entryRows)
    entryByKey.set(`${e.classId}-${e.date}-${e.periodNoStart}`, e.attendance);

  // Only report up to "today"-ish: include all past dates in the month.
  const rows: {
    date: string;
    className: string;
    subject: string;
    teacher: string;
    jam: string;
    status: "BELUM_DIISI" | "TIDAK_HADIR";
  }[] = [];

  for (const date of dates) {
    if (holSet.has(date)) continue;
    const dow = dayOfWeekOf(date);
    for (const s of schedRows) {
      if (s.dayOfWeek !== dow) continue;
      const key = `${s.classId}-${date}-${s.periodNoStart}`;
      if (!entryByKey.has(key)) {
        rows.push({
          date,
          className: s.className,
          subject: s.subject,
          teacher: s.teacher,
          jam: `${s.periodNoStart}${s.periodNoEnd !== s.periodNoStart ? `-${s.periodNoEnd}` : ""}`,
          status: "BELUM_DIISI",
        });
      } else if (entryByKey.get(key) === "TIDAK_HADIR") {
        rows.push({
          date,
          className: s.className,
          subject: s.subject,
          teacher: s.teacher,
          jam: `${s.periodNoStart}${s.periodNoEnd !== s.periodNoStart ? `-${s.periodNoEnd}` : ""}`,
          status: "TIDAK_HADIR",
        });
      }
    }
  }

  rows.sort(
    (a, b) => a.date.localeCompare(b.date) || a.className.localeCompare(b.className),
  );

  return {
    type: "absen" as const,
    period: { month, year, label: periodLabel(month, year) },
    rows,
  };
}
