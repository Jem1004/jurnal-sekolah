import { NextRequest } from "next/server";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import {
  daySlots,
  secretaryClass,
  schoolSettings,
  schoolTeachers,
} from "@/lib/journal";
import { todayInTz } from "@/lib/tz";

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("SEKRETARIS", "GURU", "ADMIN");
    const settings = await schoolSettings(session.schoolId);
    const date =
      req.nextUrl.searchParams.get("date") || todayInTz(settings.timezone);

    if (session.role === "SEKRETARIS") {
      const sc = await secretaryClass(session);
      if (!sc)
        throw new ApiError(
          400,
          "Akun ini belum ditautkan sebagai sekretaris kelas.",
        );
      const day = await daySlots({
        schoolId: session.schoolId,
        date,
        classId: sc.classId,
      });
      const teachersList = await schoolTeachers(session.schoolId);
      return {
        ...day,
        mode: settings.input_mode,
        class: { id: sc.classId, name: sc.className },
        teachers: teachersList,
      };
    }

    // GURU (or ADMIN preview): slots across the teacher's assignments.
    const day = await daySlots({
      schoolId: session.schoolId,
      date,
      teacherId: session.teacherId ?? "none",
    });
    const teachersList = await schoolTeachers(session.schoolId);
    return { ...day, mode: settings.input_mode, teachers: teachersList };
  });
}
