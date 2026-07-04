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
    <main className="flex min-h-svh items-center justify-center bg-zinc-50 p-4 sm:p-6 md:p-10">
      {/* Centered Modern Rounded Layout Card */}
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-200 bg-white grid grid-cols-1 md:grid-cols-12 shadow-sm">
        
        {/* Left: Information Panel */}
        <div className="bg-zinc-50 text-zinc-900 p-8 sm:p-12 md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200">
          <div className="space-y-8">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-zinc-900 text-lg tracking-tight">ASTRO JURNAL SEKOLAH</span>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{schoolName}</p>
              </div>
            </div>

            {/* Useful School Info Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 leading-snug">
                Panduan Akses & Fitur Portal Jurnal
              </h2>
              
              <div className="space-y-4 text-xs text-zinc-600">
                <div className="flex gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                  <div>
                    <strong className="text-zinc-900 font-medium">Guru & Staff</strong>
                    <p className="mt-0.5 text-zinc-500">Pencatatan materi harian, absensi siswa, dan konfirmasi jam pelajaran.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                  <div>
                    <strong className="text-zinc-900 font-medium">Wali Kelas & Sekretaris</strong>
                    <p className="mt-0.5 text-zinc-500">Monitoring pengisian jurnal, penanganan anomali, dan rekapitulasi kelas.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                  <div>
                    <strong className="text-zinc-900 font-medium">Kepala Sekolah</strong>
                    <p className="mt-0.5 text-zinc-400">Akses laporan bulanan seluruh kelas, status persetujuan, dan tanda tangan digital.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help & Support (Genuine Info) */}
          <div className="mt-8 pt-6 border-t border-zinc-200 flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-zinc-500 leading-relaxed">
              <span className="text-zinc-800 font-medium block">Butuh Bantuan?</span>
              Silakan hubungi operator tata usaha sekolah untuk bantuan aktivasi akun, verifikasi data, atau reset sandi.
            </div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="p-8 sm:p-12 md:col-span-7 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Sign In</h1>
              <p className="mt-2 text-sm text-zinc-500">
                Gunakan kredensial yang didaftarkan untuk masuk ke portal jurnal mengajar digital {schoolName}.
              </p>
            </div>

            <Suspense fallback={<LoginFormSkeleton />}>
              <LoginForm callbackUrl={callbackUrl ?? "/"} />
            </Suspense>

            <div className="mt-10 pt-6 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
              <span>&copy; {new Date().getFullYear()} {schoolName}</span>
              <span>v1.2.0</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
