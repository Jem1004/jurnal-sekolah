import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { classes, schedules, teachingAssignments } from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";

const zId = z.string().regex(/^[0-9a-fA-F-]{36}$/);
const schema = z.object({
  classId: zId,
  fromDay: z.coerce.number().int().min(1).max(6),
  toDays: z.array(z.coerce.number().int().min(1).max(6)).min(1),
  overwrite: z.boolean().optional().default(false),
});

const overlap = (aS: number, aE: number, bS: number, bE: number) =>
  aS <= bE && bS <= aE;

/** Copy one class's schedule from one day to other days (clash-aware). */
export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const { classId, fromDay, toDays, overwrite } = schema.parse(
      await req.json(),
    );

    const [cls] = await db
      .select({ id: classes.id, academicYearId: classes.academicYearId })
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, session.schoolId)));
    if (!cls) throw new ApiError(404, "Kelas tidak ditemukan.");

    // Source rows (this class, source day) with their teacher.
    const source = await db
      .select({
        periodNoStart: schedules.periodNoStart,
        periodNoEnd: schedules.periodNoEnd,
        teachingAssignmentId: schedules.teachingAssignmentId,
        academicYearId: schedules.academicYearId,
        teacherId: teachingAssignments.teacherId,
      })
      .from(schedules)
      .innerJoin(
        teachingAssignments,
        eq(schedules.teachingAssignmentId, teachingAssignments.id),
      )
      .where(and(eq(schedules.classId, classId), eq(schedules.dayOfWeek, fromDay)));
    if (source.length === 0)
      throw new ApiError(400, "Hari sumber belum punya jadwal.");

    const targets = [...new Set(toDays)].filter((d) => d !== fromDay);
    let copied = 0;
    let skipped = 0;

    for (const day of targets) {
      if (overwrite) {
        await db
          .delete(schedules)
          .where(and(eq(schedules.classId, classId), eq(schedules.dayOfWeek, day)));
      }

      // Existing slots on target day (all classes) for clash checks.
      const dayRows = await db
        .select({
          classId: schedules.classId,
          start: schedules.periodNoStart,
          end: schedules.periodNoEnd,
          teacherId: teachingAssignments.teacherId,
        })
        .from(schedules)
        .innerJoin(
          teachingAssignments,
          eq(schedules.teachingAssignmentId, teachingAssignments.id),
        )
        .innerJoin(classes, eq(schedules.classId, classes.id))
        .where(
          and(eq(classes.schoolId, session.schoolId), eq(schedules.dayOfWeek, day)),
        );

      for (const s of source) {
        const clash = dayRows.some(
          (r) =>
            overlap(s.periodNoStart, s.periodNoEnd, r.start, r.end) &&
            (r.classId === classId || r.teacherId === s.teacherId),
        );
        if (clash) {
          skipped++;
          continue;
        }
        await db.insert(schedules).values({
          academicYearId: s.academicYearId,
          classId,
          dayOfWeek: day,
          periodNoStart: s.periodNoStart,
          periodNoEnd: s.periodNoEnd,
          teachingAssignmentId: s.teachingAssignmentId,
        });
        dayRows.push({
          classId,
          start: s.periodNoStart,
          end: s.periodNoEnd,
          teacherId: s.teacherId,
        });
        copied++;
      }
    }

    await writeAudit({
      userId: session.id,
      action: "create",
      entity: "schedule",
      diff: { classId, fromDay, toDays: targets, copied, skipped },
    });

    return { copied, skipped };
  });
}
