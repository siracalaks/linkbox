import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

/**
 * Server component / server action / route handler için çerez tabanlı
 * Supabase client'ı. Env yoksa null döner (research D11) — çağıran taraf
 * "Veritabanı yapılandırması bekleniyor" durumunu göstermelidir.
 */
export function getSupabaseServer() {
  const env = getSupabaseEnv();
  if (!env) return null;
  const cookieStore = cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server component render'ı sırasında çerez yazılamaz; middleware tazeler.
        }
      },
    },
  });
}

/** Oturumdaki kullanıcıyı döndürür; env veya oturum yoksa null. */
export async function getSessionUser() {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
