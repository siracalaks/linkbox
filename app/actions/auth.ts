"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DB_PENDING_MESSAGE } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase/server";

/** Server action ortak dönüş tipi (contracts/server-actions.md). */
export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/** İsteğin origin'ini başlıklardan türetir (magic link dönüş adresi için). */
function getOrigin(): string {
  const headerList = headers();
  const origin = headerList.get("origin");
  if (origin) return origin;
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/** E-posta + şifre ile giriş; başarıda dashboard'a yönlendirir. */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<ActionResult> {
  const supabase = getSupabaseServer();
  if (!supabase) return { ok: false, error: DB_PENDING_MESSAGE };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "Giriş başarısız" };
  redirect("/");
}

/** E-posta + şifre ile kayıt. */
export async function signUpWithPassword(
  email: string,
  password: string
): Promise<ActionResult> {
  const supabase = getSupabaseServer();
  if (!supabase) return { ok: false, error: DB_PENDING_MESSAGE };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${getOrigin()}/auth/callback` },
  });
  if (error) return { ok: false, error: "Kayıt başarısız" };
  if (data.session) redirect("/");
  return { ok: true, message: "Kayıt alındı, e-postanızı doğrulayın" };
}

/** Magic link (şifresiz giriş bağlantısı) gönderir. */
export async function signInWithMagicLink(email: string): Promise<ActionResult> {
  const supabase = getSupabaseServer();
  if (!supabase) return { ok: false, error: DB_PENDING_MESSAGE };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${getOrigin()}/auth/callback` },
  });
  if (error) return { ok: false, error: "Bağlantı gönderilemedi" };
  return { ok: true, message: "Giriş bağlantısı e-postanıza gönderildi" };
}

/** Oturumu kapatır ve giriş sayfasına yönlendirir. */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
