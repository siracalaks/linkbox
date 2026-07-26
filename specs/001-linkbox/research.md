# Research: Linkbox (001-linkbox)

**Tarih**: 2026-07-26 · **Girdi**: spec.md, constitution.md, docs/STITCH-PROMPT.md, docs/design/*

Spec'in Clarifications bölümündeki bazı maddeler birbiriyle ve anayasayla çelişiyor.
Aşağıdaki kararlar "ana senaryoyu bozmayanı uygula" kuralıyla alındı.

## D1 — Veri-at-rest şifreleme (pgcrypto BYTEA): REDDEDİLDİ
- **Karar**: `url`, `title` alanları düz `text` kalır; pgcrypto ile BYTEA şifreleme uygulanmaz.
- **Gerekçe**: BYTEA'ya şifrelenmiş alanlar üzerinde `tsvector` + GIN tam-metin arama (FR-003, US3 — P2 ana senaryo) ve `UNIQUE (user_id, url)` (FR-002, US1 ana senaryo) çalışamaz. Clarification maddesi ana senaryoları bozar. Supabase zaten disk seviyesinde at-rest şifreleme sağlar; anayasa V (YAGNI) ek katmanı yasaklar. Spec Assumptions bölümü de uygulama katmanında ek şifreleme olmayacağını söyler.
- **Alternatif**: Sadece aranmayan alanları şifrelemek — aranmayan hassas alan yok, değersiz.

## D2 — Vercel cron ile /api/cleanup: REDDEDİLDİ
- **Karar**: Cron tabanlı otomatik silme yok; yalnızca manuel silme (server action).
- **Gerekçe**: Deploy hedefi Coolify (nixpacks); Vercel'e özgü scheduled functions yok (anayasa Deployment maddesi Vercel-özel yapılandırmayı yasaklar). Spec Assumptions: "Cron-tabanlı temizlik MVP'de yer almayacak; sadece manuel silme API'si sağlanacaktır."
- **Alternatif**: pg_cron — D3'te reddedildi.

## D3 — pg_cron ile 90 gün veri saklama: REDDEDİLDİ
- **Karar**: Otomatik veri saklama süresi politikası MVP dışı.
- **Gerekçe**: Spec Assumptions açıkça MVP dışı bırakır; anayasa V (YAGNI). CASCADE FK'ler manuel silmede bütünlüğü zaten korur.

## D4 — audit.log + event_trigger + admin UI: REDDEDİLDİ
- **Karar**: Audit log tablosu ve `/api/audit` admin ekranı yapılmaz.
- **Gerekçe**: Hiçbir FR, user story veya UI gereksinimi audit istemiyor; admin rolü spec'te yok. Anayasa V (YAGNI). Ana senaryolara katkısı yok.

## D5 — lru-cache + ISR public cache: KISMEN REDDEDİLDİ
- **Karar**: `lru-cache` bağımlılığı eklenmez. Tüm veri RLS ile kullanıcıya özel olduğundan `Cache-Control: public` / ISR kullanılamaz; kullanıcıya özel yanıtlar `Cache-Control: private, max-age=60` ile işaretlenir, sayfalar dinamik render edilir.
- **Gerekçe**: FR-007/anayasa "Cache" maddesi public önbellek ister, ancak anayasa II (Security: RLS, kullanıcı izolasyonu) Core Principle'dır ve Additional Constraint'ten üstündür; kullanıcıya özel veriyi public cache'lemek veri sızıntısıdır. lru-cache tek süreçli standalone'da bile auth'lu veride cache-key karmaşası yaratır (YAGNI).
- **Alternatif**: Global (kullanıcıdan bağımsız) popüler içerik yok — tags dahi RLS'li (D8).

## D6 — Mutasyon katmanı: SERVER ACTIONS (FR-005 kazandı)
- **Karar**: Ekleme/güncelleme/silme Next.js App Router server action'ları ile; veri okuma server component'lerde `@supabase/ssr` server client ile.
- **Gerekçe**: Clarification 5 (API Routes + useSWR) ile FR-005 (server actions) çelişir; FR normatiftir. Service-role anahtarı yalnızca sunucuda kalır. SWR eklenmez (YAGNI); realtime aboneliği (FR-004) zaten UI'ı tazeler.

## D7 — search_vector güncelleme: TRIGGER İLE (etiketler dahil)
- **Karar**: `links.search_vector` normal `tsvector` kolonu; `links` üzerinde BEFORE INSERT/UPDATE trigger'ı ve `link_tags` değişikliklerinde ilgili linki yenileyen AFTER trigger'ı `title + description + url + etiket adları`nı birleştirir. GIN indeksi bu kolonda.
- **Gerekçe**: FR-003 etiketlerin de aranmasını ister; `GENERATED ALWAYS AS` kolon başka tablodan (tags) veri okuyamaz — Clarification 7'nin "GENERATED + TRIGGER" karışımından yalnızca trigger yolu teknik olarak mümkündür. `simple` config kullanılır (Türkçe içerikte stemming sürprizini önler).

## D8 — tags tablosu sahipliği: KULLANICIYA ÖZEL
- **Karar**: `tags` tablosuna `user_id` eklenir; `UNIQUE (user_id, name)`; RLS `auth.uid() = user_id`.
- **Gerekçe**: Spec Key Entities global `name UNIQUE` der, ama anayasa II ve Clarification 14 `tags` için `user_id = auth.uid()` RLS politikasını zorunlu kılar — user_id kolonu olmadan bu politika yazılamaz. Anayasa üstündür. Global unique isim, kullanıcılar arası veri sızıntısı da yaratırdı (etiket varlığı gözlemlenebilirdi).

## D9 — Keyset pagination imleci: (created_at, id) BİLEŞİK
- **Karar**: Dashboard yeni→eski sıralar; imleç `(created_at, id)` çifti, sorgu `WHERE (created_at, id) < (:c, :i) ORDER BY created_at DESC, id DESC LIMIT n`. Destekleyen bileşik B-Tree indeksi eklenir.
- **Gerekçe**: `id` uuid'dir; salt `id > last_id` sıralaması rastgele ve kullanıcı için anlamsızdır. Bileşik imleç aynı keyset tekniğidir (OFFSET yok, sabit maliyet) ve FR-010'un amacını (sabit yanıt süresi) korur; anayasadaki ifade teknik örnektir.

## D10 — Kimlik doğrulama: @supabase/ssr + httpOnly çerez + middleware
- **Karar**: Supabase Auth (email/password + magic link). `@supabase/ssr` ile çerez tabanlı oturum; `middleware.ts` korumalı yolları doğrular, oturumsuz istekleri `/login`'e yönlendirir (FR-008). localStorage kullanılmaz.
- **Gerekçe**: Anayasa II JWT'nin httpOnly/secure çerezde olmasını ve middleware doğrulamasını zorunlu kılar; `@supabase/ssr` bunun resmi yoludur.

## D11 — Env'siz çalışma (kritik dağıtım kısıtı)
- **Karar**: Supabase client'ları lazy/koşullu üretilir (`getSupabase...()` null dönebilir); modül üst düzeyinde env okuyup throw eden kod yasak. Env eksikse middleware pas geçer ve tüm ekranlar sade Türkçe "Veritabanı yapılandırması bekleniyor" durumu gösterir. `npx tsc --noEmit && npm run build` env'siz geçmek zorundadır.
- **Gerekçe**: İlk deploy'da env yok; build kırılamaz.

## D12 — Test altyapısı: VITEST (birim/smoke)
- **Karar**: `vitest` ile DB gerektirmeyen saf mantık testleri (URL doğrulama, etiket doğrulama, keyset imleç kodlama). `npm test` script'i eklenir ve doğrulama komutuna dahil edilir: `npm test && npx tsc --noEmit && npm run build`.
- **Gerekçe**: Anayasa III smoke/birim test + `npm test` kapısını zorunlu kılar. DB'ye bağımlı testler env yokluğunda koşulamaz (D11), bu yüzden kapsam saf mantıkla sınırlı tutulur.

## D13 — Realtime: postgres_changes, user_id filtreli
- **Karar**: Client component, env varsa `postgres_changes` kanalına `filter: user_id=eq.<uid>` ile abone olur; INSERT/UPDATE/DELETE olayında `router.refresh()` çağırır.
- **Gerekçe**: Anayasa II (Realtime izolasyonu) ve FR-004. `router.refresh()` server component verisini yeniden çeker — ayrı client-side veri katmanı gerekmez (YAGNI).

## D14 — Önizleme görselleri: SIGNED URL yardımcı, upload UI YOK
- **Karar**: `links.preview_path` kolonu (nullable) + sunucu tarafında `previews` private bucket'tan 300 sn geçerli `createSignedUrl` üreten yardımcı (FR-006). Dosya yükleme UI'ı yapılmaz; görsel yoksa tasarımdaki fallback ikon gösterilir.
- **Gerekçe**: Hiçbir user story / UI gereksinimi upload akışı tanımlamıyor (modal alanları: url, title, description, tags). FR-006 yalnızca "özel dosyalar için signed URL üretimi" ister; yardımcı bunu karşılar. YAGNI.

## D15 — Sürümler / araçlar
- **Karar**: Next.js 14 (App Router, FR-005 açıkça 14 der), React 18, TypeScript 5, Tailwind CSS 3 (tasarım referansı v3 config sözdizimi kullanıyor), `@supabase/supabase-js` v2 + `@supabase/ssr`. Migration'lar `supabase/migrations/*.sql` — SUPABASE_DB_URL olmadığından ÇALIŞTIRILMAZ, dosya olarak bırakılır.
- **Gerekçe**: Spec'e birebir uyum; deploy hedefi Coolify/nixpacks için standart `dev`/`build`/`start` script'leri.
