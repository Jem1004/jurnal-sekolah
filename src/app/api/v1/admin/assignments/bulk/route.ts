import { NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  academicYears,
  classes,
  subjects,
  teachers,
  teachingAssignments,
} from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";

const zId = z.string().regex(/^[0-9a-fA-F-]{36}$/);
const schema = z.object({
  academicYearId: zId,
  teacherId: zId,
  subjectId: zId,
  classIds: z.array(zId).min(1),
});

/** Assign one teacher+subject to many classes at once (skips duplicates). */
export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const { academicYearId, teacherId, subjectId, classIds } = schema.parse(
      await req.json(),
    );

    // Verify the referenced master data belongs to this school.
    const [ay] = await db
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(and(eq(academicYears.id, academicYearId), eq(academicYears.schoolId, session.schoolId)));
    const [teacher] = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(and(eq(teachers.id, teacherId), eq(teachers.schoolId, session.schoolId)));
    const [subject] = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, session.schoolId)));
    if (!ay || !teacher || !subject)
      throw new ApiError(404, "Tahun ajaran / guru / mapel tidak ditemukan.");

    const validClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(
        and(
          eq(classes.schoolId, session.schoolId),
          inArray(classes.id, classIds),
        ),
      );
    if (validClasses.length === 0)
      throw new ApiError(400, "Tidak ada kelas valid yang dipilih.");

    const inserted = await db
      .insert(teachingAssignments)
      .values(
        validClasses.map((c) => ({
          academicYearId,
          teacherId,
          subjectId,
          classId: c.id,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: teachingAssignments.id });

    await writeAudit({
      userId: session.id,
      action: "create",
      entity: "teaching_assignment",
      diff: {
        bulk: true,
        teacherId,
        subjectId,
        classes: validClasses.length,
        created: inserted.length,
      },
    });

    return {
      created: inserted.length,
      skipped: validClasses.length - inserted.length,
    };
  });
}
