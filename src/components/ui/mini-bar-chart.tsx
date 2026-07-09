"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MiniBarItem {
  label: string; // e.g., "Sen", "Sel"
  value: number; // e.g., actual JP
  max?: number; // e.g., target JP
  active?: boolean; // is today / selected
  formattedValue?: string; // e.g. "5 JP"
}

export interface MiniBarChartProps {
  items: MiniBarItem[];
  className?: string;
}

export function MiniBarChart({ items, className }: MiniBarChartProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number>(() => {
    const activeIdx = items.findIndex((i) => i.active);
    return activeIdx >= 0 ? activeIdx : 0;
  });

  const selectedItem = items[selectedIndex] ?? items[0];
  const globalMax = Math.max(
    ...items.map((i) => i.max ?? i.value),
    1,
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {selectedItem && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {selectedItem.label}
          </span>
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            {selectedItem.formattedValue ?? `${selectedItem.value} JP`}
          </span>
        </div>
      )}

      <div className="flex items-end justify-between h-28 pt-2">
        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const maxVal = item.max ?? globalMax;
          const pct = Math.min(Math.round((item.value / Math.max(maxVal, 1)) * 100), 100);

          return (
            <button
              key={`${item.label}-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className="group flex flex-col items-center gap-2 flex-1 h-full justify-end"
            >
              <div className="relative flex w-1.5 h-16 rounded-full bg-secondary overflow-hidden items-end">
                <div
                  style={{ height: `${pct}%` }}
                  className={cn(
                    "w-full rounded-full transition-all duration-300",
                    isSelected || item.active ? "bg-accent" : "bg-primary",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-xs transition-colors",
                  isSelected
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
