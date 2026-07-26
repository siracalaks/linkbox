# Tasks: Linkbox

**Input**: Design documents from `/specs/001-linkbox/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Anayasa III (Realistic Testing) smoke/birim testleri zorunlu kılar → Vitest birim test görevleri DAHİLDİR (DB'siz saf mantık; research D12).

**Organization**: Görevler user story bazlı fazlanmıştır. Her görevin çıkış kapısı: `npm test && npx tsc --noEmit && npm run build` (anayasa I + III). Her faz sonunda `git add -A && git commit` (Türkçe mesaj).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Next.js 14 projesi, tasarım token'ları ve test altyapısı

- [X] T001 Next.js 14 + TypeScript projesini repo kökünde elle kur: `package.json` (dev/build/start/test script'leri, next@14, react@18, typescript@5, tailwindcss@3, @supabase/supabase-js, @supabase/ssr, vitest), `tsconfig.json` (strict), `next.config.mjs`, `.gitignore` güncelle, `postcss.config.mjs`
- [X] T002 [P] Tasarım sistemini kur: `tailwind.config.ts` (docs/design/screen-1.html + screen-2.html'deki renk/spacing/radius/fontFamily/fontSize token'ları, darkMode class, breakpoint'ler), `app/globals.css` (Outfit+Inter font yüzleri next/font ile layout'ta; .glass-effect, .indigo-gradient-btn, .card-glow yardımcı sınıfları)
- [X] T003 [P] Vitest kur: `vitest.config.ts`, `npm test` script'i (`vitest run`), örnek boş test `tests/unit/smoke.test.ts`

**Checkpoint**: `npm test && npx tsc --noEmit && npm run build` env'siz geçer → commit "kurulum: Next.js 14 iskeleti, tasarım token'ları, vitest"

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Şema, lazy Supabase client'ları, auth altyapısı, ortak UI kabuğu — tüm story'ler buna bağlı

- [X] T004 [P] `supabase/migrations/0001_init.sql` yaz (data-model.md'ye birebir): links/tags/link_tags tabloları, UNIQUE(user_id,url), UNIQUE(user_id,name), keyset ve GIN indeksleri, (tag_id,link_id) indeksi, search_vector trigger fonksiyonları (title+description+url+etiket adları, 'simple' config), RLS ENABLE+politikalar (auth.uid()=user_id, WITH CHECK), updated_at trigger'ı, `previews` private bucket insert'i. ÇALIŞTIRMA — sadece dosya
- [X] T005 [P] Lazy Supabase katmanı: `lib/env.ts` (`isSupabaseConfigured()`), `lib/supabase/server.ts` (cookie tabanlı server client, env yoksa null), `lib/supabase/client.ts` (browser client, env yoksa null), `lib/supabase/admin.ts` (service-role, `server-only` import, env yoksa null). Hiçbir modül üst düzeyde throw etmez (research D11)
- [X] T006 `middleware.ts`: env yoksa pas geç; env varsa @supabase/ssr ile oturumu tazele, oturumsuz istekleri `/login`'e yönlendir (`/login`, `/auth` hariç) (FR-008, anayasa II)
- [X] T007 [P] Saf mantık + birim testleri: `lib/validation.ts` (validateUrl → "Geçersiz URL", validateTagName 1–50 → "Etiket uzunluğu geçersiz", normalizeTags), `lib/cursor.ts` (encodeCursor/decodeCursor base64url {c,i}); `tests/unit/validation.test.ts`, `tests/unit/cursor.test.ts` (Edge Cases senaryoları)
- [X] T008 Uygulama kabuğu + auth ekranı: `app/layout.tsx` (next/font Outfit+Inter, koyu tema, lang=tr), `components/db-pending.tsx` ("Veritabanı yapılandırması bekleniyor"), `app/login/page.tsx` (email/şifre giriş + kayıt + magic link; glass panel; responsive; env yoksa db-pending), `app/actions/auth.ts` (signIn/signUp/signInWithOtp/signOut server action'ları), `app/auth/callback/route.ts` (exchangeCodeForSession)
- [X] T009 Ortak gezinme bileşenleri (screen-1.html referans): `components/header.tsx` (sticky, logo, masaüstü nav, Yeni Link Ekle butonu, avatar dropdown: email + Çıkış Yap; aria-label'lar), `components/sidebar.tsx` (masaüstü 280px sol nav), `components/mobile-nav.tsx` (alt nav + FAB "+"; md üstünde gizli)

**Checkpoint**: Env'siz build geçer, `/login` render olur → commit "temel: şema migration'ı, lazy supabase katmanı, auth ve kabuk"

---

## Phase 3: User Story 1 - Link Kaydetme (Priority: P1) 🎯 MVP

**Goal**: Kullanıcı URL + opsiyonel başlık/açıklama + etiketlerle link kaydeder; mükerrer URL reddedilir; liste kart görünümünde keyset sayfalamayla görünür; detay sayfasından düzenler/siler.

**Independent Test**: quickstart.md senaryo 2 ve 6 — link ekle → kartta görünür; aynı URL → "Bu link zaten kayıtlı"; detayda düzenle/sil çalışır. Env'siz: dashboard db-pending gösterir, build geçer.

- [X] T010 [US1] Okuma katmanı: `lib/queries.ts` — `listLinks({q?, tagIds?, cursor?})` (keyset (created_at,id) DESC, LIMIT 12+1, toplam sayı, etiketleri gömülü), `getLink(id)`, `listTags()`; tipler `lib/types.ts` (LinkWithTags, Tag). Env/oturum yoksa güvenli boş dönüş
- [X] T011 [US1] Mutasyonlar: `app/actions/links.ts` — `createLink` (validation, tag upsert + link_tags bağlama, 23505 → "Bu link zaten kayıtlı"), `updateLink` (başlık/açıklama + etiket senkronu), `deleteLink`; hepsi ActionResult döner, başarıda revalidatePath (contracts/server-actions.md)
- [X] T012 [P] [US1] Kart ve modal bileşenleri (screen-1.html birebir): `components/link-card.tsx` (fallback ikonlu görsel alanı, başlık → yeni sekme, kısa URL, etiket chip'leri, tarih, hover Düzenle/Sil, karttan `/links/[id]`), `components/link-form-modal.tsx` (URL/Başlık/Açıklama/Etiket girişi datalist autocomplete; mobilde alttan, masaüstünde ortalı; role=dialog, ESC, aria-modal; hata mesajları Türkçe)
- [X] T013 [US1] Dashboard: `app/page.tsx` — header+sidebar+mobile-nav yerleşimi, kart grid'i (1/2/3-4 kolon: grid-cols-1 sm:2 lg:3 xl:4), `components/pagination.tsx` (Önceki=history.back, Sonraki=?cursor, "Toplam N link"), boş durum CTA'sı, env yoksa db-pending; searchParams'tan q/tags/cursor okur
- [X] T014 [US1] Link detayı: `app/links/[id]/page.tsx` (screen-2.html birebir: breadcrumb, lg'de iki kolon, önizleme/fallback, başlık, açıklama textarea, kopyalanabilir URL alanı, etiket chip'leri + ekleme girişi, Kaydet/Aç/Sil, "Son güncelleme" footer'ı) + `components/link-detail-form.tsx` (client; updateLink/deleteLink bağlar, Kopyala geri bildirimi, silmede onay); bulunamayana `app/links/[id]/not-found` davranışı

**Checkpoint**: US1 uçtan uca kod tamam (env'siz derlenir) → commit "us1: link kaydetme, listeleme, detay ve CRUD"

---

## Phase 4: User Story 2 - Etiketleme ve Filtreleme (Priority: P1)

**Goal**: Etiket chip barından çoklu seçim; AND mantığıyla filtre; chip kaldırma.

**Independent Test**: quickstart.md senaryo 3 — iki etiket seç → yalnızca ikisini de taşıyan linkler; chip kaldırınca filtre gevşer.

- [X] T015 [US2] `lib/queries.ts` listLinks'e AND etiket filtresi: seçili her tagId için eşleşme (link_tags üzerinden; tümünü taşıyan link id kümesi) + `tests/unit/` filtre yardımcı fonksiyonu testi (id kümesi kesişimi saf fonksiyonsa)
- [X] T016 [US2] `components/tag-filter.tsx`: kullanıcı etiketleri chip barı, `#tümü` + toggle (aria-pressed), seçililer `?tags=id1,id2` URL state; `app/page.tsx`'e entegre; responsive sarma (UI-003)

