# Data Model: Linkbox (001-linkbox)

Kaynak: spec.md Key Entities + research.md kararları (D7, D8, D9, D14).
Şema `supabase/migrations/0001_init.sql` olarak teslim edilir; migration bu ortamda ÇALIŞTIRILMAZ.

## Tablolar

### links
| Kolon | Tip | Kısıt |
|-------|-----|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| user_id | uuid | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE |
| url | text | NOT NULL, CHECK geçerli http(s) formatı |
| title | text | NULL |
| description | text | NULL |
| preview_path | text | NULL (previews bucket'ındaki nesne yolu; D14) |
| created_at | timestamptz | NOT NULL default `now()` |
| updated_at | timestamptz | NOT NULL default `now()` (trigger ile tazelenir) |
| search_vector | tsvector | NOT NULL default `''` — trigger ile `title+description+url+etiket adları` (D7) |

Kısıtlar/indeksler:
- `UNIQUE (user_id, url)` (FR-002; ihlalde 409/"Bu link zaten kayıtlı")
- `CREATE INDEX links_keyset_idx ON links (user_id, created_at DESC, id DESC)` (FR-010, D9)
- `CREATE INDEX links_search_idx ON links USING GIN (search_vector)` (FR-003)

### tags
| Kolon | Tip | Kısıt |
|-------|-----|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| user_id | uuid | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE |
| name | varchar(50) | NOT NULL, CHECK `char_length(name) BETWEEN 1 AND 50` |
| created_at | timestamptz | NOT NULL default `now()` |

Kısıtlar/indeksler:
- `UNIQUE (user_id, name)` (D8 — anayasa RLS gereği kullanıcıya özel)

### link_tags
| Kolon | Tip | Kısıt |
|-------|-----|-------|
| link_id | uuid | FK → links(id) ON DELETE CASCADE |
| tag_id | uuid | FK → tags(id) ON DELETE CASCADE |
| user_id | uuid | NOT NULL (RLS basitliği için denormalize) |

Kısıtlar/indeksler:
- `PRIMARY KEY (link_id, tag_id)`
- `CREATE INDEX link_tags_tag_link_idx ON link_tags (tag_id, link_id)` (FR-009 — okuma yönü: etikete göre filtre)

### users
Supabase `auth.users` kullanılır; ayrı public tablo AÇILMAZ (YAGNI). `email` bilgisi oturumdan okunur.

## Trigger'lar / Fonksiyonlar (D7)

- `links_refresh_search_vector()` — BEFORE INSERT OR UPDATE ON links: `search_vector := to_tsvector('simple', title ‖ description ‖ url ‖ (o linkin etiket adları))`, `updated_at := now()`.
- `link_tags_refresh_search_vector()` — AFTER INSERT OR DELETE ON link_tags: ilgili `links` satırının search_vector'unu yeniden hesaplar.
- Fonksiyonlar `SECURITY DEFINER` DEĞİL; satır zaten RLS'ten geçmiş olur.

## RLS Politikaları (anayasa II)

Tüm tablolarda `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` + `FORCE`.

| Tablo | SELECT/UPDATE/DELETE USING | INSERT/UPDATE WITH CHECK |
|-------|---------------------------|--------------------------|
| links | `auth.uid() = user_id` | `auth.uid() = user_id` |
| tags | `auth.uid() = user_id` | `auth.uid() = user_id` |
| link_tags | `auth.uid() = user_id` | `auth.uid() = user_id` ve link sahipliği FK+trigger'la garanti |

## Storage

- `previews` bucket: private (`public = false`). Erişim yalnızca sunucu tarafı `createSignedUrl(path, 300)` (FR-006). Upload akışı MVP dışı (D14).

## Doğrulama Kuralları (uygulama katmanı, Edge Cases)

- URL: `new URL(x)` + protokol `http:`/`https:` değilse `Geçersiz URL` (400 eşleniği).
- Etiket adı: trim sonrası 1–50 karakter değilse `Etiket uzunluğu geçersiz`.
- Aynı URL: unique ihlali (Postgres 23505) → `Bu link zaten kayıtlı` (409 eşleniği).

## Sayfalama (D9)

İmleç: `base64url(JSON {c: created_at ISO, i: id})`. Sorgu: `WHERE user_id = auth.uid() AND (created_at, id) < (:c, :i) ORDER BY created_at DESC, id DESC LIMIT 12`. `LIMIT 12+1` ile "sonraki sayfa var mı" belirlenir.
