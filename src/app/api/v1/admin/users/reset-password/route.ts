import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { resetPasswordInput } from "@/lib/validation";

/** Admin sets a new password for a user (for the "forgot password" case). */
export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN");
    const { userId, newPassword } = resetPasswordInput.parse(await req.json());

    const target = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.schoolId, session.schoolId)),
    });
    if (!target) throw new ApiError(404, "Pengguna tidak ditemukan.");

    await db
      .update(users)
      .set({ passwordHash: await bcrypt.hash(newPassword, 10), updatedAt: new Date() })
      .where(eq(users.id, userId));

    await writeAudit({
      userId: session.id,
      action: "update",
      entity: "user",
      entityId: userId,
      diff: { passwordReset: true, by: "admin" },
    });

    return { ok: true };
  });
}
