"use client";

import { useState } from "react";
import { ChevronDown, Copy, KeyRound, Loader2, Wand2 } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { ROLE_LABEL } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export type ResetUser = {
  id: string;
  name: string;
  username: string;
  role: keyof typeof ROLE_LABEL;
};

function generatePassword() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint32Array(10);
  crypto.getRandomValues(arr);
  for (const n of arr) out += chars[n % chars.length];
  return out;
}

export function ResetPasswordPanel({ users }: { users: ResetUser[] }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    if (!userId) return setMsg({ ok: false, text: "Pilih pengguna dulu." });
    if (password.length < 6)
      return setMsg({ ok: false, text: "Password minimal 6 karakter." });
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch("/api/v1/admin/users/reset-password", {
        method: "POST",
        body: JSON.stringify({ userId, newPassword: password }),
      });
      const u = users.find((x) => x.id === userId);
      setMsg({
        ok: true,
        text: `Password ${u?.username ?? ""} berhasil direset. Serahkan password baru ke pengguna: ${password}`,
      });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Gagal." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Reset Password Pengguna (untuk yang lupa password)
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <CardContent className="space-y-3 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="rp-user">Pengguna</Label>
              <Select
                id="rp-user"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">— pilih pengguna —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.username}) · {ROLE_LABEL[u.role]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="rp-pass">Password Baru</Label>
              <div className="flex gap-2">
                <Input
                  id="rp-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="min. 6 karakter"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Buat password acak"
                  onClick={() => {
                    setPassword(generatePassword());
                    setMsg(null);
                  }}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" onClick={submit} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Reset Password
            </Button>
            {msg?.ok && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard?.writeText(password)}
              >
                <Copy className="h-4 w-4" /> Salin Password
              </Button>
            )}
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
        </CardContent>
      )}
    </Card>
  );
}
