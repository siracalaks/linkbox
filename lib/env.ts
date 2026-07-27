/**
 * DATABASE_URL ilk deploy'da YOKTUR (research D11).
 * Hiçbir modül üst düzeyde env okuyup throw etmemelidir; her erişim
 * bu yardımcılar üzerinden lazy yapılır.
 */

/** Veritabanı bağlantı env'i tanımlı mı? */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Env eksikken kullanıcıya gösterilen sade Türkçe durum metni. */
export const DB_PENDING_MESSAGE = "Veritabanı yapılandırması bekleniyor";
