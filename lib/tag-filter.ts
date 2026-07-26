/**
 * AND etiket filtresi yardımcısı (US2-2, FR-009): verilen
 * (link_id, tag_id) eşleşmelerinden, gereken TÜM etiketleri taşıyan
 * link id'lerini döndürür. Saf fonksiyon — birim testlidir.
 */
export function intersectLinkIds(
  rows: Array<{ link_id: string; tag_id: string }>,
  requiredTagIds: string[]
): string[] {
  const byLink = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = byLink.get(row.link_id) ?? new Set<string>();
    set.add(row.tag_id);
    byLink.set(row.link_id, set);
  }
  const required = new Set(requiredTagIds);
  const result: string[] = [];
  byLink.forEach((tagSet, linkId) => {
    let hasAll = true;
    required.forEach((tagId) => {
      if (!tagSet.has(tagId)) hasAll = false;
    });
    if (hasAll) result.push(linkId);
  });
  return result;
}
