import Link from "next/link";
import { signOut } from "@/app/actions/auth";

/**
 * Üst bar (docs/design/screen-1.html): logo, masaüstü nav, "Yeni Link Ekle",
 * avatar menüsü. Menü <details> ile klavye erişilebilir (UI-007).
 */
export function Header({
  email,
  backHref,
}: {
  email: string | null;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-surface-container/80 px-lg py-md shadow-md backdrop-blur-xl">
      <div className="flex items-center gap-md">
        {backHref ? (
          <Link
            aria-label="Geri"
            className="rounded-full p-sm text-primary transition-colors hover:bg-primary/10"
            href={backHref}
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              arrow_back
            </span>
          </Link>
        ) : null}
        <Link
          className="font-display text-headline-md font-bold tracking-tight text-primary"
          href="/"
        >
          Linkbox
        </Link>
        <nav aria-label="Ana gezinme" className="ml-xl hidden items-center gap-lg md:flex">
          <Link
            className="border-b-2 border-primary pb-1 text-label-md font-bold text-primary"
            href="/"
          >
            Tüm Linkler
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-md">
        <Link
          className="indigo-gradient-btn hidden items-center gap-sm rounded-xl px-lg py-sm text-label-md text-white md:flex"
          href="/?new=1"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            add
          </span>
          Yeni Link Ekle
        </Link>
        <details className="group relative">
          <summary
            aria-label="Kullanıcı menüsü"
            className="flex cursor-pointer list-none items-center gap-sm rounded-full border border-white/10 p-1 transition-all hover:bg-white/5 [&::-webkit-details-marker]:hidden"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-label-md font-bold text-white"
            >
              {(email ?? "?").charAt(0).toLocaleUpperCase("tr")}
            </span>
            <span className="hidden pr-sm text-label-md md:block">
              {email ?? "Misafir"}
            </span>
          </summary>
          <div className="glass-effect absolute right-0 top-full z-50 mt-sm w-48 rounded-xl p-sm shadow-2xl">
            <form action={signOut}>
              <button
                className="flex w-full items-center gap-sm rounded-lg px-md py-sm text-left text-body-sm text-error transition-colors hover:bg-error/10"
                type="submit"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-sm">
                  logout
                </span>
                Çıkış Yap
              </button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
