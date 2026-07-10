"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm({ homeHref }: { homeHref: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }
    if (next !== confirm) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/v1/me/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah password.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold">Password berhasil diubah</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan password baru pada login berikutnya.
          </p>
        </div>
        <Button className="w-full" onClick={() => router.push(homeHref)}>
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="cur">Password Saat Ini</Label>
        <Input
          id="cur"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="new">Password Baru</Label>
        <Input
          id="new"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">Minimal 6 karakter.</p>
      </div>
      <div>
        <Label htmlFor="cfm">Ulangi Password Baru</Label>
        <Input
          id="cfm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={() => router.push(homeHref)}>
          Batal
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Simpan Password
        </Button>
      </div>
    </form>
  );
}
