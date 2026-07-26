"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Tag } from "@/lib/types";

/**
 * Etiket filtre çubuğu (UI-003, docs/design/screen-1.html): chip'ler
 * toggle'lanır, seçililer ?tags= URL parametresinde taşınır (AND mantığı).
 */
export function TagFilter({ tags }: { tags: Tag[] }) {
  const searchParams = useSearchParams();
  const selectedIds = (searchParams.get("tags") ?? "")
    .split(",")
    .filter(Boolean);

  function hrefFor(nextIds: string[]): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cursor"); // filtre değişince ilk sayfaya dön (keyset)
    params.delete("new");
    if (nextIds.length > 0) params.set("tags", nextIds.join(","));
    else params.delete("tags");
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  if (tags.length === 0) return null;

  return (
    <div aria-label="Etiket filtreleri" className="flex flex-wrap gap-sm" role="group">
      <Link
        aria-pressed={selectedIds.length === 0}
        className={
          selectedIds.length === 0
            ? "rounded-full border border-primary/20 bg-primary/10 px-md py-sm text-label-md text-primary"
            : "rounded-full border border-white/10 bg-surface-container px-md py-sm text-label-md text-on-surface-variant transition-all hover:border-primary/50"
        }
        href={hrefFor([])}
        role="button"
        scroll={false}
      >
        #tümü
      </Link>
      {tags.map((tag) => {
        const isSelected = selectedIds.includes(tag.id);
        const nextIds = isSelected
          ? selectedIds.filter((id) => id !== tag.id)
          : [...selectedIds, tag.id];
        return (
          <Link
            aria-pressed={isSelected}
            className={
              isSelected
                ? "rounded-full border border-primary/20 bg-primary/10 px-md py-sm text-label-md text-primary"
                : "rounded-full border border-white/10 bg-surface-container px-md py-sm text-label-md text-on-surface-variant transition-all hover:border-primary/50"
            }
            href={hrefFor(nextIds)}
            key={tag.id}
            role="button"
            scroll={false}
          >
            #{tag.name}
          </Link>
        );
      })}
    </div>
  );
}
