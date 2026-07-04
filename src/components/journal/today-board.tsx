"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
} from "lucide-react";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { addDays, formatLongDate, todayInTz } from "@/lib/tz";
import { ATTENDANCE_LABELS, ATTENDANCE_TONE, hhmm } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FillModal } from "@/components/journal/fill-modal";
import type { DayResponse, Slot } from "@/components/journal/types";

export function TodayBoard({ role }: { role: "SEKRETARIS" | "GURU" }) {
  const [date, setDate] = useState(() => todayInTz("Asia/Makassar"));
  const [data, setData] = useState<DayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Slot | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<DayResponse>(`/api/v1/me/today?date=${d}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat jadwal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const canFill = (slot: Slot) => {
    if (!data) return false;
    if (role === "SEKRETARIS") return data.mode !== "B";
    return data.mode !== "A"; // GURU
  };

  return (
    <div className="space-y-4">
      {/* Modern Date Navigation Toolbar */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-none">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-zinc-200"
            onClick={() => setDate(addDays(date, -1))}
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </Button>
          
          <div className="flex flex-col items-center text-center">
            <p className="text-sm font-bold text-zinc-900 leading-tight">{formatLongDate(date)}</p>
            {data?.class ? (
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Kelas {data.class.name}</p>
            ) : (
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Jadwal Aktif Hari Ini</p>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-zinc-200"
            onClick={() => setDate(addDays(date, 1))}
            aria-label="Berikutnya"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </Button>
        </div>

        {date !== todayInTz("Asia/Makassar") && (
          <div className="flex justify-center">
            <button
              onClick={() => setDate(todayInTz("Asia/Makassar"))}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-all duration-200"
            >
              Kembali ke Hari Ini
            </button>
          </div>
        )}
      </div>

      {data?.holiday && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800 font-medium">
          <CalendarOff className="h-4 w-4 shrink-0" />
          <p>Hari libur: {data.holiday}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-950" />
        </div>
      ) : data && data.slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-12 text-center">
          <p className="text-sm text-zinc-500 font-medium">Tidak ada jadwal mengajar pada hari ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.slots.map((slot) => {
            const e = slot.entry;
            return (
              <div
                key={slot.scheduleId}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all duration-200",
                  e
                    ? "border-zinc-200 hover:border-zinc-300"
                    : "border-dashed border-zinc-200 hover:border-zinc-300"
                )}
              >
                {/* Left: Time indicator */}
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-900">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 leading-none mb-0.5">Jam</span>
                  <span className="text-base font-extrabold leading-none">
                    {slot.periodNoStart}
                  </span>
                </div>

                {/* Center: Info text */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-sm text-zinc-900 leading-none">{slot.subject}</p>
                    {e?.correctedByTeacher && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-amber-50 text-amber-600 border border-amber-200/40" title="Dikoreksi Guru">
                        <Pencil className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-500 leading-none">
                    {hhmm(slot.startTime)}–{hhmm(slot.endTime)}
                    <span className="mx-1.5 text-zinc-300">•</span>
                    <span className="font-semibold text-zinc-700">
                      {role === "GURU" ? `Kelas ${slot.className}` : slot.teacher}
                    </span>
                  </p>
                  
                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {!e ? (
                      <span className="inline-flex items-center rounded-full bg-zinc-50 px-2 py-0.5 text-[9px] font-bold text-zinc-500 border border-zinc-200">
                        BELUM DIISI
                      </span>
                    ) : e.status === "TERKUNCI" ? (
                      <span className="inline-flex items-center rounded-full bg-zinc-50 px-2 py-0.5 text-[9px] font-bold text-zinc-800 border border-zinc-300">
                        🔒 TERKUNCI
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200/50">
                        TERCATAT
                      </span>
                    )}
                    
                    {e?.teacherAttendance && e.teacherAttendance !== "HADIR" && (
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border",
                        e.teacherAttendance === "TIDAK_HADIR" && "bg-rose-50 text-rose-700 border-rose-200/50",
                        e.teacherAttendance === "TERLAMBAT" && "bg-amber-50 text-amber-700 border-amber-200/50",
                        e.teacherAttendance === "DIGANTI" && "bg-blue-50 text-blue-700 border-blue-200/50",
                        e.teacherAttendance === "TUGAS_MANDIRI" && "bg-indigo-50 text-indigo-700 border-indigo-200/50",
                      )}>
                        {ATTENDANCE_LABELS[e.teacherAttendance].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Action button */}
                <Button
                  size="sm"
                  variant={e ? "outline" : "primary"}
                  className="rounded-xl h-8.5 font-medium px-4 border border-zinc-200 hover:bg-zinc-50 transition-colors"
                  onClick={() => setActive(slot)}
                >
                  {e ? "Lihat" : "Isi Jurnal"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {active && data && (
        <FillModal
          slot={active}
          date={date}
          teachers={data.teachers ?? []}
          canFill={canFill(active)}
          onClose={() => setActive(null)}
          onSaved={() => {
            setActive(null);
            load(date);
          }}
        />
      )}
    </div>
  );
}
