"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  Clock,
  FileSpreadsheet,
  GraduationCap,
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
import { SignOutButton } from "@/components/sign-out-button";

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
    <nav className="flex flex-col gap-3 p-3">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-0.5">
          {!isMinimized ? (
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {section.label}
            </p>
          ) : (
            <div className="my-1 border-t border-border/80" />
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
                    ? "h-10 w-10 justify-center mx-auto rounded-xl"
                    : "gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                <Icon className={cn("shrink-0", isMinimized ? "h-5 w-5" : "h-4.5 w-4.5")} />
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
        
        {/* Clear Logout & User Profile Block */}
        <div className="border-t border-border p-3">
          {isMinimized ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold select-none cursor-help"
                title={`Masuk sebagai: ${userName}`}
              >
                {userName[0].toUpperCase()}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Keluar dari Akun"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border/60 p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold select-none">
                  {userName[0].toUpperCase()}
                </div>
                <div className="leading-tight min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Administrator</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
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
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border/60 p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold select-none">
                    {userName[0].toUpperCase()}
                  </div>
                  <div className="leading-tight min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Administrator</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
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
