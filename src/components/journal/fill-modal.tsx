"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Minus, Plus } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { ATTENDANCE_LABELS, hhmm } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { TopicAutocomplete } from "@/components/journal/topic-autocomplete";
import type { Person, Slot } from "@/components/journal/types";

const ATT_ORDER = [
  "HADIR",
  "TERLAMBAT",
  "TIDAK_HADIR",
  "DIGANTI",
  "TUGAS_MANDIRI",
] as const;

type Detail = {
  teacherAttendance: string | null;
  topic: string | null;
  achievement: string | null;
  notes: string | null;
  absentCount: number | null;
  substituteTeacherId: string | null;
  status: string;
};



export function FillModal({
  slot,
  date,
  teachers,
  canFill,
  onClose,
  onSaved,
}: {
  slot: Slot;
  date: string;
  teachers: Person[];
  canFill: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(slot.entry);
  const [loading, setLoading] = useState(editing);
  const [attendance, setAttendance] = useState("HADIR");
  const [substituteId, setSubstituteId] = useState("");
  const [topic, setTopic] = useState("");
  const [achievement, setAchievement] = useState("");
  const [notes, setNotes] = useState("");
  const [absentCount, setAbsentCount] = useState("");
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slot.entry) return;
    (async () => {
      try {
        const d = await apiFetch<Detail>(
          `/api/v1/journal-entries/${slot.entry!.id}`,
        );
        setAttendance(d.teacherAttendance ?? "HADIR");
        setSubstituteId(d.substituteTeacherId ?? "");
        setTopic(d.topic ?? "");
        setAchievement(d.achievement ?? "");
        setNotes(d.notes ?? "");
        setAbsentCount(d.absentCount != null ? String(d.absentCount) : "");
        setLocked(d.status === "TERKUNCI");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readOnly = locked || !canFill;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      teacherAttendance: attendance,
      substituteTeacherId: attendance === "DIGANTI" ? substituteId || null : null,
      topic: topic || null,
      achievement: achievement || null,
      notes: notes || null,
      absentCount: absentCount === "" ? null : Number(absentCount),
    };
    try {
      if (editing) {
        await apiFetch(`/api/v1/journal-entries/${slot.entry!.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/api/v1/journal-entries`, {
          method: "POST",
          body: JSON.stringify({ date, scheduleId: slot.scheduleId, ...payload }),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${slot.subject} · Jam ke-${slot.periodNoStart}${slot.periodNoEnd !== slot.periodNoStart ? `–${slot.periodNoEnd}` : ""}`}
      footer={
        readOnly ? (
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        ) : (
          <>
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" form="fill-form" disabled={submitting || loading}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </>
        )
      }
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <form id="fill-form" onSubmit={submit} className="space-y-4">
          <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
            <p className="font-medium">
              {slot.className} · {slot.teacher}
            </p>
            <p className="text-muted-foreground">
              {hhmm(slot.startTime)}–{hhmm(slot.endTime)}
            </p>
          </div>

          {locked && (
            <p className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <Lock className="h-4 w-4" /> Entri terkunci — hanya bisa dilihat.
            </p>
          )}

          {/* Attendance */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Kehadiran Guru
            </Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {ATT_ORDER.map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setAttendance(a)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 disabled:opacity-60",
                    attendance === a
                      ? "border-primary bg-primary text-primary-foreground font-semibold shadow-none"
                      : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 text-zinc-700",
                  )}
                >
                  {ATTENDANCE_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {attendance === "DIGANTI" && (
            <div className="space-y-2">
              <Label htmlFor="sub" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guru Pengganti</Label>
              <Select
                id="sub"
                value={substituteId}
                disabled={readOnly}
                onChange={(e) => setSubstituteId(e.target.value)}
                className="rounded-xl bg-zinc-50/50"
              >
                <option value="">— pilih guru —</option>
                {teachers
                  .filter((t) => t.id !== slot.teacherId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </Select>
            </div>
          )}

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pokok Bahasan
            </Label>
            <TopicAutocomplete
              id="topic"
              assignmentId={slot.assignmentId}
              field="topic"
              value={topic}
              onChange={setTopic}
              placeholder="Materi yang diajarkan…"
            />
          </div>

          {/* Achievement */}
          <div className="space-y-2">
            <Label htmlFor="ach" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capaian Pembelajaran
            </Label>
            <TopicAutocomplete
              id="ach"
              assignmentId={slot.assignmentId}
              field="achievement"
              value={achievement}
              onChange={setAchievement}
              placeholder="Boleh dikosongkan — guru dapat melengkapi."
            />
          </div>

          {/* Absent count */}
          <div className="space-y-2">
            <Label htmlFor="absent" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Jumlah Siswa Absen (opsional)
            </Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={readOnly || Number(absentCount || 0) <= 0}
                onClick={() => setAbsentCount(String(Math.max(0, Number(absentCount || 0) - 1)))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <Input
                id="absent"
                type="number"
                min={0}
                max={999}
                inputMode="numeric"
                placeholder="0"
                value={absentCount}
                disabled={readOnly}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (Number(val) >= 0 && Number(val) <= 999)) {
                    setAbsentCount(val);
                  }
                }}
                className="h-10 w-20 text-center font-semibold rounded-xl bg-zinc-50/50"
              />
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setAbsentCount(String(Number(absentCount || 0) + 1))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground font-medium">
                Siswa
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Rincian nama siswa absen dicatat langsung di aplikasi absensi kelas.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Catatan (opsional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              disabled={readOnly}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan khusus proses mengajar..."
              className="rounded-xl bg-zinc-50/50"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive font-medium">
              {error}
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
