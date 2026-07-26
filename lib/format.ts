/** ISO zaman damgasını Türkçe tarihe çevirir (ör. "12 Temmuz 2026"). */
export function formatDateTr(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** URL'nin kısa görünümü: ana makine adı (ör. "tailwindcss.com"). */
export function shortUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
