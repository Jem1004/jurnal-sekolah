import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { changePasswordInput } from "@/lib/validation";

/** Any logged-in user changes their own password. */
export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole(); // any authenticated role
    const { currentPassword, newPassword } = changePasswordInput.parse(
      await req.json(),
    );

    if (currentPassword === newPassword)
      throw new ApiError(400, "Password baru tidak boleh sama dengan yang lama.");

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });
    if (!user) throw new ApiError(404, "Akun tidak ditemukan.");

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new ApiError(400, "Password saat ini salah.");

    await db
      .update(users)
      .set({ passwordHash: await bcrypt.hash(newPassword, 10), updatedAt: new Date() })
      .where(eq(users.id, session.id));

    await writeAudit({
      userId: session.id,
      action: "update",
      entity: "user",
      entityId: session.id,
      diff: { passwordChanged: true, by: "self" },
    });

    return { ok: true };
  });
}
