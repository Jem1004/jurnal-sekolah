import { Suspense } from "react";
import { BookOpenCheck } from "lucide-react";
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
      {/* Centered Minimalist Single Layer Card */}
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-border/40 bg-card/90 backdrop-blur-md p-8 sm:p-10 shadow-2xl flex flex-col justify-between">
        
        <div>
          {/* Logo & Brand */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-none font-bold mb-3">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <h1 className="font-extrabold text-foreground text-2xl tracking-tight leading-none">ASTRO JURNAL</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-2">{schoolName}</p>
          </div>

          {/* Form Description */}
          <div className="mb-6 text-center">
            <p className="text-xs text-muted-foreground">
              Gunakan username dan password Anda untuk masuk ke portal jurnal mengajar digital.
            </p>
          </div>

          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm callbackUrl={callbackUrl ?? "/"} />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} {schoolName}</span>
          <span>v1.2.0</span>
        </div>

      </div>
    </main>
  );
}
