import { NextRequest } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { readCsvBody, validateRows } from "@/lib/csv";
import { subjectImportRow } from "@/lib/validation";

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const raw = readCsvBody(await req.json());
    const { valid, errors } = validateRows(raw, (r) =>
      subjectImportRow.safeParse(r),
    );

    if (!valid.length) return { inserted: 0, skipped: errors.length, errors };

    const inserted = await db
      .insert(subjects)
      .values(
        valid.map((v) => ({
          schoolId: session.schoolId,
          code: v.code ? v.code : null,
          name: v.name,
        })),
      )
      .returning({ id: subjects.id });

    await writeAudit({
      userId: session.id,
      action: "import",
      entity: "subject",
      diff: { inserted: inserted.length },
    });

    return { inserted: inserted.length, skipped: errors.length, errors };
  });
}
