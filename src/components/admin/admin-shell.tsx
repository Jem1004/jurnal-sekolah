"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  ChevronsUpDown,
  Clock,
  FileSpreadsheet,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Library,
  Menu,
  Settings,
  UsersRound,
  Users,
  School,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const NAV_SECTIONS = [
  {
    label: "Dashboard",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Data Master",
    items: [
      { href: "/admin/master/academic-years", label: "Tahun Ajaran", icon: CalendarRange },
      { href: "/admin/master/classes", label: "Kelas", icon: School },
      { href: "/admin/master/subjects", label: "Mata Pelajaran", icon: Library },
      { href: "/admin/master/teachers", label: "Guru", icon: GraduationCap },
      { href: "/admin/master/students", label: "Siswa", icon: UsersRound },
      { href: "/admin/master/assignments", label: "Penugasan", icon: BookOpenCheck },
    ],
  },
  {
    label: "Jadwal",
    items: [
      { href: "/admin/master/period-templates", label: "Jam Pelajaran", icon: Clock },
      { href: "/admin/jadwal", label: "Jadwal", icon: CalendarDays },
      { href: "/admin/master/holidays", label: "Hari Libur", icon: CalendarDays },
    ],
  },
  {
    label: "Laporan",
    items: [
      { href: "/admin/rekap", label: "Rekap Bulanan", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/master/users", label: "Pengguna", icon: Users },
      { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
    ],
  },
];

function NavLinks({
  isMinimized = false,
  onNavigate,
}: {
  isMinimized?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-4 p-3">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          {!isMinimized ? (
            <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.label}
            </p>
          ) : (
            <div className="my-1 border-t border-dashed border-border" />
          )}
          {section.items.map((item) => {
            const active =
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={isMinimized ? item.label : undefined}
                className={cn(
                  "flex items-center transition-all duration-200",
                  isMinimized
                    ? "h-11 w-11 justify-center mx-auto rounded-full"
                    : "gap-3 rounded-full px-4 py-2.5 text-sm font-medium",
                  active
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <Icon className={cn("shrink-0", isMinimized ? "h-5 w-5" : "h-4 w-4")} />
                {!isMinimized && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <BookOpenCheck className="h-5 w-5" />
      </div>
      <div className="leading-tight text-left">
        <p className="text-sm font-bold">ASTRO JURNAL</p>
        <p className="text-[10px] text-muted-foreground font-medium">Panel Admin</p>
      </div>
    </div>
  );
}

/** Profile chip that opens an upward dropdown with account actions. */
function UserMenu({
  userName,
  minimized = false,
  onNavigate,
}: {
  userName: string;
  minimized?: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = userName[0]?.toUpperCase() ?? "?";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={minimized ? userName : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-full border transition-colors",
          open
            ? "border-border bg-secondary"
            : "border-transparent hover:bg-secondary",
          minimized ? "justify-center p-1.5" : "p-2",
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground select-none">
          {initial}
        </span>
        {!minimized && (
          <>
            <span className="min-w-0 flex-1 text-left leading-tight">
              <span className="block truncate text-sm font-semibold text-foreground">
                {userName}
              </span>
              <span className="block text-[10px] font-medium text-muted-foreground">
                Administrator
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute bottom-full z-50 mb-2 overflow-hidden rounded-xl border border-border bg-popover py-1",
            minimized ? "left-0 min-w-[13rem]" : "inset-x-0",
          )}
        >
          {minimized && (
            <div className="border-b border-border px-3 py-2">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="text-[10px] text-muted-foreground">Administrator</p>
            </div>
          )}
          <Link
            href="/ganti-password"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary"
          >
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Ganti Password
          </Link>
          <button
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const [openMobile, setOpenMobile] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="flex min-h-svh">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-card md:flex transition-all duration-300",
          isMinimized ? "w-16" : "w-64"
        )}
      >
        {/* Sidebar Header: Brand & Minimize Button */}
        {isMinimized ? (
          <div className="flex flex-col items-center gap-2 border-b border-border/40 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Tampilkan Menu"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-4">
            <Brand />
            <button
              onClick={() => setIsMinimized(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Sembunyikan Menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <NavLinks isMinimized={isMinimized} />
        </div>
        
        {/* User profile menu */}
        <div className="border-t border-border p-3">
          <UserMenu userName={userName} minimized={isMinimized} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenMobile(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-card">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpenMobile(false)}
                className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpenMobile(false)} />
            </div>
            <div className="border-t border-border p-3">
              <UserMenu
                userName={userName}
                onNavigate={() => setOpenMobile(false)}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:hidden">
          <button
            onClick={() => setOpenMobile(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-secondary"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold">ASTRO JURNAL</span>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
