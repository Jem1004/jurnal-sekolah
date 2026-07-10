"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Download, Loader2, Lock, Printer } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { MONTH_LABEL, formatLongDate } from "@/lib/tz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Option } from "@/components/admin/crud-manager";

/* eslint-disable @typescript-eslint/no-explicit-any */

type ReportType = "guru" | "kelas" | "absen";

export function RekapClient({
  classes,
  defaultMonth,
  defaultYear,
}: {
  classes: Option[];
  defaultMonth: number;
  defaultYear: number;
}) {
  const [type, setType] = useState<ReportType>("guru");
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [periode, setPeriode] = useState<"bulan" | "minggu">("bulan");
  const [weekDate, setWeekDate] = useState("");
  const [classId, setClassId] = useState(classes[0]?.value ?? "");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);

  const weekly = type === "kelas" && periode === "minggu";

  const params = useCallback(() => {
    const p = new URLSearchParams({
      type,
      month: String(month),
      year: String(year),
    });
    if (type === "kelas" && classId) p.set("class_id", classId);
    if (weekly && weekDate) p.set("week", weekDate);
    return p;
  }, [type, month, year, classId, weekly, weekDate]);

  const load = useCallback(async () => {
    if (type === "kelas" && !classId) {
      setError("Pilih kelas terlebih dahulu.");
      return;
    }
    if (weekly && !weekDate) {
      setError("Pilih tanggal di dalam minggu yang diinginkan.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<any>(`/api/v1/reports/monthly?${params()}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat rekap.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params, type, classId, weekly, weekDate]);

  useEffect(() => {
    setData(null);
  }, [type, month, year, classId, periode, weekDate]);

  function excelDownload() {
    const p = params();
    p.set("format", "xlsx");
    window.location.href = `/api/v1/reports/monthly?${p}`;
  }
  function printReport() {
    window.open(`/rekap/cetak?${params()}`, "_blank");
  }

  async function lockMonth() {
    if (
      !confirm(
        `Kunci semua entri ${MONTH_LABEL[month - 1]} ${year}? Entri terkunci tidak bisa diubah kecuali dibuka admin.`,
      )
    )
      return;
    setLocking(true);
    try {
      const res = await apiFetch<{ locked: number }>(
        "/api/v1/reports/monthly/lock",
        { method: "POST", body: JSON.stringify({ month, year }) },
      );
      alert(`${res.locked} entri dikunci.`);
      setData(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal mengunci.");
    } finally {
      setLocking(false);
    }
  }

  const years = [defaultYear - 1, defaultYear, defaultYear + 1];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor="r-type">Jenis Rekap</Label>
          <Select
            id="r-type"
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
          >
            <option value="guru">Per Guru</option>
            <option value="kelas">Per Kelas (jurnal)</option>
            <option value="absen">Ketidakhadiran</option>
          </Select>
        </div>
        {type === "kelas" && (
          <div>
            <Label htmlFor="r-periode">Periode</Label>
            <Select
              id="r-periode"
              value={periode}
              onChange={(e) => setPeriode(e.target.value as "bulan" | "minggu")}
            >
              <option value="bulan">Bulanan</option>
              <option value="minggu">Mingguan</option>
            </Select>
          </div>
        )}
        {weekly ? (
          <div>
            <Label htmlFor="r-week">Tanggal dalam minggu</Label>
            <Input
              id="r-week"
              type="date"
              value={weekDate}
              onChange={(e) => setWeekDate(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="r-month">Bulan</Label>
              <Select id="r-month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTH_LABEL.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="r-year">Tahun</Label>
              <Select id="r-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          </>
        )}
        {type === "kelas" && (
          <div>
            <Label htmlFor="r-class">Kelas</Label>
            <Select id="r-class" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={load} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Tampilkan
        </Button>
        <Button variant="outline" onClick={excelDownload} disabled={loading}>
          <Download className="h-4 w-4" /> Unduh Excel
        </Button>
        <Button variant="outline" onClick={printReport} disabled={loading}>
          <Printer className="h-4 w-4" /> Cetak PDF
        </Button>
        <Button variant="destructive" onClick={lockMonth} disabled={locking}>
          {locking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Kunci Bulan
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {data && data.type === type && <Preview data={data} />}
    </div>
  );
}

function Preview({ data }: { data: any }) {
  // Use the data's own type so the rendered branch always matches its shape,
  // even if the `type` selector changed before new data loaded.
  const type: ReportType = data.type;
  if (type === "guru") {
    return (
      <div className="overflow-x-auto rounded-[1.5rem] border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              {["Guru", "Mapel", "Kelas", "Pertemuan", "JP Terlaksana", "JP Seharusnya", "Selisih", "% Hadir"].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.teachers.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data untuk periode ini.</td></tr>
            )}
            {data.teachers.map((t: any) => (
              <Fragment key={t.teacherId}>
                {t.rows.map((r: any, i: number) => (
                  <tr key={t.teacherId + i} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground">{i === 0 ? t.teacherName : ""}</td>
                    <td className="px-4 py-2.5">{r.subject}</td>
                    <td className="px-4 py-2.5">{r.className}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.pertemuan}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.jpTerlaksana}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.jpSeharusnya}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.selisih}</td>
                    <td className="px-4 py-2.5 tabular-nums font-semibold">{r.persen}%</td>
                  </tr>
                ))}
                <tr key={t.teacherId + "-tot"} className="bg-secondary/40 font-semibold text-foreground">
                  <td className="px-4 py-2.5" colSpan={3}>Total {t.teacherName}</td>
                  <td className="px-4 py-2.5 tabular-nums">{t.totals.pertemuan}</td>
                  <td className="px-4 py-2.5 tabular-nums">{t.totals.jpTerlaksana}</td>
                  <td className="px-4 py-2.5 tabular-nums">{t.totals.jpSeharusnya}</td>
                  <td className="px-4 py-2.5 tabular-nums">{t.totals.selisih}</td>
                  <td className="px-4 py-2.5 tabular-nums">{t.totals.persen}%</td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === "kelas") {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Jurnal Kelas {data.className} — {data.period.label}</h3>
        {data.days.length === 0 && (
          <p className="text-sm text-muted-foreground">Tidak ada entri pada periode ini.</p>
        )}
        {data.days.map((day: any) => (
          <div key={day.date} className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-none">
            <p className="mb-3 text-sm font-semibold text-foreground">{formatLongDate(day.date)}</p>
            <div className="overflow-x-auto rounded-xl border border-border/40">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">No</th>
                    <th className="px-3 py-2">Jam Ke-</th>
                    <th className="px-3 py-2">Mapel</th>
                    <th className="px-3 py-2">Pokok Bahasan</th>
                    <th className="px-3 py-2">Capaian</th>
                    <th className="px-3 py-2">JP</th>
                    <th className="px-3 py-2">Absen</th>
                    <th className="px-3 py-2">Guru / Pencatat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {day.entries.map((e: any, i: number) => (
                    <tr key={i} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-3 py-2.5 tabular-nums">{e.no}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-medium text-foreground">{e.waktu}</td>
                      <td className="px-3 py-2.5 font-medium">{e.subject ?? "-"}</td>
                      <td className="px-3 py-2.5">{e.topic || "-"}</td>
                      <td className="px-3 py-2.5">{e.achievement || "-"}</td>
                      <td className="px-3 py-2.5 tabular-nums">{e.jp}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums">{e.absen ?? "-"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {e.teacher ?? "-"} · {e.pencatat}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {day.special.map((s: string, i: number) => (
              <p key={i} className="mt-2 text-xs italic text-muted-foreground">Catatan: {s}</p>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // absen
  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-border/60 bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            {["Tanggal", "Kelas", "Mapel", "Guru", "Jam", "Status"].map((h) => (
              <th key={h} className="px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.rows.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Tidak ada anomali. Semua slot terisi. 🎉</td></tr>
          )}
          {data.rows.map((r: any, i: number) => (
            <tr key={i} className="hover:bg-secondary/40 transition-colors">
              <td className="px-4 py-2.5 tabular-nums font-medium text-foreground">{r.date}</td>
              <td className="px-4 py-2.5">{r.className}</td>
              <td className="px-4 py-2.5">{r.subject}</td>
              <td className="px-4 py-2.5">{r.teacher}</td>
              <td className="px-4 py-2.5 tabular-nums">{r.jam}</td>
              <td className="px-4 py-2.5">
                {r.status === "TIDAK_HADIR" ? (
                  <Badge tone="danger">Tidak Hadir</Badge>
                ) : (
                  <Badge tone="warning">Belum Diisi</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
