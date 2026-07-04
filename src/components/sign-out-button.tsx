"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  variant = "outline",
  className,
}: {
  variant?: "outline" | "ghost" | "secondary";
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      className={className}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="h-4 w-4" />
      Keluar
    </Button>
  );
}
