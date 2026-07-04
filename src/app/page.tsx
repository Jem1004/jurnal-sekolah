import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HOME_BY_ROLE } from "@/lib/roles";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(HOME_BY_ROLE[session.user.role] ?? "/login");
}
