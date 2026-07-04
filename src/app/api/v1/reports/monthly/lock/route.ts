import { NextRequest } from "next/server";
import { and, between, eq } from "drizzle-orm";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { datesInMonth } from "@/lib/tz";

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const body = await req.json();
    const month = Number(body.month);
    const year = Number(body.year);
    if (!month || month < 1 || month > 12 || !year)
      throw new ApiError(400, "Bulan/tahun tidak valid.");

    const dates = datesInMonth(year, month);
    const start = dates[0];
    const end = dates[dates.length - 1];

    const res = await db
      .update(journalEntries)
      .set({ status: "TERKUNCI", updatedAt: new Date() })
      .where(
        and(
          eq(journalEntries.schoolId, session.schoolId),
          between(journalEntries.date, start, end),
          eq(journalEntries.status, "TERCATAT"),
        ),
      )
      .returning({ id: journalEntries.id });

    await writeAudit({
      userId: session.id,
      action: "lock",
      entity: "journal_entry",
      entityId: null,
      diff: { month, year, locked: res.length },
    });

    return { locked: res.length };
  });
}
