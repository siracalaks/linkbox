# Tasks: Linke kişisel not alanı

**Input**: Design documents from `/specs/002-linke-kisisel-not-alani/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: Anayasa III (Realistic Testing) uyarınca `validateNote` için birim test DAHİLDİR.

**Organization**: Görevler user story bazlı fazlanmıştır. Her görevin çıkış kapısı: `npx tsc --noEmit && npm run build` (anayasa I). ÇALIŞAN davranış bozulmamalı — mevcut tablo/kolon SİLİNMEZ/YENİDEN ADLANDIRILMAZ, migration'lar sadece EKLEME yapar (0001_init değişmez). Her faz sonunda `git add -A && git commit` (Türkçe mesaj).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Şema, doğrulama ve tip katmanı — her iki user story de buna bağlı

- [ ] T001 `prisma/schema.prisma`: `Link` modeline `note String?` alanı ekle (mevcut alanların ALTINA, sırasını bozmadan)
- [ ] T002 [P] `prisma/migrations/0002_link_note/migration.sql` YENİ dosyasını elle yaz: `ALTER TABLE "links" ADD COLUMN "note" TEXT;` + `CHECK (char_length("note") <= 200)` kısıtı (data-model.md). `0001_init` dosyasına DOKUNMA
- [ ] T003 [P] `lib/validation.ts`: `NOTE_MAX_LENGTH = 200` ve `validateNote(raw: string): Validation<string | null>` ekle — trim sonrası boşsa `{ ok: true, value: null }`, 200 karakteri aşarsa `{ ok: false, error: "Not 200 karakteri geçemez" }` (research.md D2, Edge Case)
- [ ] T004 [P] `tests/unit/validation.test.ts`: `validateNote` için testler (boş → null, 200 karakter → geçer, 201 karakter → hata mesajı)
- [ ] T005 [P] `lib/types.ts`: `LinkWithTags` arayüzüne `note: string | null` ekle
- [ ] T006 `lib/queries.ts`: `toLinkWithTags` fonksiyonuna `note: row.note` satırı ekle (T001, T005'e bağlı)

**Checkpoint**: `npx tsc --noEmit && npm run build` geçer (DB'siz; migration henüz uygulanmadı ama şema/tip/derleme tutarlı) → commit "temel: link note kolonu, migration, doğrulama ve tipler"

---

## Phase 2: User Story 1 - Kişisel Not Ekleme (Priority: P2)

**Goal**: Kullanıcı link detay sayfasında not ekleyip düzenleyebilir; 200 karakter sınırı ve boş bırakınca silme davranışı çalışır.

**Independent Test**: quickstart.md senaryo 1–4 — not ekle/düzenle/sınır aşımı/silme.

- [ ] T007 [US1] `app/actions/links.ts`: `UpdateLinkInput`e `note?: string | null` ekle; `updateLink` içinde `validateNote` çağır (hata varsa erken dönüş, HİÇBİR alan güncellenmeyecek şekilde mevcut early-return desenine uy), `db.link.updateMany` çağrısına `note: noteCheck.value, updatedAt: new Date()` ekle (contracts/server-actions.md D3 — search_vector trigger'ı sadece title/description/url'de tetiklendiği için `updated_at`i elle güncelle)
- [ ] T008 [US1] `components/link-detail-form.tsx`: mevcut açıklama alanının ALTINA çökebilen "Not Ekle/Düzenle" paneli ekle — `useState` ile not metni ve panel açık/kapalı durumu, 200 karakter `maxLength` textarea + kalan karakter sayacı, panel kendi başlığına tıklanınca aç/kapa (chevron ikonu), `handleSave` çağrısına `note` değerini ekle (UI-001, UI-002)

**Checkpoint**: `npx tsc --noEmit && npm run build` geçer → commit "us1: link detayında not ekleme/düzenleme paneli"

---

## Phase 3: User Story 2 - Not Görüntüleme (Priority: P2)

**Goal**: Notu olan linkler listede ikonla ayırt edilir, ikon üzerine gelince 50 karakterlik önizleme görünür; detay sayfasında notu olan linkin paneli otomatik açık başlar.

**Independent Test**: quickstart.md senaryo 2, 5 — liste ikonu + tooltip, detayda otomatik açılan panel.

- [ ] T009 [US2] `components/link-card.tsx`: `link.note` doluysa, mevcut aksiyon ikonlarıyla hizalı `sticky_note_2` (Material Symbols) ikonu ekle; `title`/`aria-label` attribute'una `link.note.slice(0, 50)` koy (native tooltip, FR-005/FR-006, UI-003/UI-004)
- [ ] T010 [US2] `components/link-detail-form.tsx`: not paneli başlangıç açık/kapalı durumunu `Boolean(link.note)` ile başlat (not varsa panel otomatik genişlemiş gelir — US2 Acceptance Scenario 2)

**Checkpoint**: `npx tsc --noEmit && npm run build` geçer → commit "us2: link listesinde not ikonu, tooltip ve otomatik açılan panel"

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T011 [P] Responsive kontrol (UI-005): not paneli ve kart ikonu 375px/768px/1280px genişliklerde düzgün yerleşiyor mu doğrula; gerekirse Tailwind sınıflarını (`flex-wrap`, `gap-*`) ayarla
- [ ] T012 Son doğrulama: `npm test && npx tsc --noEmit && npm run build` temiz; quickstart.md senaryolarının tümü kod üzerinden izlenebilir; mevcut US1–US4 (001-linkbox) davranışlarının DEĞİŞMEDİĞİni doğrulamak için `app/page.tsx`, `app/actions/links.ts` diff'ini gözden geçir (regresyon kontrolü)

**Checkpoint**: commit "cila: responsive doğrulama ve son kontrol"

---

## Dependencies & Execution Order

- **Phase 1 (Foundational) → Phase 2 (US1) → Phase 3 (US2)**: sıkı sıra; US2'nin ikon/tooltip'i `note` alanının var olmasına bağlı, otomatik-açık panel davranışı US1'in panel bileşenine eklenir
- **Phase 4**: tüm story'ler sonrası
- [P] işaretli görevler farklı dosyalara dokunur; tek ajanla yine sıralı koşulur

## Parallel Example: Phase 1

```text
T002 (migration SQL) ‖ T003 (validateNote) ‖ T004 (birim test) ‖ T005 (tip) — farklı dosyalar
```

## Implementation Strategy

MVP = Phase 1–2 (US1: not ekleme/düzenleme). Ardından US2 (görüntüleme/ikon) eklenir. Her faz sonunda doğrulama kapısı (`npx tsc --noEmit && npm run build`) + Türkçe commit. Mevcut hiçbir ekran/API/veri davranışı bozulmaz (yalnızca ekleme).
