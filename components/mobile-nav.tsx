import Link from "next/link";

/** Mobil alt gezinme + FAB (docs/design/screen-1.html; md ve üstünde gizli). */
export function MobileNav() {
  return (
    <nav
      aria-label="Mobil gezinme"
      className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-white/10 bg-surface-container-highest px-md py-sm shadow-lg md:hidden"
    >
      <Link
        className="flex flex-col items-center justify-center rounded-xl bg-primary/10 p-sm text-primary transition-all"
        href="/"
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          home
        </span>
        <span className="text-[10px] font-medium">Linkler</span>
      </Link>
      <Link
        aria-label="Yeni link ekle"
        className="-mt-8 flex h-14 w-14 flex-col items-center justify-center rounded-full border-4 border-surface-container-highest bg-primary-container text-white shadow-2xl"
        href="/?new=1"
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          add
        </span>
      </Link>
      <Link
        className="flex flex-col items-center justify-center p-sm text-on-surface-variant transition-all hover:text-primary"
        href="/login"
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          person
        </span>
        <span className="text-[10px] font-medium">Profil</span>
      </Link>
    </nav>
  );
}
