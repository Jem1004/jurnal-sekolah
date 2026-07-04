import { NextRequest } from "next/server";
import { requireRole, runRoute } from "@/lib/api-auth";
import { createEntry, listEntries } from "@/lib/journal";

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole(
      "SEKRETARIS",
      "GURU",
      "WALI_KELAS",
      "ADMIN",
      "KEPSEK",
    );
    return listEntries(session, req.nextUrl.searchParams);
  });
}

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("SEKRETARIS", "GURU", "ADMIN");
    const body = await req.json();
    return createEntry(session, body);
  });
}
