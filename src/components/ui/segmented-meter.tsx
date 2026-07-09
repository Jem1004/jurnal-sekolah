import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedMeterItem {
  label: string;
  value: number; // percentage or raw count
  percentage: number; // 0-100
  tone?: "success" | "warning" | "destructive" | "info" | "neutral" | "stripes";
  styleType?: "solid" | "stripes" | "outline";
}

export interface SegmentedMeterProps {
  items: SegmentedMeterItem[];
  className?: string;
}

const toneStyles: Record<
  NonNullable<SegmentedMeterItem["tone"]>,
  { solid: string; text: string }
> = {
  success: { solid: "bg-success text-white", text: "text-success" },
  warning: { solid: "bg-warning text-white", text: "text-warning" },
  destructive: { solid: "bg-destructive text-white", text: "text-destructive" },
  info: { solid: "bg-info text-white", text: "text-info" },
  neutral: { solid: "bg-secondary text-foreground", text: "text-foreground" },
  stripes: { solid: "bg-stripes border border-border text-foreground", text: "text-foreground" },
};

export function SegmentedMeter({ items, className }: SegmentedMeterProps) {
  const visibleItems = items.filter((item) => item.percentage > 0);

  return (
    <div className={cn("flex w-full items-end gap-1.5 overflow-hidden", className)}>
      {visibleItems.map((item, idx) => {
        const tone = item.tone ?? "neutral";
        const styleType =
          item.styleType ??
          (idx === 0 ? "solid" : idx === 1 ? "stripes" : "outline");
        const showInside = item.percentage >= 8;

        let barClass = "";
        if (styleType === "solid") {
          barClass = toneStyles[tone]?.solid ?? "bg-primary text-primary-foreground";
        } else if (styleType === "stripes") {
          barClass = "bg-stripes border border-border text-foreground";
        } else {
          barClass = "border border-border bg-card text-foreground";
        }

        return (
          <div
            key={`${item.label}-${idx}`}
            style={{ width: `${Math.max(item.percentage, 2)}%` }}
            className="flex flex-col min-w-0"
          >
            <p className="mb-1 truncate text-xs text-muted-foreground">
              {item.label} {!showInside && `(${Math.round(item.percentage)}%)`}
            </p>
            <div
              className={cn(
                "flex h-11 items-center justify-center rounded-full px-2 text-sm font-medium truncate",
                barClass,
              )}
            >
              {showInside && <span>{Math.round(item.percentage)}%</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
