"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteLink, updateLink } from "@/app/actions/links";
import type { LinkWithTags } from "@/lib/types";

type Feedback = { kind: "error" | "info"; text: string } | null;

/**
 * Link detayı düzenleme formu (docs/design/screen-2.html): başlık,
 * açıklama, kopyalanabilir URL, etiket chip'leri (x ile kaldır +
 * autocomplete'li ekleme), Kaydet / Aç / Sil aksiyonları.
 */
export function LinkDetailForm({
  link,
  existingTagNames,
}: {
  link: LinkWithTags;
  existingTagNames: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(link.title ?? "");
  const [description, setDescription] = useState(link.description ?? "");
  const [tagNames, setTagNames] = useState<string[]>(link.tags.map((tag) => tag.name));
  const [newTag, setNewTag] = useState("");
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isPending, startTransition] = useTransition();

  function addTag() {
    const value = newTag.trim().toLocaleLowerCase("tr");
    if (!value) return;
    if (!tagNames.includes(value)) setTagNames([...tagNames, value]);
    setNewTag("");
  }

  function removeTag(name: string) {
    setTagNames(tagNames.filter((tag) => tag !== name));
  }

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateLink({ id: link.id, title, description, tags: tagNames });
      if (result.ok) {
        setFeedback({ kind: "info", text: "Değişiklikler kaydedildi" });
        router.refresh();
      } else {
        setFeedback({ kind: "error", text: result.error });
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Bu link silinsin mi?")) return;
    startTransition(async () => {
      const result = await deleteLink(link.id);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setFeedback({ kind: "error", text: result.error });
      }
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFeedback({ kind: "error", text: "Kopyalama başarısız" });
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      <section className="flex flex-col gap-sm">
        <label className="text-label-md text-primary" htmlFor="detail-title">
          Başlık
        </label>
        <input
          className="w-full rounded-xl border border-white/10 bg-surface-container-low px-md py-md font-display text-headline-md text-on-surface outline-none transition-all focus:border-primary/50"
          id="detail-title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Başlık ekleyin..."
          type="text"
          value={title}
        />
      </section>

      <section className="flex flex-col gap-sm">
        <label className="text-label-md text-primary" htmlFor="detail-description">
          Açıklama
        </label>
        <textarea
          className="w-full resize-none rounded-xl border border-white/10 bg-surface-container-low px-md py-md text-body-md text-on-surface-variant outline-none transition-all focus:border-primary/50"
          id="detail-description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Kısa bir not ekleyin..."
          rows={3}
          value={description}
        />
      </section>

      <section className="flex flex-col gap-sm">
        <span className="text-label-md text-primary">Bağlantı Adresi</span>
        <div className="flex items-center gap-sm rounded-xl border border-white/10 bg-surface-container-low p-md transition-all focus-within:border-primary/50">
          <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant">
            link
          </span>
          <input
            aria-label="Bağlantı adresi"
            className="min-w-0 flex-1 truncate border-none bg-transparent text-body-sm text-on-surface-variant outline-none"
            readOnly
            type="text"
            value={link.url}
          />
          <button
            aria-label="Bağlantıyı kopyala"
            className={`flex items-center gap-xs rounded-lg p-sm transition-colors hover:bg-primary/10 ${
              copied ? "text-secondary" : "text-primary"
            }`}
            onClick={handleCopy}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              {copied ? "check" : "content_copy"}
            </span>
            <span className="hidden text-label-xs sm:inline">
              {copied ? "Kopyalandı" : "Kopyala"}
            </span>
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <label className="text-label-md text-primary" htmlFor="detail-new-tag">
            Etiketler
          </label>
          <span className="text-label-xs text-on-surface-variant">
            {tagNames.length} Etiket
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-sm rounded-xl border border-white/10 bg-surface-container-low p-md">
          {tagNames.map((name) => (
            <span
              className="flex items-center gap-xs rounded-full border border-primary/20 bg-primary/10 px-sm py-xs text-label-xs uppercase tracking-wider text-primary"
              key={name}
            >
              #{name}
              <button
                aria-label={`${name} etiketini kaldır`}
                className="flex items-center hover:text-white"
                onClick={() => removeTag(name)}
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xs">
                  close
                </span>
              </button>
            </span>
          ))}
          <input
            className="min-w-[120px] flex-1 border-none bg-transparent p-0 px-xs text-body-sm text-on-surface outline-none"
            id="detail-new-tag"
            list="detail-existing-tags"
            onChange={(event) => setNewTag(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag();
              }
            }}
            placeholder="Yeni etiket ekle..."
            type="text"
            value={newTag}
          />
          <datalist id="detail-existing-tags">
            {existingTagNames
              .filter((name) => !tagNames.includes(name))
              .map((name) => (
                <option key={name} value={name} />
              ))}
          </datalist>
        </div>
      </section>

      {feedback ? (
        <p
          className={
            feedback.kind === "error"
              ? "rounded-lg bg-error/10 px-md py-sm text-body-sm text-error"
              : "rounded-lg bg-primary/10 px-md py-sm text-body-sm text-primary"
          }
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      ) : null}

      <section className="flex flex-col flex-wrap items-stretch gap-md border-t border-white/5 pt-md sm:flex-row sm:items-center">
        <button
          className="flex items-center justify-center gap-sm rounded-xl bg-primary-container px-xl py-md text-label-md text-on-primary-container shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 sm:flex-none"
          disabled={isPending}
          onClick={handleSave}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            save
          </span>
          Kaydet
        </button>
        <a
          className="flex items-center justify-center gap-sm rounded-xl border border-outline-variant px-xl py-md text-label-md text-on-surface transition-all hover:bg-surface-container-high active:scale-95 sm:flex-none"
          href={link.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            open_in_new
          </span>
          Aç
        </a>
        <button
          className="flex items-center justify-center gap-sm rounded-xl px-xl py-md text-label-md text-error transition-all hover:bg-error/10 active:scale-95 disabled:opacity-50 sm:ml-auto sm:flex-none"
          disabled={isPending}
          onClick={handleDelete}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            delete
          </span>
          Sil
        </button>
      </section>
    </div>
  );
}
