import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  percentage: number; // 0 to 100
  label?: string; // e.g. "Terisi"
  sublabel?: string; // e.g. "12 / 15 Kelas"
  className?: string;
}

export function ProgressRing({
  percentage,
  label = "Terisi",
  sublabel,
  className,
}: ProgressRingProps) {
  const p = Math.min(Math.max(Math.round(percentage), 0), 100);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center size-44",
        className,
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-44 rounded-full border-2 border-dashed border-border" />
      </div>

      <div
        className="relative grid size-36 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-accent) ${p}%, var(--color-secondary) 0)`,
          mask: "radial-gradient(farthest-side, transparent 68%, #000 69%)",
          WebkitMask:
            "radial-gradient(farthest-side, transparent 68%, #000 69%)",
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-medium tracking-tight tabular-nums text-foreground">
          {p}%
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground">{label}</span>
        {sublabel && (
          <span className="mt-0.5 text-[10px] text-muted-foreground">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
