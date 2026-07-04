import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const { id } = await params;

    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.id, id),
          eq(journalEntries.schoolId, session.schoolId),
        ),
      );
    if (!entry) throw new ApiError(404, "Entri tidak ditemukan.");

    await db
      .update(journalEntries)
      .set({ status: "TERCATAT", updatedAt: new Date() })
      .where(eq(journalEntries.id, id));

    await writeAudit({
      userId: session.id,
      action: "unlock",
      entity: "journal_entry",
      entityId: id,
    });

    return { ok: true };
  });
}
