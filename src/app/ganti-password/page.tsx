import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import { auth } from "@/auth";
import { HOME_BY_ROLE, ROLE_LABEL } from "@/lib/roles";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export default async function GantiPasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const homeHref = HOME_BY_ROLE[session.user.role] ?? "/";

  return (
    <main className="flex min-h-svh items-start justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          href={homeHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <Card>
          <CardHeader className="pb-2">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <KeyRound className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-semibold">Ganti Password</h1>
            <p className="text-sm text-muted-foreground">
              {session.user.name} · {ROLE_LABEL[session.user.role]}
            </p>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm homeHref={homeHref} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
