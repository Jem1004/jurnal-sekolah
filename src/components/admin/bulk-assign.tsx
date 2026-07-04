"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import type { Option } from "@/components/admin/crud-manager";

export function BulkAssign({
  academicYears,
  teachers,
  subjects,
  classes,
}: {
  academicYears: Option[];
  teachers: Option[];
  subjects: Option[];
  classes: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ay, setAy] = useState(academicYears[0]?.value ?? "");
  const [teacher, setTeacher] = useState("");
  const [subject, setSubject] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function reset() {
    setAy(academicYears[0]?.value ?? "");
    setTeacher("");
    setSubject("");
    setClassIds([]);
    setMsg(null);
  }

  async function submit() {
    if (!ay || !teacher || !subject || classIds.length === 0) {
      setMsg({ ok: false, text: "Lengkapi tahun ajaran, guru, mapel, dan minimal satu kelas." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiFetch<{ created: number; skipped: number }>(
        "/api/v1/admin/assignments/bulk",
        {
          method: "POST",
          body: JSON.stringify({
            academicYearId: ay,
            teacherId: teacher,
            subjectId: subject,
            classIds,
          }),
        },
      );
      router.refresh();
      setMsg({
        ok: true,
        text: `${res.created} penugasan dibuat${res.skipped ? `, ${res.skipped} sudah ada` : ""}.`,
      });
      setClassIds([]);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Gagal." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { reset(); setOpen(true); }}>
        <Layers className="h-4 w-4" />
        Tambah Massal
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah Penugasan Massal"
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={busy}>
              Tutup
            </Button>
            <Button type="button" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Buat
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <p className="text-sm text-muted-foreground">
            Tugaskan satu guru + mapel ke beberapa kelas sekaligus.
          </p>
          <div>
            <Label htmlFor="ba-ay">Tahun Ajaran</Label>
            <Select id="ba-ay" value={ay} onChange={(e) => setAy(e.target.value)}>
              {academicYears.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ba-teacher">Guru</Label>
            <Select id="ba-teacher" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
              <option value="">— pilih guru —</option>
              {teachers.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ba-subject">Mata Pelajaran</Label>
            <Select id="ba-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">— pilih mapel —</option>
              {subjects.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Kelas</Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {classes.map((o) => {
                const checked = classIds.includes(o.value);
                return (
                  <label
                    key={o.value}
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
                        setClassIds((s) =>
                          e.target.checked ? [...s, o.value] : s.filter((v) => v !== o.value),
                        )
                      }
                    />
                    {o.label}
                  </label>
                );
              })}
            </div>
          </div>
          {msg && (
            <p
              className={
                msg.ok
                  ? "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
                  : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              }
            >
              {msg.text}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
