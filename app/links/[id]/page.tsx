import { notFound, redirect } from "next/navigation";
import { DbPending } from "@/components/db-pending";
import { Header } from "@/components/header";
import { LinkDetailForm } from "@/components/link-detail-form";
import { MobileNav } from "@/components/mobile-nav";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { getSessionUser } from "@/auth";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTr } from "@/lib/format";
import { getLink, listTags } from "@/lib/queries";
import { getPreviewUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const metadata = { title: "Link Detayı | Linkbox" };

/** Link detayı — Ekran 2 (docs/design/screen-2.html). */
export default async function LinkDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isDatabaseConfigured()) {
    return (
      <>
        <Header backHref="/" email={null} />
        <main className="p-md md:p-xl">
          <DbPending />
        </main>
      </>
    );
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [link, tags] = await Promise.all([
    getLink(user.id, params.id),
    listTags(user.id),
  ]);
  if (!link) notFound();

  const previewUrl = await getPreviewUrl(link.preview_path);

  return (
    <>
      <Header backHref="/" email={user.email ?? null} />
      <RealtimeRefresher />
      <main className="mx-auto mb-24 w-full max-w-container-max px-md pt-xl md:mb-0 md:px-lg">
        <nav aria-label="Sayfa yolu" className="mb-lg flex items-center gap-sm text-label-md text-on-surface-variant">
          <span>Tüm Linkler</span>
          <span aria-hidden="true" className="material-symbols-outlined text-sm">
            chevron_right
          </span>
          <span className="text-primary">Detay Görünümü</span>
        </nav>

        <div className="grid grid-cols-1 items-start gap-xl lg:grid-cols-2">
          <div className="glass-effect aspect-video w-full overflow-hidden rounded-2xl">
            {previewUrl ? (
              // Signed URL 5 dk geçerli (FR-006); private bucket'tan sunulur.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${link.title ?? "Link"} önizleme görseli`}
                className="h-full w-full object-cover"
                src={previewUrl}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-container-low">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[64px] text-primary/40"
                >
                  link
                </span>
              </div>
            )}
          </div>

          <LinkDetailForm existingTagNames={tags.map((tag) => tag.name)} link={link} />
        </div>

        <footer className="mt-2xl flex flex-col items-center justify-between gap-md border-t border-white/10 py-lg md:flex-row">
          <div className="flex items-center gap-sm text-label-xs text-on-surface-variant">
            <span aria-hidden="true" className="material-symbols-outlined text-sm">
              history
            </span>
            Son güncelleme: {formatDateTr(link.updated_at)}
          </div>
        </footer>
      </main>
      <MobileNav />
    </>
  );
}
