import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/db/schema";

/**
 * Edge-safe Auth.js config (no DB, no bcrypt). Imported by both the
 * middleware and the full server-side config in `auth.ts`. The Credentials
 * provider (which touches the DB) is added only in `auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.teacherId = user.teacherId;
        token.studentId = user.studentId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = token.role as Role;
      session.user.schoolId = token.schoolId as string;
      session.user.teacherId = (token.teacherId as string | null) ?? null;
      session.user.studentId = (token.studentId as string | null) ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
