"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

/**
 * Tarayıcı tarafı Supabase client'ı (realtime aboneliği için).
 * Env yoksa null döner (research D11); modül üst düzeyinde throw yok.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(env.url, env.anonKey);
  }
  return browserClient;
}
