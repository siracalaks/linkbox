import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/env";

/**
 * Auth.js (next-auth v5) — Credentials provider: e-posta + şifre,
 * bcrypt hash doğrulaması, JWT session (adapter'sız).
 * Magic-link/Supabase auth akışının yerine geçer (altyapı değişimi).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLocaleLowerCase("tr")
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const db = getDb();
        if (!db) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
});

/** Oturumdaki kullanıcıyı döndürür; env veya oturum yoksa null. */
export async function getSessionUser(): Promise<{
  id: string;
  email: string | null;
} | null> {
  if (!isDatabaseConfigured()) return null;
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, email: session.user.email ?? null };
}
