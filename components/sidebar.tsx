import Link from "next/link";

/** Masaüstü sol gezinme (docs/design/screen-1.html; md altı gizli). */
export function Sidebar() {
  return (
    <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-[280px] shrink-0 flex-col border-r border-white/10 bg-surface-container-low pt-xl md:flex">
      <div className="mb-lg px-lg">
        <p className="text-label-md uppercase tracking-widest text-on-surface-variant opacity-50">
          Kütüphane
        </p>
      </div>
      <nav aria-label="Kütüphane gezinmesi" className="flex flex-col">
        <Link
          aria-current="page"
          className="flex items-center gap-md border-l-4 border-primary bg-primary/10 px-lg py-md text-primary transition-all"
          href="/"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            grid_view
          </span>
          <span className="text-label-md">Tüm Linkler</span>
        </Link>
      </nav>
    </aside>
  );
}
