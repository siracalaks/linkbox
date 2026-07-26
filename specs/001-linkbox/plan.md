# Implementation Plan: Linkbox

**Branch**: `001-linkbox` | **Date**: 2026-07-26 | **Spec**: specs/001-linkbox/spec.md

**Input**: Feature specification from `/specs/001-linkbox/spec.md`

## Summary

Kişisel link kaydetme/etiketleme uygulaması: kullanıcı link kaydeder (URL + opsiyonel başlık/açıklama + etiketler), etikete göre filtreler (AND mantığı), tam-metin arama yapar ve realtime güncellemeler alır. Teknik yaklaşım: Next.js 14 App Router + Supabase (Auth, Postgres+RLS, Realtime). Mutasyonlar server action, okuma server component; arama Postgres `tsvector` + GIN; sayfalama keyset. Supabase env değişkenleri OLMADAN da uygulama derlenir ve "Veritabanı yapılandırması bekleniyor" durumu gösterir (ilk deploy kısıtı). Deploy hedefi Coolify (nixpacks, `npm run build` + `npm start`).

Spec Clarifications içindeki çelişen maddelerin kararları ve gerekçeleri: `research.md` (D1–D15). Özet: pgcrypto şifreleme, Vercel cron, pg_cron retention, audit log ve lru-cache REDDEDİLDİ (ana senaryoyu bozuyor veya YAGNI/anayasa ihlali); server actions, trigger tabanlı search_vector, kullanıcıya özel tags, (created_at,id) keyset imleci KABUL EDİLDİ.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 20+

**Primary Dependencies**: Next.js 14 (App Router), React 18, Tailwind CSS 3, @supabase/supabase-js v2, @supabase/ssr

**Storage**: Supabase Postgres (tablolar: links, tags, link_tags; RLS zorunlu). Şema `supabase/migrations/*.sql` dosyaları olarak teslim edilir; bu makinede SUPABASE_DB_URL olmadığından migration'lar ÇALIŞTIRILMAZ. Önizleme görselleri için `previews` private bucket (yalnızca signed-URL yardımcı; upload UI yok — research D14).

