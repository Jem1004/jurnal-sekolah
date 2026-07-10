"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Loader2, Lock, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Username atau password salah. Silakan periksa kembali.");
      return;
    }
    router.push(callbackUrl || "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label
          htmlFor="username"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Username
        </Label>
        <div className="relative mt-1.5">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-11 rounded-2xl pl-10 bg-secondary/40 border-border/60 focus-visible:bg-card transition-all duration-200"
            placeholder="Masukkan username"
            required
            autoFocus
          />
        </div>
      </div>

      <div>
        <Label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Password
        </Label>
        <div className="relative mt-1.5">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-2xl pl-10 bg-secondary/40 border-border/60 focus-visible:bg-card transition-all duration-200"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-11 rounded-full font-bold text-sm transition-all mt-3"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Masuk ke Portal
          </>
        )}
      </Button>
    </form>
  );
}
