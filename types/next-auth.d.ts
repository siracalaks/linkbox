import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /** Oturum kullanıcısına uygulama id'si eklenir (JWT `sub`'dan). */
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