**Testing**: Vitest (birim/smoke, DB'siz saf mantık). Doğrulama komutu: `npm test && npx tsc --noEmit && npm run build`

**Target Platform**: Coolify (nixpacks) üzerinde Node.js sunucu; tarayıcılar (mobil/tablet/masaüstü)

**Project Type**: Web uygulaması (tek Next.js projesi, repo kökü)

**Performance Goals**: Arama < 150 ms (SC-001, GIN indeksi), realtime yansıma < 2 s (SC-002), sayfalama < 300 ms @ 50k link (SC-003, keyset)

**Constraints**: Env'siz derlenebilirlik (research D11); service-role anahtarı yalnızca sunucu; httpOnly çerez oturumu; responsive breakpoint'ler 640 px / 1024 px; Türkçe UI

**Scale/Scope**: MVP: 3 ekran (dashboard, link detayı, giriş) + link CRUD + etiket filtre + arama + realtime. Kullanıcı başına ~50k link hedefiyle sorgu tasarımı.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| İlke | Karşılama | Durum |
|------|-----------|-------|
| I. Authentication Discipline (`npx tsc --noEmit && npm run build` her görevde) | tasks.md her görevin çıkış kriteri yapar; test eklendiği için `npm test` de öne eklenir | PASS |
| II. Security — RLS | Tüm tablolarda `auth.uid() = user_id` USING + WITH CHECK politikaları (link_tags link sahipliği üzerinden) — migration 0001 | PASS |
| II. Security — Service-role gizliliği | Service-role anahtarı yalnızca `lib/supabase/admin.ts` (server-only); istemci bundle'ına girmez | PASS |
| II. Security — JWT/çerez | @supabase/ssr çerez oturumu (httpOnly), middleware doğrulaması, localStorage yok | PASS |
| II. Security — Realtime izolasyonu | Kanal aboneliği `filter: user_id=eq.<uid>` | PASS |
| II. Security — Depolama | `createSignedUrl` 300 sn, private bucket | PASS |
| III. Realistic Testing | Vitest birim/smoke testleri + `npm test` kapısı | PASS |
| IV. Documentation & Responsiveness | STITCH token'ları Tailwind config'e aktarılır; 640/1024 breakpoint'ler; JSDoc + README | PASS |
| V. Simplicity / YAGNI | pgcrypto, cron, audit, lru-cache, upload UI kapsam dışı (research D1–D5, D14) | PASS |
| Ek: tsvector+GIN, keyset, UNIQUE(user_id,url) | Migration 0001'de | PASS |
| Ek: Cache (public/ISR) | UYGULANMADI — Security core principle ile çelişir; bkz. Complexity Tracking | JUSTIFIED |

**Post-design re-check (Faz 1 sonrası)**: data-model.md ve contracts/ yukarıdaki satırlarla tutarlı; yeni ihlal yok. GATE: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/001-linkbox/
├── plan.md              # Bu dosya
├── research.md          # Faz 0 çıktısı (D1–D15 kararları)
├── data-model.md        # Faz 1 çıktısı
├── quickstart.md        # Faz 1 çıktısı
├── contracts/
│   ├── server-actions.md    # Mutasyon sözleşmeleri
│   └── ui-contracts.md      # Ekran/komponent sözleşmeleri
└── tasks.md             # Faz 2 çıktısı (speckit-tasks)
```

### Source Code (repository root)

```text
app/
├── layout.tsx               # Kök layout: Outfit+Inter fontları, koyu tema
├── globals.css              # Tailwind + tasarım token yardımcı sınıfları
├── page.tsx                 # Dashboard (Ekran 1: liste, arama, filtre, sayfalama)
├── login/page.tsx           # Giriş (email/password + magic link)
├── auth/callback/route.ts   # Magic link kod değişimi
├── links/[id]/page.tsx      # Link detayı (Ekran 2)
└── actions/links.ts         # Server actions (create/update/delete, revalidate)

components/
├── header.tsx               # Üst bar: logo, nav, avatar dropdown, Yeni Link Ekle
├── sidebar.tsx              # Masaüstü sol nav (tasarım referansı)
├── mobile-nav.tsx           # Mobil alt nav + FAB
├── search-bar.tsx           # Debounce 300 ms arama girişi (UI-004)
├── tag-filter.tsx           # Etiket chip'leri, AND filtre (UI-003)
├── link-card.tsx            # Kart: başlık, url, etiketler, tarih, sil/düzenle (UI-001)
├── link-form-modal.tsx      # Yeni link modalı (UI-002)
├── pagination.tsx           # Önceki/Sonraki + toplam (keyset)
├── realtime-refresher.tsx   # user_id filtreli realtime aboneliği (FR-004)
└── db-pending.tsx           # "Veritabanı yapılandırması bekleniyor" durumu

lib/
├── supabase/server.ts       # Lazy server client (env yoksa null)
├── supabase/client.ts       # Lazy browser client (env yoksa null)
├── supabase/admin.ts        # Service-role client (yalnızca sunucu, lazy)
├── supabase/middleware.ts   # Oturum tazeleme yardımcıları
├── env.ts                   # Env varlık kontrolü (isSupabaseConfigured)
├── validation.ts            # URL/etiket doğrulama (Edge Cases)
├── cursor.ts                # Keyset imleç encode/decode (created_at,id)
└── queries.ts               # Liste/arama/filtre sorguları (keyset, AND etiket)

middleware.ts                # Auth gateway (FR-008); env yoksa pas geçer
supabase/migrations/
└── 0001_init.sql            # Tablolar, indeksler, RLS, tsvector trigger'ları, bucket

tests/unit/
├── validation.test.ts
└── cursor.test.ts
```

**Structure Decision**: Tek Next.js projesi repo kökünde (Option 1/2 ayrımı gereksiz; backend = server actions + Supabase). Nixpacks kökteki package.json'ı algılar.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| FR-007 / anayasa "Cache" maddesi (ISR + `Cache-Control: public`) uygulanmadı | Tüm veri RLS ile kullanıcıya özel; public cache paylaşımlı katmanlarda başka kullanıcıya veri sızdırır. Anayasa II (Security) Core Principle olarak Additional Constraint'ten üstündür; Governance "çelişen prosedürler geçersizdir" der | Kullanıcı bazlı public cache anahtarlama (ör. Vary/çerez bazlı CDN) hem Vercel-dışı hedefte güvenilmez hem YAGNI; global (kullanıcı-bağımsız) popüler içerik MVP'de yok |
| Spec Key Entities `tags.name` global UNIQUE yerine `UNIQUE(user_id, name)` | Anayasa II ve Clarification 14, `tags` için `auth.uid() = user_id` RLS ister; user_id kolonu olmadan politika yazılamaz, global unique isim kullanıcılar arası bilgi sızıntısıdır | Global tags + RLS'siz okuma anayasa ihlali |
| Keyset imleci `id > last_id` yerine `(created_at,id)` bileşik | `id` uuid — salt id sıralaması kullanıcı için rastgele; dashboard yeni→eski göstermeli | Salt `id` sıralaması UI-001'in tarih odaklı listesiyle çelişir; teknik olarak aynı keyset maliyeti |
