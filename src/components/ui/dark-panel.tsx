import * as React from "react";
import Link from "next/link";
import { Check, type LucideIcon, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DarkPanelItem {
  id: string;
  title: string;
  subtitle?: string;
  done: boolean;
  icon?: LucideIcon;
  href?: string;
}

export interface DarkPanelProps {
  title: string;
  countLabel: string; // e.g. "2/8"
  items: DarkPanelItem[];
  className?: string;
  emptyMessage?: string;
}

export function DarkPanel({
  title,
  countLabel,
  items,
  className,
  emptyMessage = "Semua tugas selesai!",
}: DarkPanelProps) {
  return (
    <section
      className={cn(
        "rounded-[2rem] bg-panel p-6 text-panel-foreground",
        className,
      )}
    >
      <header className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-2xl font-medium tabular-nums">{countLabel}</p>
      </header>

      {items.length === 0 ? (
        <div className="mt-6 py-6 text-center text-sm text-panel-muted">
          {emptyMessage}
        </div>
      ) : (
        <ul className="mt-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon ?? BookOpen;
            const content = (
              <li
                key={item.id}
                className="flex items-center gap-3 py-2.5 divider-dotted border-white/10 last:border-0"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
                  <Icon className="size-4 text-panel-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      item.done
                        ? "line-through opacity-50 text-panel-foreground"
                        : "text-panel-foreground",
                    )}
                  >
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="truncate text-xs text-panel-muted">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                {item.done ? (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent">
                    <Check className="size-3.5 text-accent-foreground" />
                  </span>
                ) : (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/20" />
                )}
              </li>
            );

            if (item.href) {
              return (
                <Link key={item.id} href={item.href} className="block group">
                  {content}
                </Link>
              );
            }

            return content;
          })}
        </ul>
      )}
    </section>
  );
}
