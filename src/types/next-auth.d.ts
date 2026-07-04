import type { DefaultSession } from "next-auth";
import type { Role } from "@/db/schema";

declare module "next-auth" {
  interface User {
    role: Role;
    schoolId: string;
    teacherId: string | null;
    studentId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      schoolId: string;
      teacherId: string | null;
      studentId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    schoolId: string;
    teacherId: string | null;
    studentId: string | null;
  }
}
