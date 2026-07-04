"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck } from "lucide-react";
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
        <SignOutButton />
      </div>
      {nav && nav.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <nav className="flex rounded-full bg-secondary p-1">
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1.5 text-center text-sm font-medium transition-all",
                    active
                      ? "bg-card font-semibold text-foreground border border-border/80"
                      : "text-muted-foreground hover:text-foreground",
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
