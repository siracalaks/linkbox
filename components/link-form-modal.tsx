"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createLink } from "@/app/actions/links";
import { parseTagsInput } from "@/lib/validation";

/**
 * "Yeni Link Ekle" modalı (UI-002, docs/design/screen-1.html):
 * URL zorunlu; başlık, açıklama opsiyonel; etiketler virgülle +
 * mevcut etiketlerden datalist autocomplete. Mobilde alttan kayar,
 * masaüstünde ortalanır. ESC ile kapanır (UI-007).
 */
export function LinkFormModal({ existingTagNames }: { existingTagNames: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const urlInputRef = useRef<HTMLInputElement>(null);

  function close() {
    router.replace(pathname, { scroll: false });
  }

  useEffect(() => {
    urlInputRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createLink({
        url: String(formData.get("url") ?? ""),
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        tags: parseTagsInput(String(formData.get("tags") ?? "")),
      });
      if (result.ok) {
        close();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div
      aria-labelledby="link-form-title"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:px-md"
      role="dialog"
    >
      <button
        aria-label="Modalı kapat"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={close}
        type="button"
      />
      <div className="glass-effect relative w-full max-w-lg overflow-hidden rounded-t-2xl shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-lg py-md sm:px-xl sm:py-lg">
          <h2 className="font-display text-headline-md" id="link-form-title">
            Yeni Link Ekle
          </h2>
          <button
            aria-label="Kapat"
            className="rounded-full p-sm transition-all hover:bg-white/5"
            onClick={close}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>
        <form action={handleSubmit} className="space-y-lg p-lg sm:p-xl">
          <div className="space-y-sm">
            <label className="block text-label-md text-on-surface-variant" htmlFor="link-url">
              URL
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-surface-container px-md py-md text-body-md outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              id="link-url"
              name="url"
              placeholder="https://example.com"
              ref={urlInputRef}
              required
              type="url"
            />
          </div>
          <div className="space-y-sm">
            <label className="block text-label-md text-on-surface-variant" htmlFor="link-title">
              Başlık
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-surface-container px-md py-md text-body-md outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              id="link-title"
              name="title"
              placeholder="Link başlığı..."
              type="text"
            />
          </div>
          <div className="space-y-sm">
            <label
              className="block text-label-md text-on-surface-variant"
              htmlFor="link-description"
            >
              Açıklama
            </label>
            <textarea
              className="w-full resize-none rounded-xl border border-white/10 bg-surface-container px-md py-md text-body-md outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              id="link-description"
              name="description"
              placeholder="Kısa bir not ekleyin..."
              rows={3}
            />
          </div>
          <div className="space-y-sm">
            <label className="block text-label-md text-on-surface-variant" htmlFor="link-tags">
              Etiketler
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-surface-container px-md py-md text-body-md outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              id="link-tags"
              list="existing-tags"
              name="tags"
              placeholder="Virgül ile ayırın..."
              type="text"
            />
            <datalist id="existing-tags">
              {existingTagNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          {error ? (
            <p className="rounded-lg bg-error/10 px-md py-sm text-body-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-md pt-sm">
            <button
              className="flex-1 rounded-xl border border-white/10 py-md text-label-md transition-all hover:bg-white/5"
              onClick={close}
              type="button"
            >
              İptal
            </button>
            <button
              className="indigo-gradient-btn flex-1 rounded-xl py-md text-label-md text-white disabled:opacity-50"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Kaydediliyor..." : "Linki Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
