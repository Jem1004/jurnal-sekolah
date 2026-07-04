import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { periodTemplates } from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  day: z.coerce.number().int().min(1).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  jpDuration: z.coerce.number().int().min(5).max(120),
  jpCount: z.coerce.number().int().min(1).max(15),
  startPeriodNo: z.coerce.number().int().min(0).max(20).optional().default(1),
  breakEvery: z.coerce.number().int().min(0).max(15).optional().default(0),
  breakMinutes: z.coerce.number().int().min(0).max(120).optional().default(0),
  overwrite: z.boolean().optional().default(false),
});

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toStr = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Auto-generate consecutive KBM slots (with optional recurring breaks). */
export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const p = schema.parse(await req.json());

    const existing = await db
      .select({ id: periodTemplates.id })
      .from(periodTemplates)
      .where(
        and(
          eq(periodTemplates.schoolId, session.schoolId),
          eq(periodTemplates.dayOfWeek, p.day),
        ),
      );
    if (existing.length > 0 && !p.overwrite)
      throw new ApiError(
        409,
        "Hari ini sudah punya jam pelajaran. Centang 'timpa' untuk mengganti.",
      );

    type Slot = {
      schoolId: string;
      dayOfWeek: number;
      periodNo: number;
      startTime: string;
      endTime: string;
      type: "KBM" | "ISTIRAHAT";
    };
    const slots: Slot[] = [];
    let cursor = toMin(p.startTime);
    let periodNo = p.startPeriodNo;
    let breakNo = 51;

    for (let i = 1; i <= p.jpCount; i++) {
      slots.push({
        schoolId: session.schoolId,
        dayOfWeek: p.day,
        periodNo,
        startTime: toStr(cursor),
        endTime: toStr(cursor + p.jpDuration),
        type: "KBM",
      });
      cursor += p.jpDuration;
      periodNo++;
      if (
        p.breakEvery > 0 &&
        p.breakMinutes > 0 &&
        i % p.breakEvery === 0 &&
        i < p.jpCount
      ) {
        slots.push({
          schoolId: session.schoolId,
          dayOfWeek: p.day,
          periodNo: breakNo++,
          startTime: toStr(cursor),
          endTime: toStr(cursor + p.breakMinutes),
          type: "ISTIRAHAT",
        });
        cursor += p.breakMinutes;
      }
    }

    if (existing.length > 0) {
      await db
        .delete(periodTemplates)
        .where(
          and(
            eq(periodTemplates.schoolId, session.schoolId),
            eq(periodTemplates.dayOfWeek, p.day),
          ),
        );
    }
    await db.insert(periodTemplates).values(slots);

    await writeAudit({
      userId: session.id,
      action: "create",
      entity: "period_template",
      diff: { generated: slots.length, day: p.day, overwrite: p.overwrite },
    });

    return { created: slots.length, day: p.day };
  });
}
