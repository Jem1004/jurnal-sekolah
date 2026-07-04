import { Construction } from "lucide-react";
import { auth } from "@/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent } from "@/components/ui/card";

/** Placeholder landing for roles not yet built (Fase 2+). */
export async function RoleStub({ note }: { note: string }) {
  const session = await auth();
  const role = session?.user.role;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-4 px-4 py-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted text-primary">
            <Construction className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Masuk sebagai {role ? ROLE_LABEL[role] : "-"}
            </p>
            <h1 className="text-lg font-semibold">{session?.user.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{note}</p>
          <SignOutButton />
        </CardContent>
      </Card>
    </main>
  );
}
