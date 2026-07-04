"use client";

import { useEffect, useState } from "react";
import { History, Loader2, Lock } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { ATTENDANCE_LABELS, formatDateTime } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { TopicAutocomplete } from "@/components/journal/topic-autocomplete";
import type { Person } from "@/components/journal/types";

const ATT_ORDER = [
  "HADIR",
  "TERLAMBAT",
  "TIDAK_HADIR",
  "DIGANTI",
  "TUGAS_MANDIRI",
] as const;

type Detail = {
  id: string;
  teachingAssignmentId: string | null;
  periodNoStart: number;
  periodNoEnd: number;
  subject: string | null;
  className: string;
  teacher: string | null;
  teacherAttendance: string | null;
  substituteTeacherId: string | null;
  topic: string | null;
  achievement: string | null;
  notes: string | null;
  absentCount: number | null;
  status: string;
};

type HistoryRow = {
  action: string;
  by: string | null;
  at: string;
  diff: unknown;
};

export function EntryModal({
  entryId,
  teachers,
  editable,
  onClose,
  onSaved,
}: {
  entryId: string;
  teachers: Person[];
  editable: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState("HADIR");
  const [substituteId, setSubstituteId] = useState("");
  const [topic, setTopic] = useState("");
  const [achievement, setAchievement] = useState("");
  const [notes, setNotes] = useState("");
  const [absentCount, setAbsentCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await apiFetch<Detail>(`/api/v1/journal-entries/${entryId}`);
        setDetail(d);
        setAttendance(d.teacherAttendance ?? "HADIR");
        setSubstituteId(d.substituteTeacherId ?? "");
        setTopic(d.topic ?? "");
        setAchievement(d.achievement ?? "");
        setNotes(d.notes ?? "");
        setAbsentCount(d.absentCount != null ? String(d.absentCount) : "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat entri.");
      } finally {
        setLoading(false);
      }
    })();
  }, [entryId]);

  async function loadHistory() {
    try {
      const h = await apiFetch<HistoryRow[]>(
        `/api/v1/journal-entries/${entryId}/history`,
      );
      setHistory(h);
    } catch {
      setHistory([]);
    }
  }

  const locked = detail?.status === "TERKUNCI";
  const readOnly = !editable || locked;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/journal-entries/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify({
          teacherAttendance: attendance,
          substituteTeacherId: attendance === "DIGANTI" ? substituteId || null : null,
          topic: topic || null,
          achievement: achievement || null,
          notes: notes || null,
          absentCount: absentCount === "" ? null : Number(absentCount),
        }),
      });
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
      title={
        detail
          ? `${detail.subject ?? "Kegiatan"} · ${detail.className}`
          : "Entri Jurnal"
      }
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
            <Button type="submit" form="entry-form" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </>
        )
      }
    >
      {loading || !detail ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <form id="entry-form" onSubmit={submit} className="space-y-4">
          <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
            <p className="font-medium">
              Jam ke-{detail.periodNoStart}
              {detail.periodNoEnd !== detail.periodNoStart && `–${detail.periodNoEnd}`}{" "}
              · {detail.teacher}
            </p>
          </div>

          {locked && (
            <p className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <Lock className="h-4 w-4" /> Entri terkunci — hanya bisa dilihat.
            </p>
          )}

          <div>
            <Label>Kehadiran Guru</Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {ATT_ORDER.map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setAttendance(a)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-medium transition-colors disabled:opacity-60",
                    attendance === a
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-secondary",
                  )}
                >
                  {ATTENDANCE_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {attendance === "DIGANTI" && (
            <div>
              <Label htmlFor="e-sub">Guru Pengganti</Label>
              <Select
                id="e-sub"
                value={substituteId}
                disabled={readOnly}
                onChange={(e) => setSubstituteId(e.target.value)}
              >
                <option value="">— pilih guru —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="e-topic">Pokok Bahasan</Label>
            <TopicAutocomplete
              id="e-topic"
              assignmentId={detail.teachingAssignmentId}
              field="topic"
              value={topic}
              onChange={setTopic}
              placeholder="Materi yang diajarkan…"
            />
          </div>

          <div>
            <Label htmlFor="e-ach">Capaian Pembelajaran</Label>
            <TopicAutocomplete
              id="e-ach"
              assignmentId={detail.teachingAssignmentId}
              field="achievement"
              value={achievement}
              onChange={setAchievement}
              placeholder="Capaian yang dicapai hari ini…"
            />
          </div>

          <div>
            <Label htmlFor="e-absent">Jumlah Siswa Absen (opsional)</Label>
            <Input
              id="e-absent"
              type="number"
              min={0}
              max={999}
              inputMode="numeric"
              placeholder="0"
              value={absentCount}
              disabled={readOnly}
              onChange={(e) => setAbsentCount(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Cukup jumlahnya — rincian nama dicatat di aplikasi absensi.
            </p>
          </div>

          <div>
            <Label htmlFor="e-notes">Catatan (opsional)</Label>
            <Textarea
              id="e-notes"
              value={notes}
              disabled={readOnly}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* History */}
          <div className="border-t border-border pt-3">
            {history === null ? (
              <button
                type="button"
                onClick={loadHistory}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <History className="h-4 w-4" /> Lihat riwayat perubahan
              </button>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {history.map((h, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      <span className="font-medium text-foreground">{h.action}</span>{" "}
                      oleh {h.by ?? "sistem"}
                    </span>
                    <span>{formatDateTime(h.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </form>
      )}
    </Modal>
  );
}
