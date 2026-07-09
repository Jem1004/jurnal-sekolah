import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "muted"
  | "success"
  | "info"
  | "warning"
  | "destructive"
  | "danger"
  | "accent"
  | "primary";

const tones: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  muted: "bg-secondary text-muted-foreground",
  success: "bg-success-muted text-success",
  info: "bg-info-muted text-info",
  warning: "bg-warning-muted text-warning",
  destructive: "bg-destructive-muted text-destructive",
  danger: "bg-destructive-muted text-destructive",
  accent: "bg-accent text-accent-foreground",
  primary: "bg-accent text-accent-foreground",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
