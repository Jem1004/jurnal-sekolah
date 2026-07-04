import { NextRequest } from "next/server";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import { getEntryDetail, updateEntry } from "@/lib/journal";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return runRoute(async () => {
    const session = await requireRole(
      "SEKRETARIS",
      "GURU",
      "WALI_KELAS",
      "ADMIN",
      "KEPSEK",
    );
    const { id } = await params;
    const entry = await getEntryDetail(id);
    if (!entry || entry.schoolId !== session.schoolId)
      throw new ApiError(404, "Entri tidak ditemukan.");
    return entry;
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return runRoute(async () => {
    const session = await requireRole("SEKRETARIS", "GURU", "ADMIN");
    const { id } = await params;
    const body = await req.json();
    return updateEntry(session, id, body);
  });
}
