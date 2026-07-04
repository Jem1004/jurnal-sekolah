import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { periodTemplates } from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  fromDay: z.coerce.number().int().min(1).max(6),
  toDays: z.array(z.coerce.number().int().min(1).max(6)).min(1),
  overwrite: z.boolean().optional().default(false),
});

/** Duplicate all period-template slots from one day to one or more days. */
export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const { fromDay, toDays, overwrite } = schema.parse(await req.json());

    const targets = [...new Set(toDays)].filter((d) => d !== fromDay);
    if (targets.length === 0)
      throw new ApiError(400, "Pilih minimal satu hari tujuan yang berbeda.");

    const source = await db
      .select()
      .from(periodTemplates)
      .where(
        and(
          eq(periodTemplates.schoolId, session.schoolId),
          eq(periodTemplates.dayOfWeek, fromDay),
        ),
      );
    if (source.length === 0)
      throw new ApiError(400, "Hari sumber belum memiliki jam pelajaran.");

    let copied = 0;
    const skippedDays: number[] = [];

    for (const day of targets) {
      const existing = await db
        .select({ periodNo: periodTemplates.periodNo })
        .from(periodTemplates)
        .where(
          and(
            eq(periodTemplates.schoolId, session.schoolId),
            eq(periodTemplates.dayOfWeek, day),
          ),
        );

      if (existing.length > 0 && !overwrite) {
        // Without overwrite, only add slots whose period number is free.
        const taken = new Set(existing.map((e) => e.periodNo));
        const toAdd = source.filter((s) => !taken.has(s.periodNo));
        if (toAdd.length === 0) {
          skippedDays.push(day);
          continue;
        }
        await db.insert(periodTemplates).values(
          toAdd.map((s) => ({
            schoolId: session.schoolId,
            dayOfWeek: day,
            periodNo: s.periodNo,
            startTime: s.startTime,
            endTime: s.endTime,
            type: s.type,
          })),
        );
        copied += toAdd.length;
      } else {
        if (existing.length > 0) {
          await db
            .delete(periodTemplates)
            .where(
              and(
                eq(periodTemplates.schoolId, session.schoolId),
                eq(periodTemplates.dayOfWeek, day),
              ),
            );
        }
        await db.insert(periodTemplates).values(
          source.map((s) => ({
            schoolId: session.schoolId,
            dayOfWeek: day,
            periodNo: s.periodNo,
            startTime: s.startTime,
            endTime: s.endTime,
            type: s.type,
          })),
        );
        copied += source.length;
      }
    }

    await writeAudit({
      userId: session.id,
      action: "create",
      entity: "period_template",
      entityId: null,
      diff: { copyFrom: fromDay, toDays: targets, copied, overwrite },
    });

    return { copied, days: targets, skippedDays };
  });
}
