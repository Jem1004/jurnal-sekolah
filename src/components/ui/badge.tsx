import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "info" | "warning" | "danger" | "primary";

const tones: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  success: "bg-green-100 text-green-800",
  info: "bg-blue-100 text-blue-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  primary: "bg-primary-muted text-accent-foreground",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
