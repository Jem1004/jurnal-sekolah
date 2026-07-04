import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Login page: redirect authenticated users to their home ("/").
  if (pathname === "/login") {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // Everything else requires a session.
  if (!isLoggedIn) {
    // API routes: let the route handler respond with JSON 401 (requireRole),
    // rather than redirecting to an HTML login page.
    if (pathname.startsWith("/api/")) return NextResponse.next();
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Run on all routes except Auth.js endpoints, Next internals, and static files.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
