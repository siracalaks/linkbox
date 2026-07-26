import Link from "next/link";

/** Türkçe 404 sayfası (bulunamayan link detayları dahil). */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md p-lg text-center">
      <span aria-hidden="true" className="material-symbols-outlined text-[48px] text-primary/40">
        search_off
      </span>
      <h1 className="font-display text-headline-md">Sayfa bulunamadı</h1>
      <p className="text-body-sm text-on-surface-variant">
        Aradığınız içerik silinmiş veya taşınmış olabilir.
      </p>
      <Link
        className="indigo-gradient-btn rounded-xl px-lg py-sm text-label-md text-white"
        href="/"
      >
        Tüm Linklere Dön
      </Link>
    </main>
  );
}
