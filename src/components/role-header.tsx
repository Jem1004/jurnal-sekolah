"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";

export function RoleHeader({
  title,
  subtitle,
  nav,
}: {
  title: string;
  subtitle?: string;
  nav?: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/ganti-password"
            title="Ganti Password"
            aria-label="Ganti Password"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <KeyRound className="h-4.5 w-4.5" />
          </Link>
          <SignOutButton />
        </div>
      </div>
      {nav && nav.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <nav className="flex items-center gap-1 rounded-full bg-card p-1.5 border border-border/60">
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
