import { decodeCursor, encodeCursor } from "@/lib/cursor";
import { intersectLinkIds } from "@/lib/tag-filter";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { LinkListResult, LinkWithTags, Tag } from "@/lib/types";

/** Dashboard sayfa boyutu (keyset pagination, FR-010). */
export const PAGE_SIZE = 12;

const LINK_SELECT =
  "id, url, title, description, preview_path, created_at, updated_at, link_tags(tags(id, name))";

/** PostgREST gömülü satırını LinkWithTags'e düzleştirir. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLinkWithTags(row: any): LinkWithTags {
  const tags: Tag[] = (row.link_tags ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((lt: any) => lt.tags)
    .filter(Boolean)
    .sort((a: Tag, b: Tag) => a.name.localeCompare(b.name, "tr"));
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    preview_path: row.preview_path,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags,
  };
}

export interface ListLinksParams {
  q?: string;
  tagIds?: string[];
  cursor?: string;
}

/**
 * Kullanıcının linklerini keyset pagination ile listeler (yeni → eski).
 * Env veya oturum yoksa güvenli boş sonuç döner (research D11).
 */
export async function listLinks(params: ListLinksParams = {}): Promise<LinkListResult> {
  const supabase = getSupabaseServer();
  if (!supabase) return { links: [], nextCursor: null, total: 0 };

  // AND etiket filtresi (US2): seçilen HER etiketi taşıyan link id kümesi.
  let requiredLinkIds: string[] | null = null;
  if (params.tagIds && params.tagIds.length > 0) {
    const { data: tagRows } = await supabase
      .from("link_tags")
      .select("link_id, tag_id")
      .in("tag_id", params.tagIds);
    requiredLinkIds = intersectLinkIds(tagRows ?? [], params.tagIds);
    if (requiredLinkIds.length === 0) {
      return { links: [], nextCursor: null, total: 0 };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (query: any) => {
    if (requiredLinkIds) query = query.in("id", requiredLinkIds);
    if (params.q && params.q.trim()) {
      query = query.textSearch("search_vector", params.q.trim(), {
        type: "websearch",
        config: "simple",
      });
    }
    return query;
  };

  // Toplam sayı (filtrelere göre; sayfalamadan bağımsız).
  const { count } = await applyFilters(
    supabase.from("links").select("id", { count: "exact", head: true })
  );

  let query = applyFilters(supabase.from("links").select(LINK_SELECT));

  const cursor = decodeCursor(params.cursor);
  if (cursor) {
    // Keyset: (created_at, id) < (c, i) — OFFSET yok (FR-010, D9).
    query = query.or(
      `created_at.lt.${cursor.c},and(created_at.eq.${cursor.c},id.lt.${cursor.i})`
    );
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (error || !data) return { links: [], nextCursor: null, total: count ?? 0 };

  const hasMore = data.length > PAGE_SIZE;
  const pageRows = hasMore ? data.slice(0, PAGE_SIZE) : data;
  const links = pageRows.map(toLinkWithTags);
  const last = links[links.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ c: last.created_at, i: last.id }) : null;

  return { links, nextCursor, total: count ?? 0 };
}

/** Tek linki etiketleriyle getirir; bulunamazsa null. */
export async function getLink(id: string): Promise<LinkWithTags | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("links")
    .select(LINK_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toLinkWithTags(data);
}

/** Kullanıcının tüm etiketleri (ad sırasıyla). */
export async function listTags(): Promise<Tag[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("tags")
    .select("id, name")
    .order("name", { ascending: true });
  return data ?? [];
}
