import { Suspense } from "react";
import { BookOpenCheck, HelpCircle } from "lucide-react";
import { db } from "@/db";
import { schools } from "@/db/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

function LoginFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-20 rounded" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-20 rounded" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl pt-2" />
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  let schoolName = "Portal Sekolah";
  try {
    const [school] = await db
      .select({ name: schools.name })
      .from(schools)
      .limit(1);
    if (school?.name) schoolName = school.name;
  } catch {
    // Fallback if db error
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-ambient p-4 sm:p-6 md:p-10">
      {/* Centered Modern Rounded Layout Card */}
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-border/40 bg-card/90 backdrop-blur-md grid grid-cols-1 md:grid-cols-12 shadow-2xl">
        
        {/* Left: Information Panel */}
        <div className="bg-secondary/40 text-foreground p-8 sm:p-12 md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/40">
          <div className="space-y-8">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-none font-bold">
                <BookOpenCheck className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="font-extrabold text-foreground text-lg tracking-tight leading-none block">ASTRO JURNAL</span>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">{schoolName}</p>
              </div>
            </div>

            {/* Useful School Info Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground leading-snug">
                Panduan Akses & Fitur Portal Jurnal
              </h2>
              
              <div className="space-y-4 text-xs text-muted-foreground">
                <div className="flex gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <strong className="text-foreground font-semibold">Guru & Staff</strong>
                    <p className="mt-0.5 text-muted-foreground/80">Pencatatan materi harian, absensi siswa, dan konfirmasi jam pelajaran.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <strong className="text-foreground font-semibold">Wali Kelas & Sekretaris</strong>
                    <p className="mt-0.5 text-muted-foreground/80">Monitoring pengisian jurnal, penanganan anomali, dan rekapitulasi kelas.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <strong className="text-foreground font-semibold">Kepala Sekolah</strong>
                    <p className="mt-0.5 text-muted-foreground/80">Akses laporan bulanan seluruh kelas, status persetujuan, dan unduh rekapitulasi.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help & Support (Genuine Info) */}
          <div className="mt-8 pt-6 border-t border-border/40 flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground font-semibold block mb-0.5">Butuh Bantuan?</span>
              Silakan hubungi operator tata usaha sekolah untuk bantuan aktivasi akun, verifikasi data, atau reset sandi.
            </div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="p-8 sm:p-12 md:col-span-7 flex flex-col justify-center bg-transparent">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Sign In</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Gunakan kredensial yang didaftarkan untuk masuk ke portal jurnal mengajar digital {schoolName}.
              </p>
            </div>

            <Suspense fallback={<LoginFormSkeleton />}>
              <LoginForm callbackUrl={callbackUrl ?? "/"} />
            </Suspense>

            <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>&copy; {new Date().getFullYear()} {schoolName}</span>
              <span>v1.2.0</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
