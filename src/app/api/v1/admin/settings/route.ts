import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { schools, type SchoolSettings } from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";

const settingsPatch = z.object({
  name: z.string().trim().min(1).optional(),
  npsn: z.string().trim().nullish(),
  address: z.string().trim().nullish(),
  logoUrl: z.string().trim().nullish(),
  settings: z
    .object({
      input_mode: z.enum(["A", "B", "AB"]),
      auto_lock_day: z.coerce.number().int().min(0).max(28),
      timezone: z.string().trim().min(1),
    })
    .optional(),
});

export async function GET() {
  return runRoute(async () => {
    const session = await requireRole("ADMIN", "KEPSEK");
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, session.schoolId));
    if (!school) throw new ApiError(404, "Sekolah tidak ditemukan.");
    return school;
  });
}

export async function PATCH(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const body = settingsPatch.parse(await req.json());

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.npsn !== undefined) patch.npsn = body.npsn;
    if (body.address !== undefined) patch.address = body.address;
    if (body.logoUrl !== undefined) patch.logoUrl = body.logoUrl;
    if (body.settings) patch.settingsJson = body.settings as SchoolSettings;

    const [row] = await db
      .update(schools)
      .set(patch)
      .where(eq(schools.id, session.schoolId))
      .returning();

    await writeAudit({
      userId: session.id,
      action: "update",
      entity: "school",
      entityId: session.schoolId,
      diff: row,
    });
    return row;
  });
}
