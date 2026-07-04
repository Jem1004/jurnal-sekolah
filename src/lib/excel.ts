import ExcelJS from "exceljs";
import { formatLongDate } from "@/lib/tz";
import type {
  PerGuruReport,
  PerKelasReport,
  KetidakhadiranReport,
} from "@/lib/reports";

/* ---- palette (flat, blue brand) ---- */
const BRAND = "FF2563EB";
const BRAND_SOFT = "FFEFF6FF";
const INK = "FF0F172A";
const MUTED = "FF64748B";
const ZEBRA = "FFF8FAFC";
const TOTAL = "FFF1F5F9";
const WHITE = "FFFFFFFF";
const BORDER = "FFE2E8F0";

/**
 * Neutralize CSV/formula injection: a cell value starting with = + @ (or a
 * formula-like minus) is prefixed with an apostrophe so spreadsheet apps treat
 * it as text. Avoids breaking the common "-" placeholder and negative numbers.
 */
function isFormulaLike(v: string): boolean {
  if (/^[=+@\t\r]/.test(v)) return true;
  if (/^-[^0-9\s]/.test(v)) return true; // "-cmd" yes; "-" and "-5" no
  return false;
}
function sc<T>(v: T): T {
  return typeof v === "string" && isFormulaLike(v)
    ? (`'${v}` as unknown as T)
    : v;
}
function scRow(arr: ExcelJS.CellValue[]): ExcelJS.CellValue[] {
  return arr.map((v) => sc(v));
}

const thin: Partial<ExcelJS.Border> = { style: "thin", color: { argb: BORDER } };
const cellBorder: Partial<ExcelJS.Borders> = {
  top: thin,
  bottom: thin,
  left: thin,
  right: thin,
};

type Col = { header: string; width: number; align?: "left" | "center" | "right" };

/** Branded title band + column headers. Returns the row index where data starts. */
function buildHead(
  ws: ExcelJS.Worksheet,
  schoolName: string,
  title: string,
  period: string,
  cols: Col[],
) {
  const span = cols.length;
  ws.properties.defaultRowHeight = 18;

  // Row 1: school name
  ws.mergeCells(1, 1, 1, span);
  const t1 = ws.getCell(1, 1);
  t1.value = sc(schoolName.toUpperCase());
  t1.font = { bold: true, size: 15, color: { argb: INK } };
  t1.alignment = { vertical: "middle" };
  ws.getRow(1).height = 24;

  // Row 2: report title · period
  ws.mergeCells(2, 1, 2, span);
  const t2 = ws.getCell(2, 1);
  t2.value = `${title}  ·  ${period}`;
  t2.font = { size: 11, color: { argb: MUTED } };

  // Row 3: accent underline (thick brand-blue bottom border across the span)
  const rule = ws.getRow(3);
  rule.height = 4;
  for (let c = 1; c <= span; c++) {
    ws.getCell(3, c).border = {
      bottom: { style: "medium", color: { argb: BRAND } },
    };
  }

  // Row 4: column headers
  const headerRowIdx = 4;
  const header = ws.getRow(headerRowIdx);
  cols.forEach((col, i) => {
    const cell = header.getCell(i + 1);
    cell.value = col.header;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.alignment = {
      vertical: "middle",
      horizontal: col.align ?? "left",
      wrapText: true,
    };
    cell.border = cellBorder;
  });
  header.height = 26;

  cols.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
  });

  ws.views = [{ state: "frozen", ySplit: headerRowIdx }];
  return headerRowIdx + 1;
}

function styleData(
  ws: ExcelJS.Worksheet,
  rowIdx: number,
  cols: Col[],
  opts: { zebra?: boolean; total?: boolean } = {},
) {
  const row = ws.getRow(rowIdx);
  cols.forEach((col, i) => {
    const cell = row.getCell(i + 1);
    cell.border = cellBorder;
    cell.alignment = {
      vertical: "top",
      horizontal: col.align ?? "left",
      wrapText: true,
    };
    cell.font = { size: 10, color: { argb: INK }, bold: !!opts.total };
    if (opts.total) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL } };
    } else if (opts.zebra) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
    }
  });
  row.height = 16;
}

function footer(ws: ExcelJS.Worksheet, span: number, schoolName: string) {
  const r = ws.addRow([]);
  ws.mergeCells(r.number, 1, r.number, span);
  const c = ws.getCell(r.number, 1);
  c.value = `Dicetak ${formatLongDate(new Date().toISOString().slice(0, 10))} · ASTRO JURNAL · ${schoolName}`;
  c.font = { italic: true, size: 9, color: { argb: MUTED } };
}

