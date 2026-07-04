"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { ATTENDANCE_LABELS, ATTENDANCE_TONE } from "@/lib/labels";
import { formatLongDate } from "@/lib/tz";
import { Badge } from "@/components/ui/badge";
import { EntryModal } from "@/components/journal/entry-modal";
import type { Person } from "@/components/journal/types";

type EntryRow = {
  id: string;
  date: string;
  className: string;
  subject: string | null;
  teacher: string | null;
  periodNoStart: number;
  periodNoEnd: number;
  jpCount: number;
  teacherAttendance: string | null;
  topic: string | null;
  status: string;
  correctedByTeacher: boolean;
};

export function JournalList({
  query,
  editable,
  teachers,
  emptyText = "Belum ada entri jurnal.",
}: {
  query: string;
  editable: boolean;
  teachers: Person[];
  emptyText?: string;
}) {
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<EntryRow[]>(`/api/v1/journal-entries?${query}`);
      setRows(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (error)
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
    );
  if (rows.length === 0)
    return (
      <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );

  // Group by date
  const byDate = new Map<string, EntryRow[]>();
  for (const r of rows) {
    const list = byDate.get(r.date) ?? [];
    list.push(r);
    byDate.set(r.date, list);
  }

  return (
    <div className="space-y-5">
      {[...byDate.entries()].map(([date, list]) => (
        <div key={date}>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">
            {formatLongDate(date)}
          </p>
          <div className="space-y-2">
            {list.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left hover:border-primary"
              >
                <div className="flex w-10 shrink-0 flex-col items-center">
                  <span className="text-[10px] text-muted-foreground">Jam</span>
                  <span className="font-bold leading-none">{r.periodNoStart}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {r.subject ?? "Kegiatan"} · {r.className}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.topic || "— tanpa pokok bahasan —"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {r.status === "TERKUNCI" ? (
                      <Badge tone="info">Terkunci</Badge>
                    ) : (
                      <Badge tone="success">Tercatat</Badge>
                    )}
                    {r.teacherAttendance && (
                      <Badge tone={ATTENDANCE_TONE[r.teacherAttendance]}>
                        {ATTENDANCE_LABELS[r.teacherAttendance]}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {r.jpCount} JP
                    </span>
                    {r.correctedByTeacher && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Pencil className="h-3 w-3" /> dikoreksi guru
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {activeId && (
        <EntryModal
          entryId={activeId}
          teachers={teachers}
          editable={editable}
          onClose={() => setActiveId(null)}
          onSaved={() => {
            setActiveId(null);
            load();
          }}
        />
      )}
    </div>
  );
}
