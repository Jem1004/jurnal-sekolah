"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type SchoolData = {
  name: string;
  npsn: string | null;
  address: string | null;
  settings: {
    input_mode: "A" | "B" | "AB";
    auto_lock_day: number;
    timezone: string;
  };
};

const TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
];

export function SettingsForm({ initial }: { initial: SchoolData }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [npsn, setNpsn] = useState(initial.npsn ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [inputMode, setInputMode] = useState(initial.settings.input_mode);
  const [autoLockDay, setAutoLockDay] = useState(
    String(initial.settings.auto_lock_day),
  );
  const [timezone, setTimezone] = useState(initial.settings.timezone);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await apiFetch("/api/v1/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          npsn: npsn || null,
          address: address || null,
          settings: {
            input_mode: inputMode,
            auto_lock_day: Number(autoLockDay),
            timezone,
          },
        }),
      });
      setMsg({ ok: true, text: "Pengaturan tersimpan." });
      router.refresh();
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Gagal menyimpan.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-5">
      <section className="space-y-3.5">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Identitas Sekolah
        </h2>
        <div>
          <Label htmlFor="name">Nama Sekolah</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="npsn">NPSN</Label>
          <Input id="npsn" value={npsn} onChange={(e) => setNpsn(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="address">Alamat</Label>
          <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </section>

      <section className="space-y-3.5">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Mode & Penguncian
        </h2>
        <div>
          <Label htmlFor="mode">Mode Pengisian Jurnal</Label>
          <Select
            id="mode"
            value={inputMode}
            onChange={(e) => setInputMode(e.target.value as "A" | "B" | "AB")}
          >
            <option value="A">A — Sekretaris kelas mengisi</option>
            <option value="B">B — Guru mengisi mandiri</option>
            <option value="AB">AB — Keduanya aktif</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="lock">Auto-kunci tanggal (bulan berikutnya)</Label>
          <Input
            id="lock"
            type="number"
            min={0}
            max={28}
            value={autoLockDay}
            onChange={(e) => setAutoLockDay(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            0 = nonaktif. Mis. 5 = entri terkunci setelah tanggal 5 bulan berikutnya.
          </p>
        </div>
        <div>
          <Label htmlFor="tz">Zona Waktu</Label>
          <Select id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {TIMEZONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </section>

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

      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Simpan Pengaturan
      </Button>
    </form>
  );
}
