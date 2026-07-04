import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schools } from "@/db/schema";
import { ApiError, requireRole, runRoute } from "@/lib/api-auth";
import {
  reportPerGuru,
  reportPerKelas,
  reportKetidakhadiran,
} from "@/lib/reports";
import { guruWorkbook, kelasWorkbook, absenWorkbook } from "@/lib/excel";
import { MONTH_LABEL, datesInMonth, rangeLabel, weekRange } from "@/lib/tz";

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    const session = await requireRole("ADMIN", "KEPSEK");
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type") ?? "guru";
    const month = Number(sp.get("month"));
    const year = Number(sp.get("year"));
    const week = sp.get("week"); // YYYY-MM-DD di dalam minggu yang diminta
    const format = sp.get("format") ?? "json";
    const classId = sp.get("class_id");

    const weekly = type === "kelas" && !!week;
    if (weekly && !/^\d{4}-\d{2}-\d{2}$/.test(week!))
      throw new ApiError(400, "Parameter week harus format YYYY-MM-DD.");
    if (!weekly && (!month || month < 1 || month > 12 || !year))
      throw new ApiError(400, "Bulan/tahun tidak valid.");

    const [school] = await db
      .select({ name: schools.name })
      .from(schools)
      .where(eq(schools.id, session.schoolId));
    const schoolName = school?.name ?? "Sekolah";

    let report: unknown;
    let buffer: Buffer | null = null;

    if (type === "guru") {
      const r = await reportPerGuru(session.schoolId, month, year);
      report = r;
      if (format === "xlsx") buffer = await guruWorkbook(r, schoolName);
    } else if (type === "kelas") {
      if (!classId) throw new ApiError(400, "class_id wajib untuk rekap kelas.");
      let range;
      if (weekly) {
        const { start, end } = weekRange(week!);
        range = { start, end, label: `Minggu ${rangeLabel(start, end)}` };
      } else {
        const dates = datesInMonth(year, month);
        range = {
          start: dates[0],
          end: dates[dates.length - 1],
          label: `${MONTH_LABEL[month - 1]} ${year}`,
        };
      }
      const r = await reportPerKelas(session.schoolId, classId, range);
      report = r;
      if (format === "xlsx") buffer = await kelasWorkbook(r, schoolName);
    } else if (type === "absen") {
      const r = await reportKetidakhadiran(session.schoolId, month, year);
      report = r;
      if (format === "xlsx") buffer = await absenWorkbook(r, schoolName);
    } else {
      throw new ApiError(400, "type harus guru | kelas | absen.");
    }

    if (format === "xlsx" && buffer) {
      const fname = weekly
        ? `rekap-kelas-minggu-${weekRange(week!).start}.xlsx`
        : `rekap-${type}-${MONTH_LABEL[month - 1]}-${year}.xlsx`;
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fname}"`,
        },
      });
    }

    return report;
  });
}
