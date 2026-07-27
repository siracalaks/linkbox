"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type PrismaClient } from "@prisma/client";
import { getSessionUser } from "@/auth";
import { getDb } from "@/lib/db";
import { DB_PENDING_MESSAGE } from "@/lib/env";
import {
  DUPLICATE_LINK_MESSAGE,
  normalizeTags,
  validateUrl,
} from "@/lib/validation";
import type { ActionResult } from "@/app/actions/auth";

export interface CreateLinkInput {
  url: string;
  title?: string;
  description?: string;
  tags: string[];
}

export interface UpdateLinkInput {
  id: string;
  title?: string;
  description?: string;
  tags: string[];
}

type SessionContext =
  | { ok: false; error: string }
  | { ok: true; db: PrismaClient; userId: string };

/** Ortak ön koşul: env + oturum. RLS yok — her sorgu userId ile daraltılır. */
async function requireSession(): Promise<SessionContext> {
  const db = getDb();
  if (!db) {
    return { ok: false, error: DB_PENDING_MESSAGE };
  }
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı" };
  }
  return { ok: true, db, userId: user.id };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Etiket adlarını upsert edip id listesini döndürür
 * (tags UNIQUE(user_id, name); contracts/server-actions.md).
 */
async function upsertTags(
  db: PrismaClient,
  userId: string,
  tagNames: string[]
): Promise<{ ids: string[] } | { failure: string }> {
  if (tagNames.length === 0) return { ids: [] };
  try {
    const ids: string[] = [];
    for (const name of tagNames) {
      const tag = await db.tag.upsert({
        where: { userId_name: { userId, name } },
        create: { userId, name },
        update: {},
        select: { id: true },
      });
      ids.push(tag.id);
    }
    return { ids };
  } catch {
    return { failure: "Etiketler kaydedilemedi" };
  }
}

/** Yeni link kaydeder (US1, FR-001/FR-002). */
export async function createLink(input: CreateLinkInput): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { db, userId } = session;

  const urlCheck = validateUrl(input.url);
  if (!urlCheck.ok) return { ok: false, error: urlCheck.error };
  const tagsCheck = normalizeTags(input.tags);
  if (!tagsCheck.ok) return { ok: false, error: tagsCheck.error };

  let linkId: string;
  try {
    const link = await db.link.create({
      data: {
        userId,
        url: urlCheck.value,
        title: input.title?.trim() || null,
        description: input.description?.trim() || null,
      },
      select: { id: true },
    });
    linkId = link.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: DUPLICATE_LINK_MESSAGE };
    }
    return { ok: false, error: "Link kaydedilemedi" };
  }

  const tagResult = await upsertTags(db, userId, tagsCheck.value);
  if ("failure" in tagResult) return { ok: false, error: tagResult.failure };
  if (tagResult.ids.length > 0) {
    try {
      await db.linkTag.createMany({
        data: tagResult.ids.map((tagId) => ({ linkId, tagId, userId })),
        skipDuplicates: true,
      });
    } catch {
      return { ok: false, error: "Etiketler bağlanamadı" };
    }
  }

  revalidatePath("/");
  return { ok: true };
}

/** Başlık/açıklama günceller ve etiket kümesini senkronlar (US1 detay). */
export async function updateLink(input: UpdateLinkInput): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { db, userId } = session;

  const tagsCheck = normalizeTags(input.tags);
  if (!tagsCheck.ok) return { ok: false, error: tagsCheck.error };

  try {
    const updated = await db.link.updateMany({
      where: { id: input.id, userId },
      data: {
        title: input.title?.trim() || null,
        description: input.description?.trim() || null,
      },
    });
    if (updated.count === 0) return { ok: false, error: "Link bulunamadı" };
  } catch {
    return { ok: false, error: "Link bulunamadı" };
  }

  const tagResult = await upsertTags(db, userId, tagsCheck.value);
  if ("failure" in tagResult) return { ok: false, error: tagResult.failure };
  const desiredIds = new Set(tagResult.ids);

  const currentRows = await db.linkTag.findMany({
    where: { linkId: input.id, userId },
    select: { tagId: true },
  });
  const currentIds = new Set(currentRows.map((row) => row.tagId));

  const toAdd = tagResult.ids.filter((id) => !currentIds.has(id));
  const toRemoveIds: string[] = [];
  currentIds.forEach((id) => {
    if (!desiredIds.has(id)) toRemoveIds.push(id);
  });

  if (toAdd.length > 0) {
    try {
      await db.linkTag.createMany({
        data: toAdd.map((tagId) => ({ linkId: input.id, tagId, userId })),
        skipDuplicates: true,
      });
    } catch {
      return { ok: false, error: "Etiketler bağlanamadı" };
    }
  }
  if (toRemoveIds.length > 0) {
    try {
      await db.linkTag.deleteMany({
        where: { linkId: input.id, userId, tagId: { in: toRemoveIds } },
      });
    } catch {
      return { ok: false, error: "Etiketler güncellenemedi" };
    }
  }

  revalidatePath("/");
  revalidatePath(`/links/${input.id}`);
  return { ok: true };
}

/** Linki siler; link_tags CASCADE ile temizlenir. */
export async function deleteLink(id: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { db, userId } = session;

  try {
    await db.link.deleteMany({ where: { id, userId } });
  } catch {
    return { ok: false, error: "Link silinemedi" };
  }

  revalidatePath("/");
  return { ok: true };
}