**Checkpoint**: commit "us2: AND mantıklı etiket filtreleme"

---

## Phase 5: User Story 3 - Tam Metin Arama (Priority: P2)

**Goal**: 300 ms debounce ile başlık/açıklama/URL/etiket araması; boş sonuçta "Sonuç bulunamadı".

**Independent Test**: quickstart.md senaryo 4 — kelime yaz → eşleşen kartlar; anlamsız kelime → "Sonuç bulunamadı".

- [X] T017 [US3] `lib/queries.ts` listLinks'e arama: `search_vector @@ websearch_to_tsquery('simple', q)` (`textSearch`), keyset ile birlikte çalışır
- [X] T018 [US3] `components/search-bar.tsx`: placeholder "Tam metin ara...", 300 ms debounce ile `?q=` günceller (router.replace), aria-label; `app/page.tsx` boş sonuçta "Sonuç bulunamadı" gösterir (US3-2)

**Checkpoint**: commit "us3: debounce'lu tam metin arama"

---

## Phase 6: User Story 4 - Gerçek-Zaman Güncellemeler (Priority: P2)

**Goal**: Aynı hesabın diğer oturumlarında liste 1-2 sn içinde tazelenir.

**Independent Test**: quickstart.md senaryo 5 — iki tarayıcı, birinde ekle → diğerinde liste yenilenir (env gerektirir; env'siz sadece derleme doğrulanır).

- [X] T019 [US4] `components/realtime-refresher.tsx`: client component; env+oturum varsa `postgres_changes` (links, `filter: user_id=eq.<uid>`) aboneliği → `router.refresh()`; unmount'ta unsubscribe; `app/page.tsx` ve `app/links/[id]/page.tsx`'e ekle (FR-004, anayasa II realtime izolasyonu)

**Checkpoint**: commit "us4: user_id filtreli realtime tazeleme"

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T020 [P] FR-006: `lib/storage.ts` — `getPreviewUrl(path)` `previews` bucket'tan 300 sn `createSignedUrl`; `app/links/[id]/page.tsx` ve link-card preview_path varsa kullanır, yoksa fallback ikon (upload UI YOK — research D14)
- [ ] T021 [P] Erişilebilirlik ve responsive geçişi (UI-006/UI-007): tüm interaktif öğelerde aria-label/role, modal odak tuzağı, klavye navigasyonu; 375/768/1280 px yerleşim kontrolü; `Cache-Control: private` başlığı gereken yerde (research D5)
- [ ] T022 [P] Dokümantasyon: `README.md` (kurulum, env listesi, migration talimatı, Coolify notu, quickstart özeti); public API fonksiyonlarına JSDoc (anayasa IV)
- [ ] T023 Son doğrulama: `npm test && npx tsc --noEmit && npm run build` temiz; quickstart.md env'siz adımları birebir uygulanabilir; spec FR/UI gereksinimlerine karşı son tarama

**Checkpoint**: commit "cila: signed url yardımcısı, erişilebilirlik, dokümantasyon"

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → Phase 3 (US1)**: sıkı sıra; US1 tüm story'lerin veri/UI temelini kurar
- **Phase 4 (US2), 5 (US3), 6 (US4)**: hepsi US1'in dashboard'una eklenir; kendi içlerinde bağımsız test edilebilir; sıralı uygulanacak (tek geliştirici)
- **Phase 7**: tüm story'ler sonrası
- [P] işaretli görevler farklı dosyalara dokunur; tek ajanla yine sıralı koşulur

## Parallel Example: Phase 2

```text
T004 (migration SQL) ‖ T005 (supabase katmanı) ‖ T007 (validation+cursor+testler) — farklı dosyalar
```

## Implementation Strategy

MVP = Phase 1–3 (US1). Ardından artımlı: US2 → US3 → US4 → Polish. Her faz sonunda doğrulama kapısı + Türkçe commit. Env yokluğu hiçbir fazda build'i kırmaz (research D11).
