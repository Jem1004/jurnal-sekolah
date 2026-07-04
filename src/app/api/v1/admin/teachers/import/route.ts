import { NextRequest } from "next/server";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { readCsvBody, validateRows } from "@/lib/csv";
import { teacherImportRow } from "@/lib/validation";

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const raw = readCsvBody(await req.json());
    const { valid, errors } = validateRows(raw, (r) =>
      teacherImportRow.safeParse(r),
    );

    if (!valid.length) return { inserted: 0, skipped: errors.length, errors };

    const inserted = await db
      .insert(teachers)
      .values(
        valid.map((v) => ({
          schoolId: session.schoolId,
          name: v.name,
          nip: v.nip ? v.nip : null,
          phone: v.phone ? v.phone : null,
        })),
      )
      .returning({ id: teachers.id });

    await writeAudit({
      userId: session.id,
      action: "import",
      entity: "teacher",
      diff: { inserted: inserted.length },
    });

    return { inserted: inserted.length, skipped: errors.length, errors };
  });
}
