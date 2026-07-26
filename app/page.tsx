import { redirect } from "next/navigation";
import { DbPending } from "@/components/db-pending";
import { Header } from "@/components/header";
import { LinkCard } from "@/components/link-card";
import { LinkFormModal } from "@/components/link-form-modal";
import { MobileNav } from "@/components/mobile-nav";
import { Pagination } from "@/components/pagination";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { SearchBar } from "@/components/search-bar";
import { Sidebar } from "@/components/sidebar";
import { TagFilter } from "@/components/tag-filter";
import { isSupabaseConfigured } from "@/lib/env";
import { listLinks, listTags } from "@/lib/queries";
import { getPreviewUrlMap } from "@/lib/storage";
import { getSessionUser } from "@/lib/supabase/server";

// Env ve oturum her istekte kontrol edilir (research D11, D5: public cache yok).
export const dynamic = "force-dynamic";

interface DashboardSearchParams {
  q?: string;
  tags?: string;
  cursor?: string;
  new?: string;
}

/** Dashboard — Ekran 1 (docs/design/screen-1.html): liste, filtre, sayfalama. */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <Header email={null} />
        <main className="p-md md:p-xl">
          <DbPending />
        </main>
      </>
    );
  }

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tagIds = searchParams.tags
    ? searchParams.tags.split(",").filter(Boolean)
    : [];
  const hasQuery = Boolean(searchParams.q && searchParams.q.trim());

  const [result, tags] = await Promise.all([
    listLinks({ q: searchParams.q, tagIds, cursor: searchParams.cursor }),
    listTags(),
  ]);

  const isModalOpen = searchParams.new === "1";

  const previewUrls = await getPreviewUrlMap(
    result.links
      .map((link) => link.preview_path)
      .filter((path): path is string => Boolean(path))
  );

  return (
    <>
      <Header email={user.email ?? null} />
      <RealtimeRefresher userId={user.id} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="mb-24 min-w-0 flex-1 p-md md:mb-0 md:p-xl">
          <section className="mx-auto mb-xl max-w-container-max">
            <div className="flex flex-col justify-between gap-md lg:flex-row lg:items-center">
              <SearchBar />
              <TagFilter tags={tags} />
            </div>
          </section>
          <section className="mx-auto max-w-container-max">
            {result.links.length === 0 ? (
              <div className="glass-effect flex flex-col items-center gap-md rounded-xl p-2xl text-center">
                {hasQuery || tagIds.length > 0 ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[48px] text-primary/40"
                    >
                      search_off
                    </span>
                    <p className="text-body-md text-on-surface-variant">Sonuç bulunamadı</p>
                  </>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[48px] text-primary/40"
                    >
                      bookmark_add
                    </span>
                    <p className="text-body-md text-on-surface-variant">
                      Henüz kayıtlı link yok. İlk linkinizi ekleyin.
                    </p>
                    <a
                      className="indigo-gradient-btn flex items-center gap-sm rounded-xl px-lg py-sm text-label-md text-white"
                      href="/?new=1"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined">
                        add
                      </span>
                      Yeni Link Ekle
                    </a>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {result.links.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    previewUrl={
                      link.preview_path
                        ? previewUrls.get(link.preview_path) ?? null
                        : null
                    }
                  />
                ))}
              </div>
            )}
            <Pagination nextCursor={result.nextCursor} total={result.total} />
          </section>
        </main>
      </div>
      <MobileNav />
      {isModalOpen ? (
        <LinkFormModal existingTagNames={tags.map((tag) => tag.name)} />
      ) : null}
    </>
  );
}
