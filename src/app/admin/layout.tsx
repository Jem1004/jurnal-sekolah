import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HOME_BY_ROLE } from "@/lib/roles";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") {
    redirect(HOME_BY_ROLE[session.user.role] ?? "/login");
  }

  return (
    <AdminShell userName={session.user.name ?? "Admin"}>{children}</AdminShell>
  );
}
