"use client";

import { useMemo, useState } from "react";
import { Copy, Plus, X, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { DAY_LABELS, hhmm } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";

export type Cls = { id: string; name: string; academicYearId: string };
export type Asg = { id: string; classId: string; label: string; short: string };
export type Tpl = { dayOfWeek: number; periodNo: number; startTime: string };
export type Sch = {
  id: string;
  classId: string;
  dayOfWeek: number;
  periodNoStart: number;
  periodNoEnd: number;
  teachingAssignmentId: string;
};

const DAYS = [1, 2, 3, 4, 5];

export function ScheduleGrid({
  classes,
  assignments,
  templates,
  schedules,
}: {
  classes: Cls[];
  assignments: Asg[];
  templates: Tpl[];
  schedules: Sch[];
}) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [scheds, setScheds] = useState<Sch[]>(schedules);
  const [adding, setAdding] = useState<{ day: number; period: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Quick-fill: when an assignment is chosen, clicking empty cells assigns it.
  const [quickAsg, setQuickAsg] = useState("");

  const [copyOpen, setCopyOpen] = useState(false);
  const [copyFrom, setCopyFrom] = useState(1);
  const [copyTo, setCopyTo] = useState<number[]>([]);
  const [copyOverwrite, setCopyOverwrite] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const cls = classes.find((c) => c.id === classId);
  const clsAssignments = assignments.filter((a) => a.classId === classId);
  const clsScheds = useMemo(
    () => scheds.filter((s) => s.classId === classId),
    [scheds, classId],
  );

  const periods = useMemo(
    () => [...new Set(templates.map((t) => t.periodNo))].sort((a, b) => a - b),
    [templates],
  );

  const timeFor = (day: number, period: number) =>
    templates.find((t) => t.dayOfWeek === day && t.periodNo === period)
      ?.startTime;
  const schedFor = (day: number, period: number) =>
    clsScheds.find(
      (s) =>
        s.dayOfWeek === day &&
        s.periodNoStart <= period &&
        period <= s.periodNoEnd,
    );
  const asgLabel = (id: string) =>
    assignments.find((a) => a.id === id)?.short ?? "?";

  async function add(day: number, period: number, teachingAssignmentId: string) {
    if (!cls || !teachingAssignmentId) return;
    setBusy(true);
    setError(null);
    try {
      const row = await apiFetch<Sch>("/api/v1/admin/schedules", {
        method: "POST",
        body: JSON.stringify({
          academicYearId: cls.academicYearId,
          classId: cls.id,
          dayOfWeek: day,
          periodNoStart: period,
          periodNoEnd: period,
          teachingAssignmentId,
        }),
      });
      setScheds((s) => [...s, row]);
      setAdding(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah jadwal.");
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/schedules/${id}`, { method: "DELETE" });
      setScheds((s) => s.filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setBusy(false);
    }
  }

  async function reloadClass() {
    const fresh = await apiFetch<Sch[]>(
      `/api/v1/admin/schedules?class_id=${classId}`,
    );
    setScheds((s) => [...s.filter((x) => x.classId !== classId), ...fresh]);
  }

  async function submitCopy() {
    if (!cls) return;
    const targets = copyTo.filter((d) => d !== copyFrom);
    if (targets.length === 0) {
      setCopyMsg({ ok: false, text: "Pilih minimal satu hari tujuan." });
      return;
    }
    setCopyBusy(true);
    setCopyMsg(null);
    try {
      const res = await apiFetch<{ copied: number; skipped: number }>(
        "/api/v1/schedules/copy",
        {
          method: "POST",
          body: JSON.stringify({
            classId,
            fromDay: copyFrom,
            toDays: targets,
            overwrite: copyOverwrite,
          }),
        },
      );
      await reloadClass();
      setCopyMsg({
        ok: true,
        text: `${res.copied} slot disalin${res.skipped ? `, ${res.skipped} dilewati (bentrok/terisi)` : ""}.`,
      });
    } catch (err) {
      setCopyMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Gagal menyalin.",
      });
    } finally {
      setCopyBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Label htmlFor="grid-class">Kelas</Label>
          <Select
            id="grid-class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setAdding(null);
              setQuickAsg("");
              setError(null);
            }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-[220px] flex-1">
          <Label htmlFor="grid-quick">Isi cepat (klik sel untuk menaruh)</Label>
          <Select
            id="grid-quick"
            value={quickAsg}
            onChange={(e) => setQuickAsg(e.target.value)}
            disabled={clsAssignments.length === 0}
          >
            <option value="">— nonaktif (pilih per sel) —</option>
            {clsAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.short}
              </option>
            ))}
          </Select>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={() => {
            setCopyFrom(1);
            setCopyTo([]);
            setCopyOverwrite(false);
            setCopyMsg(null);
            setCopyOpen(true);
          }}
          disabled={clsAssignments.length === 0}
        >
          <Copy className="h-4 w-4" />
          Salin Hari
        </Button>

        {busy && (
          <span className="flex items-center gap-1.5 pb-2.5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan…
          </span>
        )}
      </div>

      {quickAsg && (
        <p className="rounded-lg bg-primary-muted px-3 py-2 text-sm text-accent-foreground">
          Mode isi cepat aktif — klik sel kosong untuk menaruh{" "}
          <strong>{asgLabel(quickAsg)}</strong>.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {clsAssignments.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Kelas ini belum punya penugasan mengajar. Tambahkan di menu Penugasan
          agar bisa dijadwalkan.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="w-16 border-b border-r border-border px-2 py-2 text-xs font-medium text-muted-foreground">
                Jam
              </th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className="border-b border-border px-2 py-2 text-center font-medium"
                >
                  {DAY_LABELS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td className="border-r border-border px-2 py-2 text-center align-top text-xs font-medium text-muted-foreground">
                  ke-{period}
                </td>
                {DAYS.map((day) => {
                  const hasSlot = Boolean(timeFor(day, period));
                  const sched = schedFor(day, period);
                  const isAdding =
                    adding?.day === day && adding?.period === period;
                  return (
                    <td
                      key={day}
                      className="min-w-[120px] border border-border p-1 align-top"
                    >
                      {!hasSlot ? (
                        <div className="py-2 text-center text-xs text-muted-foreground/50">
                          –
                        </div>
                      ) : sched ? (
                        <div className="group relative rounded-md bg-primary-muted px-2 py-1.5">
                          <p className="pr-4 text-xs font-medium text-accent-foreground">
                            {asgLabel(sched.teachingAssignmentId)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {hhmm(timeFor(day, period))}
                          </p>
                          <button
                            onClick={() => del(sched.id)}
                            disabled={busy}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-red-100 hover:text-destructive group-hover:opacity-100"
                            aria-label="Hapus"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : isAdding ? (
                        <Select
                          autoFocus
                          className="h-9 text-xs"
                          defaultValue=""
                          onChange={(e) => add(day, period, e.target.value)}
                          onBlur={() => setAdding(null)}
                        >
                          <option value="" disabled>
                            pilih…
                          </option>
                          {clsAssignments.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.short}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <button
                          onClick={() => {
                            setError(null);
                            if (quickAsg) add(day, period, quickAsg);
                            else setAdding({ day, period });
                          }}
                          disabled={clsAssignments.length === 0}
                          className={cn(
                            "flex h-9 w-full items-center justify-center rounded-md text-muted-foreground/60 hover:bg-secondary hover:text-primary disabled:opacity-30",
                            quickAsg && "hover:bg-primary-muted",
                          )}
                          aria-label="Tambah jadwal"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Sistem menolak jadwal yang bentrok (kelas atau guru sudah terpakai pada
        jam tersebut).
      </p>

      <Modal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        title={`Salin Jadwal ${cls?.name ?? ""} Antar-Hari`}
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setCopyOpen(false)} disabled={copyBusy}>
              Tutup
            </Button>
            <Button type="button" onClick={submitCopy} disabled={copyBusy}>
              {copyBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              Salin
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Salin seluruh jadwal kelas ini dari satu hari ke hari lain. Slot yang
            bentrok (guru/kelas) otomatis dilewati.
          </p>
          <div>
            <Label htmlFor="sc-from">Salin dari hari</Label>
            <Select id="sc-from" value={String(copyFrom)} onChange={(e) => setCopyFrom(Number(e.target.value))}>
              {DAYS.map((d) => (
                <option key={d} value={d}>{DAY_LABELS[d]}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Ke hari</Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {DAYS.filter((d) => d !== copyFrom).map((d) => {
                const checked = copyTo.includes(d);
                return (
                  <label
                    key={d}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                      checked ? "border-primary bg-primary-muted" : "border-border hover:bg-secondary",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--primary)]"
                      checked={checked}
                      onChange={(e) =>
                        setCopyTo((s) => (e.target.checked ? [...s, d] : s.filter((v) => v !== d)))
                      }
                    />
                    {DAY_LABELS[d]}
                  </label>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              checked={copyOverwrite}
              onChange={(e) => setCopyOverwrite(e.target.checked)}
            />
            <span className="text-sm">Timpa jadwal yang sudah ada di hari tujuan</span>
          </label>
          {copyMsg && (
            <p
              className={
                copyMsg.ok
                  ? "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
                  : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              }
            >
              {copyMsg.text}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
