"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteLink } from "@/app/actions/links";
import { formatDateTr, shortUrl } from "@/lib/format";
import type { LinkWithTags } from "@/lib/types";

/**
 * Link kartı (docs/design/screen-1.html): önizleme/fallback, başlık,
 * kısa URL, etiket chip'leri, tarih, hover'da Düzenle/Sil (UI-001).
 */
export function LinkCard({
  link,
  previewUrl,
}: {
  link: LinkWithTags;
  previewUrl: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Bu link silinsin mi?")) return;
    startTransition(async () => {
      const result = await deleteLink(link.id);
      if (!result.ok) window.alert(result.error);
      else router.refresh();
    });
  }

  return (
    <article
      className={`group glass-effect card-glow flex flex-col overflow-hidden rounded-xl transition-all ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="relative h-40 overflow-hidden">
        <Link aria-label={`${link.title ?? shortUrl(link.url)} detayına git`} href={`/links/${link.id}`}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={previewUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-container-low">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[48px] text-primary/40"
              >
                link
              </span>
            </div>
          )}
        </Link>
        <div className="pointer-events-none absolute inset-0 flex items-end justify-end gap-sm bg-gradient-to-t from-background/80 to-transparent p-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Link
            aria-label="Düzenle"
            className="pointer-events-auto rounded-lg border border-white/10 bg-surface-container p-sm transition-colors hover:text-primary"
            href={`/links/${link.id}`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              edit
            </span>
          </Link>
          <button
            aria-label="Sil"
            className="pointer-events-auto rounded-lg border border-white/10 bg-surface-container p-sm transition-colors hover:text-error"
            disabled={isPending}
            onClick={handleDelete}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              delete
            </span>
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-md">
        <h3 className="mb-xs line-clamp-1 font-display text-headline-sm">
          <a
            className="transition-colors hover:text-primary"
            href={link.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.title ?? shortUrl(link.url)}
          </a>
        </h3>
        <p className="mb-sm flex items-center gap-xs text-body-sm text-on-surface-variant">
          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
            link
          </span>
          <span className="truncate">{shortUrl(link.url)}</span>
        </p>
        <p className="mb-md text-label-xs text-on-surface-variant/70">
          {formatDateTr(link.created_at)}
        </p>
        <div className="mt-auto flex flex-wrap gap-xs">
          {link.tags.map((tag) => (
            <span
              className="rounded border border-primary/20 bg-primary/10 px-xs py-[2px] text-[10px] font-bold uppercase tracking-wider text-primary"
              key={tag.id}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
