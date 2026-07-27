import "server-only";

/**
 * Önizleme görselleri: Supabase Storage altyapı değişimiyle kaldırıldı.
 * Upload UI zaten kapsam dışıydı (research D14) — kendi sunucuda bir dosya
 * deposu kurmak YAGNI. `preview_path` kolonu şemada korunur; depo yokken
 * yardımcılar null/boş döner ve UI yer tutucu ikonu gösterir
 * (bkz. specs/001-linkbox/plan.md "Altyapı Değişimi" notu).
 */

export async function getPreviewUrl(
  _path: string | null
): Promise<string | null> {
  return null;
}

export async function getPreviewUrlMap(
  _paths: string[]
): Promise<Map<string, string>> {
  return new Map();
}
