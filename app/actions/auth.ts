"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { signIn, signOut as authSignOut } from "@/auth";
import { getDb } from "@/lib/db";
import { DB_PENDING_MESSAGE } from "@/lib/env";

/** Server action ortak dönüş tipi (contracts/server-actions.md). */
export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/** bcrypt maliyet faktörü. */
const BCRYPT_ROUNDS = 10;

function normalizeEmail(raw: string): string {
  return raw.trim().toLocaleLowerCase("tr");
}

/** E-posta + şifre ile giriş; başarıda dashboard'a yönlendirir. */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<ActionResult> {
  const db = getDb();
  if (!db) return { ok: false, error: DB_PENDING_MESSAGE };
  try {
    await signIn("credentials", {
      email: normalizeEmail(email),
      password,
      redirectTo: "/",
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Giriş başarısız" };
    }
    throw error; // Next.js redirect'i yukarı taşınır
  }
}

/** E-posta + şifre ile kayıt (bcrypt hash); başarıda otomatik giriş yapar. */
export async function signUpWithPassword(
  email: string,
  password: string
): Promise<ActionResult> {
  const db = getDb();
  if (!db) return { ok: false, error: DB_PENDING_MESSAGE };

  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, error: "Geçersiz e-posta" };
  }
  if (password.length < 6) {
    return { ok: false, error: "Şifre en az 6 karakter olmalı" };
  }

  const passwordHash = await hash(password, BCRYPT_ROUNDS);
  try {
    await db.user.create({ data: { email: normalized, passwordHash } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Bu e-posta zaten kayıtlı" };
    }
    return { ok: false, error: "Kayıt başarısız" };
  }

  return signInWithPassword(normalized, password);
}

/** Oturumu kapatır ve giriş sayfasına yönlendirir. */
export async function signOut(): Promise<void> {
  await authSignOut({ redirectTo: "/login" });
}
