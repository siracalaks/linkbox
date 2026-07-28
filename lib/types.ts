/** Uygulama genelinde kullanılan veri tipleri (specs/001-linkbox/data-model.md). */

export interface Tag {
  id: string;
  name: string;
}

export interface LinkWithTags {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  note: string | null;
  preview_path: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface LinkListResult {
  links: LinkWithTags[];
  /** Sonraki sayfa imleci; yoksa null (keyset, FR-010). */
  nextCursor: string | null;
  /** Filtrelere göre toplam kayıt sayısı. */
  total: number;
}
