import { NextRequest } from "next/server";
import Papa from "papaparse";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { classes, students, classMembers } from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { studentImportRow } from "@/lib/validation";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const body = await req.json();

    const classId: string | undefined = body.classId;
    if (!classId) throw new ApiError(400, "classId wajib diisi.");

    const [cls] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, session.schoolId)));
    if (!cls) throw new ApiError(404, "Kelas tidak ditemukan.");

    let rawRows: any[] = [];
    if (Array.isArray(body.students)) {
      rawRows = body.students;
    } else if (typeof body.csv === "string") {
      const parsed = Papa.parse(body.csv.trim(), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
      });
      rawRows = parsed.data as any[];
    } else {
      throw new ApiError(400, "Kirim 'students' (array) atau 'csv' (teks).");
    }

    const valid: { name: string; nisn?: string; gender?: string }[] = [];
    const errors: { row: number; message: string }[] = [];
    rawRows.forEach((r, i) => {
      const res = studentImportRow.safeParse(r);
      if (res.success) valid.push(res.data);
      else
        errors.push({
          row: i + 1,
          message: res.error.issues.map((x) => x.message).join("; "),
        });
    });

    if (!valid.length) {
      return { inserted: 0, skipped: errors.length, errors };
    }

    const inserted = await db
      .insert(students)
      .values(
        valid.map((v) => ({
          schoolId: session.schoolId,
          name: v.name,
          nisn: v.nisn ? v.nisn : null,
          gender: (v.gender ? v.gender : null) as any,
        })),
      )
      .returning();

    await db.insert(classMembers).values(
      inserted.map((s) => ({
        classId,
        studentId: s.id,
        isSecretary: false,
      })),
    );

    await writeAudit({
      userId: session.id,
      action: "import",
      entity: "student",
      entityId: classId,
      diff: { inserted: inserted.length, class: cls.name },
    });

    return { inserted: inserted.length, skipped: errors.length, errors };
  });
}
