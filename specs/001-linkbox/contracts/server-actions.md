# Contract: Server Actions & Rotalar (001-linkbox)

Tüm mutasyonlar `app/actions/links.ts` içindeki server action'lardır (FR-005).
Ortak dönüş tipi:

```ts
type ActionResult = { ok: true } | { ok: false; error: string }; // error: Türkçe kullanıcı mesajı
```

Ortak ön koşullar:
- Env eksikse → `{ ok:false, error:"Veritabanı yapılandırması bekleniyor" }` (D11)
- Oturum yoksa → `{ ok:false, error:"Oturum bulunamadı" }` (middleware zaten /login'e yönlendirir; FR-008)
- Başarıda `revalidatePath('/')` (+ detay sayfası için `/links/[id]`)

## createLink(input)
- Girdi: `{ url: string; title?: string; description?: string; tags: string[] }`
- Doğrulama: URL formatı (Geçersiz URL), her etiket 1–50 karakter (Etiket uzunluğu geçersiz)
- Davranış: linki ekler (`user_id` = oturum uid); etiketleri `upsert` (user_id+name) edip `link_tags` bağlar
- Hatalar: 23505 unique → `Bu link zaten kayıtlı` (FR-002, Edge Case 409)

## updateLink(input)
- Girdi: `{ id: string; title?: string; description?: string; tags: string[] }`
- Davranış: başlık/açıklama günceller; etiket kümesini verilen listeyle senkronlar (ekle/sil). URL değiştirilemez (spec'te URL düzenleme senaryosu yok — YAGNI)
- RLS: yalnızca sahibi (auth.uid() = user_id) etkiler; satır bulunamazsa `Link bulunamadı`

## deleteLink(id)
- Girdi: `string` (link id)
- Davranış: satırı siler; `link_tags` CASCADE ile temizlenir

## Auth rotaları
- `POST` server action `signInWithPassword({ email, password })` → hata: `Giriş başarısız`
- `signInWithOtp({ email })` (magic link) → bilgi: `Giriş bağlantısı e-postanıza gönderildi`
- `GET /auth/callback?code=...` → `exchangeCodeForSession`, sonra `/` redirect
- `signOut()` → `/login` redirect

## Okuma sorguları (lib/queries.ts — server component'lerden çağrılır)
- `listLinks({ q?, tagIds?: string[], cursor? })`:
  - `q` varsa `search_vector @@ websearch_to_tsquery('simple', q)` (FR-003)
  - `tagIds` varsa AND mantığı: seçilen HER etiketi taşıyan linkler (US2-2; `link_tags` üzerinden `tag_id = ANY` + `HAVING count = tagIds.length` eşleniği)
  - Keyset: data-model.md Sayfalama bölümü; sayfa boyutu 12
  - Dönüş: `{ links: LinkWithTags[]; nextCursor: string | null; total: number }`
- `getLink(id)`: tek link + etiketleri; yoksa null
- `listTags()`: kullanıcının tüm etiketleri (ad sırasıyla)
- `getPreviewUrl(path)`: `previews` bucket'tan 300 sn signed URL (FR-006); env yoksa null

## HTTP semantiği eşleniği (Edge Cases)
Server action'lar HTTP durum kodu döndürmez; eşlemeler:
- 400 → `Geçersiz URL` / `Etiket uzunluğu geçersiz`
- 401 → middleware redirect `/login`
- 409 → `Bu link zaten kayıtlı`
