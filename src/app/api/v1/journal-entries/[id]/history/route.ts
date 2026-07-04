import { NextRequest } from "next/server";
import { requireRole, runRoute } from "@/lib/api-auth";
import { entryHistory } from "@/lib/journal";

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
    return entryHistory(session, id);
  });
}
