import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  tone?: "default" | "destructive" | "warning" | "info" | "success";
  className?: string;
}

const toneMap = {
  default: "text-primary",
  destructive: "text-destructive",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  tone = "default",
  className,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "h-full rounded-2xl border border-zinc-200 bg-white p-4.5 transition-all duration-200 hover:shadow-sm hover:border-zinc-300",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-500 leading-tight">{label}</p>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100">
          <Icon className={cn("h-3.5 w-3.5", toneMap[tone])} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 leading-none">{value}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
