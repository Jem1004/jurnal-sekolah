"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2 } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import type { Option } from "@/components/admin/crud-manager";

export function GenerateSlots({ dayOptions }: { dayOptions: Option[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(dayOptions[0]?.value ?? "1");
  const [startTime, setStartTime] = useState("07:00");
  const [jpDuration, setJpDuration] = useState("40");
  const [jpCount, setJpCount] = useState("8");
  const [startPeriodNo, setStartPeriodNo] = useState("1");
  const [breakEvery, setBreakEvery] = useState("4");
  const [breakMinutes, setBreakMinutes] = useState("30");
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiFetch<{ created: number }>(
        "/api/v1/period-templates/generate",
        {
          method: "POST",
          body: JSON.stringify({
            day: Number(day),
            startTime,
            jpDuration: Number(jpDuration),
            jpCount: Number(jpCount),
            startPeriodNo: Number(startPeriodNo),
            breakEvery: Number(breakEvery),
            breakMinutes: Number(breakMinutes),
            overwrite,
          }),
        },
      );
      router.refresh();
      setMsg({ ok: true, text: `${res.created} slot dibuat.` });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Gagal." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setMsg(null); setOpen(true); }}>
        <Wand2 className="h-4 w-4" />
        Generate Otomatis
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Generate Jam Pelajaran Otomatis"
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={busy}>
              Tutup
            </Button>
            <Button type="button" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <p className="text-sm text-muted-foreground">
            Buat slot KBM berurutan otomatis, lengkap dengan sisipan istirahat.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="g-day">Hari</Label>
              <Select id="g-day" value={day} onChange={(e) => setDay(e.target.value)}>
                {dayOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="g-start">Jam mulai</Label>
              <Input id="g-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="g-dur">Durasi/JP (menit)</Label>
              <Input id="g-dur" type="number" min={5} value={jpDuration} onChange={(e) => setJpDuration(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="g-count">Jumlah JP</Label>
              <Input id="g-count" type="number" min={1} value={jpCount} onChange={(e) => setJpCount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="g-startno">Mulai jam ke-</Label>
              <Input id="g-startno" type="number" min={0} value={startPeriodNo} onChange={(e) => setStartPeriodNo(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary/40 p-3">
            <div>
              <Label htmlFor="g-be">Istirahat tiap … JP</Label>
              <Input id="g-be" type="number" min={0} value={breakEvery} onChange={(e) => setBreakEvery(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="g-bm">Lama istirahat (menit)</Label>
              <Input id="g-bm" type="number" min={0} value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} />
            </div>
            <p className="col-span-2 text-xs text-muted-foreground">
              Isi 0 pada &quot;tiap … JP&quot; jika tanpa istirahat.
            </p>
          </div>

          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
            />
            <span className="text-sm">Timpa jam pelajaran hari ini jika sudah ada</span>
          </label>

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
