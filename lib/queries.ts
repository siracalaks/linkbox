import type { Prisma, PrismaClient } from "@prisma/client";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import { getDb } from "@/lib/db";
import { intersectLinkIds } from "@/lib/tag-filter";
import type { LinkListResult, LinkWithTags, Tag } from "@/lib/types";

/** Dashboard sayfa boyutu (keyset pagination, FR-010). */
export const PAGE_SIZE = 12;

const LINK_INCLUDE = {
  linkTags: { include: { tag: { select: { id: true, name: true } } } },
} satisfies Prisma.LinkInclude;

type LinkRow = Prisma.LinkGetPayload<{ include: typeof LINK_INCLUDE }>;

/** Prisma satırını LinkWithTags'e düzleştirir. */
function toLinkWithTags(row: LinkRow): LinkWithTags {
  const tags: Tag[] = row.linkTags
    .map((lt) => lt.tag)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    note: row.note,
    preview_path: row.previewPath,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    tags,
  };
}

export interface ListLinksParams {
  q?: string;
  tagIds?: string[];
  cursor?: string;
}

/**
 * Tam-metin arama (FR-003): search_vector kolonu Prisma modelinde olmadığı
 * için ham SQL — GIN indeksi üzerinden websearch sözdizimiyle eşleşen
 * link id'leri döner. Parametreler bağlıdır (injection yok).
 */
async function searchLinkIds(
  db: PrismaClient,
  userId: string,
  q: string
): Promise<string[]> {
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id::text AS id
      FROM public.links
     WHERE user_id = ${userId}::uuid
       AND search_vector @@ websearch_to_tsquery('simple', ${q})
  `;
  return rows.map((row) => row.id);
}

/**
 * Kullanıcının linklerini keyset pagination ile listeler (yeni → eski).
 * Env yoksa güvenli boş sonuç döner (research D11). RLS kaldırıldığı için
 * TÜM sorgular userId ile daraltılır (uygulama katmanı izolasyonu).
 */
export async function listLinks(
  userId: string,
  params: ListLinksParams = {}
): Promise<LinkListResult> {
  const db = getDb();
  if (!db) return { links: [], nextCursor: null, total: 0 };

  try {
    // AND etiket filtresi (US2): seçilen HER etiketi taşıyan link id kümesi.
    let idFilter: string[] | null = null;
    if (params.tagIds && params.tagIds.length > 0) {
      const tagRows = await db.linkTag.findMany({
        where: { userId, tagId: { in: params.tagIds } },
        select: { linkId: true, tagId: true },
      });
      idFilter = intersectLinkIds(
        tagRows.map((row) => ({ link_id: row.linkId, tag_id: row.tagId })),
        params.tagIds
      );
      if (idFilter.length === 0) {
        return { links: [], nextCursor: null, total: 0 };
      }
    }

    // Tam-metin arama (US3): id kümesiyle kesiştirilir.
    if (params.q && params.q.trim()) {
      const searchIds = await searchLinkIds(db, userId, params.q.trim());
      if (idFilter) {
        const allowed = new Set(idFilter);
        idFilter = searchIds.filter((id) => allowed.has(id));
      } else {
        idFilter = searchIds;
      }
      if (idFilter.length === 0) {
        return { links: [], nextCursor: null, total: 0 };
      }
    }

    const where: Prisma.LinkWhereInput = {
      userId,
      ...(idFilter ? { id: { in: idFilter } } : {}),
    };

    // Toplam sayı (filtrelere göre; sayfalamadan bağımsız).
    const total = await db.link.count({ where });

    // Keyset: (created_at, id) < (c, i) — OFFSET yok (FR-010, D9).
    const cursor = decodeCursor(params.cursor);
    const pageWhere: Prisma.LinkWhereInput = cursor
      ? {
          AND: [
            where,
            {
              OR: [
                { createdAt: { lt: new Date(cursor.c) } },
                { createdAt: new Date(cursor.c), id: { lt: cursor.i } },
              ],
            },
          ],
        }
      : where;

    const data = await db.link.findMany({
      where: pageWhere,
      include: LINK_INCLUDE,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
    });

    const hasMore = data.length > PAGE_SIZE;
    const pageRows = hasMore ? data.slice(0, PAGE_SIZE) : data;
    const links = pageRows.map(toLinkWithTags);
    const last = links[links.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor({ c: last.created_at, i: last.id }) : null;

    return { links, nextCursor, total };
  } catch {
    // Bozuk imleç/uuid gibi durumlarda güvenli boş sonuç.
    return { links: [], nextCursor: null, total: 0 };
  }
}

/** Tek linki etiketleriyle getirir; bulunamazsa null. */
export async function getLink(
  userId: string,
  id: string
): Promise<LinkWithTags | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const row = await db.link.findFirst({
      where: { id, userId },
      include: LINK_INCLUDE,
    });
    return row ? toLinkWithTags(row) : null;
  } catch {
    return null; // geçersiz uuid vb. — 404 akışı
  }
}

/** Kullanıcının tüm etiketleri (ad sırasıyla). */
export async function listTags(userId: string): Promise<Tag[]> {
  const db = getDb();
  if (!db) return [];
  return db.tag.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
