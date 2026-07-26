"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { DB_PENDING_MESSAGE } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase/server";
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
  | { ok: true; supabase: SupabaseClient; user: User };

/** Ortak ön koşul: env + oturum. */
async function requireSession(): Promise<SessionContext> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { ok: false, error: DB_PENDING_MESSAGE };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı" };
  }
  return { ok: true, supabase, user };
}

/**
 * Etiket adlarını upsert edip id listesini döndürür
 * (tags UNIQUE(user_id, name); contracts/server-actions.md).
 */
async function upsertTags(
  supabase: SupabaseClient,
  userId: string,
  tagNames: string[]
): Promise<{ ids: string[] } | { failure: string }> {
  if (tagNames.length === 0) return { ids: [] };
  const { data, error } = await supabase
    .from("tags")
    .upsert(
      tagNames.map((name) => ({ user_id: userId, name })),
      { onConflict: "user_id,name", ignoreDuplicates: false }
    )
    .select("id, name");
  if (error || !data) return { failure: "Etiketler kaydedilemedi" };
  return { ids: data.map((tag) => tag.id) };
}

/** Yeni link kaydeder (US1, FR-001/FR-002). */
export async function createLink(input: CreateLinkInput): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { supabase, user } = session;

  const urlCheck = validateUrl(input.url);
  if (!urlCheck.ok) return { ok: false, error: urlCheck.error };
  const tagsCheck = normalizeTags(input.tags);
  if (!tagsCheck.ok) return { ok: false, error: tagsCheck.error };

  const { data: link, error } = await supabase
    .from("links")
    .insert({
      user_id: user.id,
      url: urlCheck.value,
      title: input.title?.trim() || null,
      description: input.description?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !link) {
    if (error?.code === "23505") {
      return { ok: false, error: DUPLICATE_LINK_MESSAGE };
    }
    return { ok: false, error: "Link kaydedilemedi" };
  }

  const tagResult = await upsertTags(supabase, user.id, tagsCheck.value);
  if ("failure" in tagResult) return { ok: false, error: tagResult.failure };
  if (tagResult.ids.length > 0) {
    const { error: linkTagError } = await supabase.from("link_tags").insert(
      tagResult.ids.map((tagId) => ({
        link_id: link.id,
        tag_id: tagId,
        user_id: user.id,
      }))
    );
    if (linkTagError) return { ok: false, error: "Etiketler bağlanamadı" };
  }

  revalidatePath("/");
  return { ok: true };
}

/** Başlık/açıklama günceller ve etiket kümesini senkronlar (US1 detay). */
export async function updateLink(input: UpdateLinkInput): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { supabase, user } = session;

  const tagsCheck = normalizeTags(input.tags);
  if (!tagsCheck.ok) return { ok: false, error: tagsCheck.error };

  const { data: updated, error } = await supabase
    .from("links")
    .update({
      title: input.title?.trim() || null,
      description: input.description?.trim() || null,
    })
    .eq("id", input.id)
    .select("id")
    .maybeSingle();

  if (error || !updated) return { ok: false, error: "Link bulunamadı" };

  const tagResult = await upsertTags(supabase, user.id, tagsCheck.value);
  if ("failure" in tagResult) return { ok: false, error: tagResult.failure };
  const desiredIds = new Set(tagResult.ids);

  const { data: currentRows } = await supabase
    .from("link_tags")
    .select("tag_id")
    .eq("link_id", input.id);
  const currentIds = new Set((currentRows ?? []).map((row) => row.tag_id));

  const toAdd = tagResult.ids.filter((id) => !currentIds.has(id));
  const toRemoveIds: string[] = [];
  currentIds.forEach((id) => {
    if (!desiredIds.has(id)) toRemoveIds.push(id);
  });

  if (toAdd.length > 0) {
    const { error: addError } = await supabase.from("link_tags").insert(
      toAdd.map((tagId) => ({
        link_id: input.id,
        tag_id: tagId,
        user_id: user.id,
      }))
    );
    if (addError) return { ok: false, error: "Etiketler bağlanamadı" };
  }
  if (toRemoveIds.length > 0) {
    const { error: removeError } = await supabase
      .from("link_tags")
      .delete()
      .eq("link_id", input.id)
      .in("tag_id", toRemoveIds);
    if (removeError) return { ok: false, error: "Etiketler güncellenemedi" };
  }

  revalidatePath("/");
  revalidatePath(`/links/${input.id}`);
  return { ok: true };
}

/** Linki siler; link_tags CASCADE ile temizlenir. */
export async function deleteLink(id: string): Promise<ActionResult> {
  const session = await requireSession();
  if (!session.ok) return session;
  const { supabase } = session;

  const { error } = await supabase.from("links").delete().eq("id", id);
  if (error) return { ok: false, error: "Link silinemedi" };

  revalidatePath("/");
  return { ok: true };
}
