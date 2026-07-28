# Data Model: Linke kişisel not alanı

## Değişen Entity: Link

Mevcut `Link` modeline (bkz. `specs/001-linkbox/data-model.md`) TEK alan eklenir:

| Alan | Tip | Kısıt | Açıklama |
|------|-----|-------|----------|
| `note` | `String?` (Prisma) / `TEXT NULL` (Postgres) | max 200 karakter (uygulama + DB CHECK) | Kullanıcının linke eklediği kısa kişisel not (FR-001). `NULL` = not yok (Edge Case). |

Değişmeyenler: `id`, `userId`, `url`, `title`, `description`, `previewPath`,
`createdAt`, `updatedAt`, UNIQUE(`userId`,`url`), keyset indeksi. Mevcut
`search_vector` tsvector kolonu ve trigger'ları **değişmez** — not, arama
kapsamına dahil değildir (spec bunu istemiyor; YAGNI).

### Validation Rules

- `note` trim sonrası 0–200 karakter. Trim sonrası boş string → `NULL`
  olarak saklanır (Edge Case: "not alanı boş bırakılırsa NULL saklanır").
- 200 karakterden uzun girişte kaydetme engellenir, "Not 200 karakteri
  geçemez" hatası döner (FR-003, Edge Case).
- Karakter sayımı UTF‑8 byte değil, JS string `.length` (Unicode code unit)
  bazlıdır — spec Assumptions "karakter bazlı" ifadesiyle uyumlu (mevcut
  `validateTagName` ile aynı yaklaşım).

### State / Lifecycle

- Not, `Link` ile aynı satırda yaşar; link silinince (CASCADE) otomatik
  silinir — ek FK/CASCADE kuralı gerekmez.
- Not güncellemesi `updatedAt`i günceller (mevcut `updateMany` zaten
  `updated_at`i trigger ile günceller — `links_search_vector_trg` yalnız
  title/description/url değişince tetiklenir; not değişince search_vector
  DEĞİŞMEZ ama `updated_at` yine de mevcut trigger'ın kapsamı dışında kalan
  bir UPDATE olduğu için Prisma tarafında `updatedAt: new Date()` ile elle
  güncellenmesi gerekir — bkz. contracts/server-actions.md).

## Migration Planı

`prisma/migrations/0002_link_note/migration.sql` (YENİ, elle yazılır,
0001_init'e dokunulmaz):

```sql
ALTER TABLE "links" ADD COLUMN "note" TEXT;
ALTER TABLE "links" ADD CONSTRAINT "links_note_length_check"
    CHECK (char_length("note") <= 200);
```

Prisma şema eklemesi (`prisma/schema.prisma`, `Link` modeli içine):

```prisma
note String?
```
