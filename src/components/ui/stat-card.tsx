import Link from "next/link";
import { type LucideIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  tone?: "default" | "destructive" | "warning" | "info" | "success" | "accent";
  variant?: "default" | "inline" | "cta";
  className?: string;
}

const toneMap: Record<
  NonNullable<StatCardProps["tone"]>,
  { text: string; bg: string }
> = {
  default: { text: "text-foreground", bg: "bg-secondary" },
  destructive: { text: "text-destructive", bg: "bg-destructive-muted" },
  warning: { text: "text-warning", bg: "bg-warning-muted" },
  info: { text: "text-info", bg: "bg-info-muted" },
  success: { text: "text-success", bg: "bg-success-muted" },
  accent: { text: "text-accent-foreground", bg: "bg-accent" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  tone = "default",
  variant = "default",
  className,
}: StatCardProps) {
  const isCta = variant === "cta";
  const isInline = variant === "inline";
  const { text: toneText, bg: toneBg } = toneMap[tone] ?? toneMap.default;

  const content = isInline ? (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[1.5rem] bg-card px-4 py-3",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-full shrink-0",
          toneBg,
        )}
      >
        <Icon className={cn("size-4", toneText)} />
      </span>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-medium tracking-tight tabular-nums text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  ) : (
    <div
      className={cn(
        "relative rounded-[1.5rem] p-5 transition-colors",
        isCta ? "bg-accent-muted" : "bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full",
            isCta ? "bg-accent text-accent-foreground" : toneBg,
          )}
        >
          <Icon
            className={cn("size-4", isCta ? "text-accent-foreground" : toneText)}
          />
        </span>
        {href && (
          <span className="flex size-9 items-center justify-center rounded-full bg-card text-foreground transition-transform group-hover:scale-105">
            <ArrowUpRight className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-4 text-4xl font-medium tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
