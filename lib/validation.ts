/** Doğrulama sonuçları Türkçe kullanıcı mesajları taşır (spec Edge Cases). */
export type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

export const INVALID_URL_MESSAGE = "Geçersiz URL";
export const INVALID_TAG_MESSAGE = "Etiket uzunluğu geçersiz";
export const DUPLICATE_LINK_MESSAGE = "Bu link zaten kayıtlı";

/**
 * URL doğrulama: yalnızca http/https kabul edilir.
 * `http//example` gibi girdiler "Geçersiz URL" ile reddedilir (Edge Case 400).
 */
export function validateUrl(raw: string): Validation<string> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: INVALID_URL_MESSAGE };
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: INVALID_URL_MESSAGE };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: INVALID_URL_MESSAGE };
  }
  return { ok: true, value: parsed.toString() };
}

/** Etiket adı: trim sonrası 1–50 karakter (Edge Case: 0 veya >50 → hata). */
export function validateTagName(raw: string): Validation<string> {
  const trimmed = raw.trim();
  if (trimmed.length < 1 || trimmed.length > 50) {
    return { ok: false, error: INVALID_TAG_MESSAGE };
  }
  return { ok: true, value: trimmed };
}

/**
 * Etiket listesini normalize eder: trim, küçük harf, boşları at, tekrarları çıkar.
 * Geçersiz uzunlukta etiket varsa hata döner.
 */
export function normalizeTags(rawTags: string[]): Validation<string[]> {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of rawTags) {
    const trimmed = raw.trim();
    if (!trimmed) continue; // virgülle ayrılmış boş parçaları yok say
    const check = validateTagName(trimmed);
    if (!check.ok) return check;
    const normalized = check.value.toLocaleLowerCase("tr");
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return { ok: true, value: result };
}

/** "a, b, c" biçimindeki girişten etiket listesi üretir. */
export function parseTagsInput(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
