import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import type { Role } from "@/db/schema";

export type SessionUser = {
  id: string;
  role: Role;
  schoolId: string;
  teacherId: string | null;
  studentId: string | null;
  name?: string | null;
};

/** Thrown by route logic; converted to a JSON response by `runRoute`. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Require an authenticated session, optionally restricted to given roles. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) throw new ApiError(401, "Anda belum masuk.");
  if (roles.length && !roles.includes(session.user.role)) {
    throw new ApiError(403, "Anda tidak memiliki akses ke sumber daya ini.");
  }
  return session.user as SessionUser;
}

/** Map a raw Postgres/driver error to a friendly ApiError, or rethrow. */
export function mapDbError(err: unknown): never {
  // Drizzle wraps the pg error; the SQLSTATE `code` sits on a nested `cause`.
  const codes: string[] = [];
  let e: any = err; // eslint-disable-line @typescript-eslint/no-explicit-any
  for (let i = 0; i < 6 && e; i++) {
    if (e.code) codes.push(String(e.code));
    e = e.cause;
  }
  const all = codes.join(",");
  if (all.includes("23505")) {
    throw new ApiError(409, "Data duplikat: melanggar aturan keunikan.");
  }
  if (all.includes("23503")) {
    throw new ApiError(
      409,
      "Tidak bisa dihapus/diubah: data masih dipakai oleh data lain.",
    );
  }
  throw err;
}

/** Wrap a route handler: run it, and translate known errors to JSON. */
export async function runRoute(
  fn: () => Promise<unknown>,
): Promise<NextResponse> {
  try {
    const data = await fn();
    // Allow handlers to return a raw Response (e.g. binary file download).
    if (data instanceof Response) return data as NextResponse;
    return NextResponse.json(data ?? { ok: true });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Data tidak valid.", issues: e.issues },
        { status: 400 },
      );
    }
    console.error("[api] unhandled error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
