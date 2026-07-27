import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { isDatabaseConfigured } from "@/lib/env";

/**
 * Auth gateway (FR-008): JWT oturumunu doğrular, oturumsuz istekleri
 * /login'e yönlendirir. Env yoksa pas geçer (research D11) — sayfalar
 * "Veritabanı yapılandırması bekleniyor" durumunu gösterir.
 * Edge-uyumlu authConfig kullanılır (Prisma/bcrypt middleware'e girmez).
 */
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  if (!isDatabaseConfigured()) return NextResponse.next();

  const path = request.nextUrl.pathname;
  const isPublicPath =
    path.startsWith("/login") ||
    path.startsWith("/api/auth") ||
    path === "/api/health";
  const isAuthenticated = Boolean(request.auth?.user);

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && path.startsWith("/login")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