/* ------------------------------------------------------------------ */
/* Rekap per guru                                                      */
/* ------------------------------------------------------------------ */
export async function guruWorkbook(
  report: PerGuruReport,
  schoolName: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ASTRO JURNAL";

  const cols: Col[] = [
    { header: "Nama Guru", width: 34 },
    { header: "Mata Pelajaran", width: 22 },
    { header: "Kelas", width: 10, align: "center" },
    { header: "Pertemuan", width: 12, align: "center" },
    { header: "JP Terlaksana", width: 14, align: "center" },
    { header: "JP Seharusnya", width: 14, align: "center" },
    { header: "Selisih", width: 10, align: "center" },
    { header: "% Kehadiran", width: 13, align: "center" },
  ];
  const ws = wb.addWorksheet("Rekap Guru", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  let r = buildHead(ws, schoolName, "Rekap Jam Mengajar per Guru", report.period.label, cols);

  let zebra = false;
  for (const t of report.teachers) {
    t.rows.forEach((row, i) => {
      ws.getRow(r).values = scRow([
        i === 0 ? t.teacherName : "",
        row.subject,
        row.className,
        row.pertemuan,
        row.jpTerlaksana,
        row.jpSeharusnya,
        row.selisih,
        `${row.persen}%`,
      ]);
      styleData(ws, r, cols, { zebra });
      r++;
    });
    ws.getRow(r).values = scRow([
      `Total ${t.teacherName}`,
      "",
      "",
      t.totals.pertemuan,
      t.totals.jpTerlaksana,
      t.totals.jpSeharusnya,
      t.totals.selisih,
      `${t.totals.persen}%`,
    ]);
    styleData(ws, r, cols, { total: true });
    r++;
    zebra = !zebra;
  }
  footer(ws, cols.length, schoolName);

  // Sheet 2 — daily detail
  const cols2: Col[] = [
    { header: "Guru", width: 28 },
    { header: "Tanggal", width: 14 },
    { header: "Kelas", width: 10, align: "center" },
    { header: "Mapel", width: 22 },
    { header: "Jam Ke-", width: 10, align: "center" },
    { header: "Kehadiran", width: 14 },
    { header: "JP", width: 6, align: "center" },
  ];
  const ws2 = wb.addWorksheet("Rincian Harian", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  let r2 = buildHead(ws2, schoolName, "Rincian Harian per Guru", report.period.label, cols2);
  let z2 = false;
  for (const t of report.teachers) {
    for (const d of t.daily) {
      ws2.getRow(r2).values = scRow([
        t.teacherName,
        d.date,
        d.className,
        d.subject ?? "-",
        d.jam,
        d.attendance ?? "-",
        d.jp,
      ]);
      styleData(ws2, r2, cols2, { zebra: z2 });
      z2 = !z2;
      r2++;
    }
  }
  footer(ws2, cols2.length, schoolName);

  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}

/* ------------------------------------------------------------------ */
/* Rekap per kelas (jurnal fisik)                                      */
/* ------------------------------------------------------------------ */
export async function kelasWorkbook(
  report: PerKelasReport,
  schoolName: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ASTRO JURNAL";

  const cols: Col[] = [
    { header: "No", width: 5, align: "center" },
    { header: "Tanggal", width: 22 },
    { header: "Bidang Studi", width: 18 },
    { header: "Jam Ke-", width: 14, align: "center" },
    { header: "Pokok Bahasan", width: 32 },
    { header: "Capaian", width: 28 },
    { header: "Jmlh Jam", width: 9, align: "center" },
    { header: "Nama Guru", width: 24 },
    { header: "Siswa Absen", width: 12, align: "center" },
  ];
  const ws = wb.addWorksheet(`Kelas ${report.className}`, {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  let r = buildHead(ws, schoolName, `Jurnal Kelas ${report.className}`, report.period.label, cols);

  let zebra = false;
  for (const day of report.days) {
    day.entries.forEach((e, i) => {
      ws.getRow(r).values = scRow([
        e.no,
        i === 0 ? formatLongDate(day.date) : "",
        e.subject ?? "-",
        e.waktu,
        e.topic ?? "-",
        e.achievement ?? "-",
        e.jp,
        `${e.teacher ?? "-"} (${e.pencatat})`,
        e.absen ?? "",
      ]);
      styleData(ws, r, cols, { zebra });
      r++;
    });
    for (const note of day.special) {
      ws.getRow(r).values = scRow(["", "", `◦ ${note}`]);
      ws.mergeCells(r, 3, r, cols.length);
      const c = ws.getCell(r, 3);
      c.font = { italic: true, size: 10, color: { argb: "FF1E40AF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_SOFT } };
      c.border = cellBorder;
      r++;
    }
    zebra = !zebra;
  }
  if (report.days.length === 0) {
    ws.getRow(r).values = ["", "Tidak ada entri pada periode ini."];
    ws.mergeCells(r, 1, r, cols.length);
    ws.getCell(r, 1).font = { italic: true, color: { argb: MUTED } };
    ws.getCell(r, 1).alignment = { horizontal: "center" };
  }
  footer(ws, cols.length, schoolName);

  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}

/* ------------------------------------------------------------------ */
/* Rekap ketidakhadiran                                                */
/* ------------------------------------------------------------------ */
export async function absenWorkbook(
  report: KetidakhadiranReport,
  schoolName: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ASTRO JURNAL";

  const cols: Col[] = [
    { header: "Tanggal", width: 14 },
    { header: "Kelas", width: 10, align: "center" },
    { header: "Mata Pelajaran", width: 24 },
    { header: "Guru", width: 28 },
    { header: "Jam Ke-", width: 10, align: "center" },
    { header: "Status", width: 16, align: "center" },
  ];
  const ws = wb.addWorksheet("Ketidakhadiran", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  let r = buildHead(ws, schoolName, "Rekap Ketidakhadiran / Slot Kosong", report.period.label, cols);

  let zebra = false;
  for (const row of report.rows) {
    ws.getRow(r).values = scRow([
      row.date,
      row.className,
      row.subject,
      row.teacher,
      row.jam,
      row.status === "TIDAK_HADIR" ? "Tidak Hadir" : "Belum Diisi",
    ]);
    styleData(ws, r, cols, { zebra });
    const statusCell = ws.getCell(r, 6);
    statusCell.font = {
      bold: true,
      size: 10,
      color: { argb: row.status === "TIDAK_HADIR" ? "FFB91C1C" : "FFB45309" },
    };
    zebra = !zebra;
    r++;
  }
  if (report.rows.length === 0) {
    ws.getRow(r).values = ["", "", "Tidak ada anomali — semua slot terisi."];
    ws.mergeCells(r, 1, r, cols.length);
    ws.getCell(r, 1).font = { italic: true, color: { argb: MUTED } };
    ws.getCell(r, 1).alignment = { horizontal: "center" };
  }
  footer(ws, cols.length, schoolName);

  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}
