import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Signed URL geçerlilik süresi: 5 dk (FR-006, anayasa II). */
const SIGNED_URL_TTL_SECONDS = 300;

/**
 * `previews` private bucket'ındaki nesne için 5 dk geçerli signed URL üretir.
 * Env veya dosya yoksa null döner; istemciye asla service-role sızmaz.
 */
export async function getPreviewUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.storage
    .from("previews")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Birden çok önizleme yolu için tek istekte signed URL haritası üretir
 * (dashboard kartları için).
 */
export async function getPreviewUrlMap(
  paths: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  if (uniquePaths.length === 0) return map;
  const admin = getSupabaseAdmin();
  if (!admin) return map;
  const { data, error } = await admin.storage
    .from("previews")
    .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return map;
  for (const item of data) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}
