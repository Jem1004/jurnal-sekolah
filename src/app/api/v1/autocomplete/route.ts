import { NextRequest } from "next/server";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { autocomplete } from "@/lib/journal";

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("SEKRETARIS", "GURU", "ADMIN");
    const sp = req.nextUrl.searchParams;
    const assignmentId = sp.get("assignment_id");
    const field = sp.get("field");
    const q = sp.get("q") ?? "";
    if (!assignmentId) throw new ApiError(400, "assignment_id wajib diisi.");
    if (field !== "topic" && field !== "achievement")
      throw new ApiError(400, "field harus 'topic' atau 'achievement'.");
    return autocomplete(session, assignmentId, field, q);
  });
}
