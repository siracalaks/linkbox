/**
 * Supabase ortam değişkenleri ilk deploy'da YOKTUR (research D11).
 * Hiçbir modül üst düzeyde env okuyup throw etmemelidir; her erişim
 * bu yardımcılar üzerinden lazy yapılır.
 */

/** Public Supabase env'leri tanımlı mı? */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Tanımlıysa public env çiftini döndürür, değilse null. */
export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** Env eksikken kullanıcıya gösterilen sade Türkçe durum metni. */
export const DB_PENDING_MESSAGE = "Veritabanı yapılandırması bekleniyor";
