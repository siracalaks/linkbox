import type { NextAuthConfig } from "next-auth";

/**
 * Edge-uyumlu Auth.js çekirdek yapılandırması (middleware bunu kullanır;
 * Prisma/bcrypt İÇERMEZ). Provider'lar auth.ts içinde eklenir.
 *
 * AUTH_SECRET yoksa derleme/açılış çökmez: dev fallback kullanılır.
 * Prod'da AUTH_SECRET env'i BEKLENİR (Coolify panelinden eklenir);
 * fallback yalnızca env'siz ilk deploy/dev senaryosu içindir, sır değildir.
 */
export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? "linkbox-dev-fallback-secret",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      // İlk girişte kullanıcı id'sini JWT'ye yaz (adapter'sız oturum).
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
