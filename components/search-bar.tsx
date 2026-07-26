"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Tam-metin arama çubuğu (UI-004): her karakter girişinde 300 ms
 * debounce ile ?q= parametresini günceller; sonuçlar sunucudan gelir.
 */
export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleChange(next: string) {
    setValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor"); // yeni aramada ilk sayfaya dön (keyset)
      params.delete("new");
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
  }

  return (
    <div className="relative max-w-2xl flex-1">
      <span
        aria-hidden="true"
        className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant"
      >
        search
      </span>
      <input
        aria-label="Tam metin ara"
        className="w-full rounded-xl border border-white/10 bg-surface-container py-md pl-xl pr-md text-body-md outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Tam metin ara..."
        type="search"
        value={value}
      />
    </div>
  );
}
