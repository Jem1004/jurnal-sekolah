import { Fragment } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { schools } from "@/db/schema";
import {
  reportPerGuru,
  reportPerKelas,
  reportKetidakhadiran,
} from "@/lib/reports";
import {
  MONTH_LABEL,
  datesInMonth,
  formatLongDate,
  rangeLabel,
  todayInTz,
  weekRange,
} from "@/lib/tz";
import { PdfDownloader } from "@/components/print-trigger";

export default async function CetakRekapPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    month?: string;
    year?: string;
    week?: string;
    class_id?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "KEPSEK") {
    redirect("/");
  }

  const sp = await searchParams;
  const type = sp.type ?? "guru";
  const month = Number(sp.month);
  const year = Number(sp.year);
  const schoolId = session.user.schoolId;

  const [school] = await db
    .select({ name: schools.name, npsn: schools.npsn, address: schools.address })
    .from(schools)
    .where(eq(schools.id, schoolId));

  const printedAt = formatLongDate(todayInTz("Asia/Makassar"));

  let body: React.ReactNode = null;
  let title = "";
  let subtitle = "";
  // Laporan kelas dihitung sekali (rentang mingguan/bulanan) lalu dipakai ulang
  // untuk membangun body kartu-per-hari di bawah.
  let kelasReport: Awaited<ReturnType<typeof reportPerKelas>> | null = null;

  if (type === "guru") {
    const r = await reportPerGuru(schoolId, month, year);
    title = "Rekap Jam Mengajar per Guru";
    subtitle = r.period.label;
    body = (
      <table>
        <thead>
          <tr>
            <th>Guru</th><th>Mapel</th><th>Kelas</th><th className="c">Pertemuan</th>
            <th className="c">JP Terlaksana</th><th className="c">JP Seharusnya</th>
            <th className="c">Selisih</th><th className="c">% Hadir</th>
          </tr>
        </thead>
        <tbody>
          {r.teachers.map((t) => (
            <Fragment key={t.teacherId}>
              {t.rows.map((row, i) => (
                <tr key={t.teacherId + i}>
                  <td className="strong">{i === 0 ? t.teacherName : ""}</td>
                  <td>{row.subject}</td>
                  <td>{row.className}</td>
                  <td className="c">{row.pertemuan}</td>
                  <td className="c">{row.jpTerlaksana}</td>
                  <td className="c">{row.jpSeharusnya}</td>
                  <td className="c">{row.selisih}</td>
                  <td className="c">{row.persen}%</td>
                </tr>
              ))}
              <tr key={t.teacherId + "t"} className="total">
                <td colSpan={3}>Total {t.teacherName}</td>
                <td className="c">{t.totals.pertemuan}</td>
                <td className="c">{t.totals.jpTerlaksana}</td>
                <td className="c">{t.totals.jpSeharusnya}</td>
                <td className="c">{t.totals.selisih}</td>
                <td className="c">{t.totals.persen}%</td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    );
  } else if (type === "kelas") {
    // Rentang: mingguan (param week) atau bulanan.
    let range;
    if (sp.week && /^\d{4}-\d{2}-\d{2}$/.test(sp.week)) {
      const { start, end } = weekRange(sp.week);
      range = { start, end, label: `Minggu ${rangeLabel(start, end)}` };
    } else {
      const dates = datesInMonth(year, month);
      range = {
        start: dates[0],
        end: dates[dates.length - 1],
        label: `${MONTH_LABEL[month - 1]} ${year}`,
      };
    }
    kelasReport = await reportPerKelas(schoolId, sp.class_id ?? "", range);
    title = `Jurnal Kelas ${kelasReport.className}`;
    subtitle = kelasReport.period.label;
    // Body untuk kelas dibangun sebagai kartu-per-hari di blok setelah filename,
    // memakai kelasReport (rentang mingguan/bulanan yang sama).
  } else {
    const r = await reportKetidakhadiran(schoolId, month, year);
    title = "Rekap Ketidakhadiran & Slot Kosong";
    subtitle = r.period.label;
    body = (
      <table>
        <thead>
          <tr>
            <th>Tanggal</th><th>Kelas</th><th>Mapel</th><th>Guru</th>
            <th className="c">Jam</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {r.rows.map((row, i) => (
            <tr key={i} className={i % 2 === 1 ? "alt" : ""}>
              <td>{row.date}</td>
              <td>{row.className}</td>
              <td>{row.subject}</td>
              <td>{row.teacher}</td>
              <td className="c">{row.jam}</td>
              <td>
                <span className={row.status === "TIDAK_HADIR" ? "pill red" : "pill amber"}>
                  {row.status === "TIDAK_HADIR" ? "Tidak Hadir" : "Belum Diisi"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const filename = `rekap_${type}_${month}_${year}.pdf`;

  // For the portrait view, we render r.days as Day cards (reuse the report
  // already computed above so the weekly/monthly range is respected).
  if (type === "kelas" && kelasReport) {
    const r = kelasReport;

    body = (
      <div className="pdf-w-full" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {r.days.map((day, di) => {
          if (day.entries.length === 0 && day.special.length === 0) return null;
          return (
            <div key={day.date} className="pdf-day-card avoid-break">
              {/* Day Header */}
              <div className="pdf-day-header">
                <span className="pdf-text-zinc-800" style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{formatLongDate(day.date)}</span>
                <span className="pdf-text-zinc-500" style={{ fontSize: '10px', fontWeight: 'semibold', textTransform: 'uppercase' }}>Jurnal Harian</span>
              </div>
              
              {/* Table of the day */}
              <table className="pdf-w-full">
                <thead>
                  <tr>
                    <th style={{ width: "8%" }} className="c">Jam Ke</th>
                    <th style={{ width: "25%" }}>Mata Pelajaran</th>
                    <th style={{ width: "42%" }}>Pokok Bahasan / Capaian</th>
                    <th style={{ width: "25%" }}>Guru Mengajar</th>
                  </tr>
                </thead>
                <tbody>
                  {day.entries.map((e, i) => (
                    <tr key={day.date + "_" + i}>
                      <td className="c pdf-text-zinc-900" style={{ fontWeight: 'bold' }}>{e.no}</td>
                      <td>
                        <div className="pdf-text-zinc-900" style={{ fontWeight: 'bold', fontSize: '11px' }}>{e.subject ?? "-"}</div>
                        <div className="pdf-text-zinc-400" style={{ fontSize: '9px', fontWeight: '500', marginTop: '2px' }}>{e.waktu}</div>
                      </td>
                      <td>
                        <div className="pdf-text-zinc-900" style={{ fontWeight: '500', fontSize: '11px', lineHeight: '1.45' }}>{e.topic ?? "-"}</div>
                        {e.achievement && (
                          <div className="pdf-text-zinc-500 pdf-bg-zinc-50 pdf-border-zinc-100" style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '4px', padding: '4px 8px', borderRadius: '4px' }}>
                            Capaian: {e.achievement}
                          </div>
                        )}
                        {e.absen && Number(e.absen) > 0 ? (
                          <div className="pdf-text-rose-600 pdf-bg-rose-50 pdf-border-rose-100" style={{ fontSize: '9px', fontWeight: 'bold', borderRadius: '4px', padding: '2px 6px', display: 'inline-block', marginTop: '4px' }}>
                            Siswa Absen: {e.absen}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <div className="pdf-text-zinc-900" style={{ fontWeight: '500', fontSize: '11px' }}>{e.teacher ?? "-"}</div>
                        <span className="pdf-text-zinc-400" style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>{e.pencatat}</span>
                      </td>
                    </tr>
                  ))}
                  {day.special.map((s, i) => (
                    <tr key={day.date + "_special_" + i} className="pdf-bg-zinc-50-30">
                      <td className="c pdf-text-zinc-400">—</td>
                      <td colSpan={3} className="pdf-text-zinc-600" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                        ◦ {s}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        {r.days.length === 0 && (
          <div className="pdf-day-card" style={{ padding: '24px', textAlign: 'center', borderStyle: 'dashed' }}>
            <p className="pdf-text-zinc-500" style={{ fontSize: '12px', fontWeight: '500' }}>Tidak ada entri jurnal kelas pada periode ini.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="print-page">
      <style>{`
        .print-page {
          max-width: 800px; margin: 0 auto; padding: 24px;
          color: #18181b !important; background-color: #ffffff !important; font-size: 11px;
          font-family: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
        }
        .print-meta {
          display: flex; justify-content: space-between; align-items: baseline;
          margin: 0 0 20px 0; padding-bottom: 12px; border-bottom: 2px solid #e4e4e7 !important;
        }
        .print-title { font-size: 15px; font-weight: 800; margin: 0; letter-spacing: -0.02em; color: #09090b !important; }
        .print-title span { color: #71717a !important; font-weight: 600; }
        .print-sub { color: #71717a !important; font-size: 10px; font-weight: 500; }
        
        /* Explicit Standard Hex Colors for PDF render compatibility (No Tailwind oklab colors) */
        .pdf-w-full { width: 100% !important; }
        .pdf-day-card {
          margin-bottom: 20px;
          border: 1px solid #e4e4e7 !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          background-color: #ffffff !important;
        }
        .pdf-day-header {
          background-color: #fafafa !important;
          padding: 10px 16px;
          border-bottom: 1px solid #e4e4e7 !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pdf-border-b {
          border-bottom: 1px solid #e4e4e7 !important;
        }
        .pdf-text-zinc-900 { color: #18181b !important; }
        .pdf-text-zinc-800 { color: #27272a !important; }
        .pdf-text-zinc-700 { color: #3f3f46 !important; }
        .pdf-text-zinc-600 { color: #52525b !important; }
        .pdf-text-zinc-500 { color: #71717a !important; }
        .pdf-text-zinc-400 { color: #a1a1aa !important; }
        
        .pdf-bg-zinc-50 { background-color: #fafafa !important; }
        .pdf-bg-zinc-50-30 { background-color: rgba(250, 250, 250, 0.3) !important; }
        .pdf-bg-rose-50 { background-color: #fff1f2 !important; }
        .pdf-border-rose-100 { border: 1px solid #ffe4e6 !important; }
        .pdf-text-rose-600 { color: #e11d48 !important; }
        .pdf-border-zinc-100 { border: 1px solid #f4f4f5 !important; }

        table { width: 100%; border-collapse: collapse; }
        thead th {
          background-color: #fafafa !important; color: #71717a !important; font-weight: 700;
          font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;
          border-bottom: 1px solid #e4e4e7 !important;
          padding: 6px 10px; text-align: left; vertical-align: middle;
        }
        td {
          border-bottom: 1px solid #e4e4e7 !important; padding: 8px 10px;
          text-align: left; vertical-align: top; line-height: 1.45;
          color: #18181b !important;
        }
        td.c, th.c { text-align: center; }
        .day-card {
          margin-bottom: 20px;
        }
        .avoid-break {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .print-foot {
          margin-top: 24px; padding-top: 10px; border-top: 1px solid #e4e4e7 !important;
          color: #a1a1aa !important; font-size: 9px; display: flex; justify-content: space-between;
        }
        
        /* Guru/Ketidakhadiran Table styles */
        thead th.pdf-header-th {
          background-color: #f4f4f5 !important;
          color: #18181b !important;
          border: 1px solid #e4e4e7 !important;
          border-bottom: 2px solid #27272a !important;
        }
        tr.alt td { background-color: #fafafa !important; }
        tr.total td {
          background-color: #f4f4f5 !important; font-weight: 700; color: #09090b !important;
          border-top: 2px solid #e4e4e7 !important;
        }
        tr.notice td { background-color: #fafafa !important; color: #71717a !important; font-style: italic; font-size: 10px; }
        td.empty { color: #a1a1aa !important; padding: 24px; text-align: center; }
        .pill {
          display: inline-block; padding: 1.5px 6px; border-radius: 999px;
          font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em;
        }
        .pill.red { background-color: #fef2f2 !important; color: #991b1b !important; border: 1px solid #fecaca !important; }
        .pill.amber { background-color: #fffbeb !important; color: #92400e !important; border: 1px solid #fef08a !important; }

        @media print {
          .no-print { display: none !important; }
          .print-page { padding: 0; max-width: none; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>

      <PdfDownloader filename={filename} orientation="portrait" />

      <div id="print-area" className="bg-white p-2">
        <div className="print-meta">
          <p className="print-title">
            {title} — <span>{subtitle}</span>
          </p>
          <p className="print-sub">Dicetak {printedAt} · ASTRO JURNAL SEKOLAH</p>
        </div>

        {body}

        <div className="print-foot">
          <span>Arsip digital yang dihasilkan secara otomatis oleh ASTRO JURNAL SEKOLAH.</span>
          <span>{school?.name}</span>
        </div>
      </div>
    </div>
  );
}
