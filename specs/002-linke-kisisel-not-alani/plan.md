# Implementation Plan: Linke kişisel not alanı

**Branch**: `002-linke-kisisel-not-alani` | **Date**: 2026-07-27 | **Spec**: specs/002-linke-kisisel-not-alani/spec.md

**Input**: Feature specification from `/specs/002-linke-kisisel-not-alani/spec.md`

## Altyapı Notu

Bu özellik CANLI üründe uygulanır. Gerçek altyapı `specs/001-linkbox/plan.md`'nin
"Altyapı Değişimi" bölümünde tarif edildiği gibidir: Supabase DEĞİL, kendi
sunucu PostgreSQL + Prisma (`prisma/schema.prisma`, migration'lar elle
`prisma/migrations/` altına yazılır, `prisma migrate dev` bu ortamda
çalışmaz) ve Auth.js Credentials (JWT). Anayasa'daki RLS/Supabase maddeleri
bu altyapıda geçerli değildir; güvenlik izolasyonu uygulama katmanında
`userId` daraltmasıyla sağlanır (`lib/queries.ts`, `app/actions/links.ts`
zaten bu deseni kullanıyor — bkz. anayasa yorumu 001-linkbox/plan.md).

## Summary

Kullanıcı, link detay sayfasında (`/links/[id]`) açılır/çökebilen bir panel
üzerinden linke özel, maksimum 200 karakterlik kısa bir not ekleyip
düzenleyebilir. Not `Link.note` (nullable String) kolonunda saklanır. Notu
olan linkler, ana sayfadaki (`/`) kart listesinde bir not ikonuyla işaretlenir;
ikonun üzerine gelindiğinde notun ilk 50 karakteri tooltip olarak gösterilir.
Teknik yaklaşım: mevcut mimariye ekleme yapılır — Prisma şemasına nullable
`note` kolonu (yeni migration), `updateLink` server action'ına `note` alanı,
`LinkDetailForm`'a çökebilen not paneli, `LinkCard`'a not ikonu/tooltip.
Yeni tablo, yeni route veya yeni bağımlılık YOKTUR (YAGNI).

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 20+

**Primary Dependencies**: Next.js 14 (App Router), React 18, Tailwind CSS 3, Prisma 6, Auth.js (next-auth v5) — mevcut, değişmiyor

**Storage**: Kendi sunucu PostgreSQL. `links` tablosuna nullable `note TEXT` kolonu eklenir (yeni migration `prisma/migrations/0002_link_note/`); mevcut kolonlar/tablolar değişmez.

**Testing**: Vitest (birim). Doğrulama komutu: `npx tsc --noEmit && npm run build` (her görev sonunda zorunlu — anayasa I); mevcut `npm test` paketine not uzunluk doğrulaması için birim test eklenir.

**Target Platform**: Coolify (nixpacks) üzerinde Node.js sunucu; tarayıcılar (mobil/tablet/masaüstü)

**Project Type**: Web uygulaması (tek Next.js projesi, repo kökü) — mevcut yapıya ekleme

**Performance Goals**: Not güncelleme mevcut `updateLink` action'ının performans profilini korur (tek satır UPDATE); ek sorgu yok.

**Constraints**: Mevcut davranışları bozmama (çalışan ekranlar/API'ler aynen çalışmaya devam etmeli); mevcut tablo/kolon silme veya yeniden adlandırma YASAK; responsive (mobil/tablet/masaüstü) zorunlu; Türkçe UI; not sadece link sahibi tarafından görülüp düzenlenebilir (mevcut `userId` daraltması yeterli — FR-007).

**Scale/Scope**: Tek alan eklemesi: 1 şema kolonu, 1 server action güncellemesi, 2 bileşen güncellemesi (LinkDetailForm, LinkCard), 1 tip güncellemesi (LinkWithTags).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| İlke | Karşılama | Durum |
|------|-----------|-------|
| I. Authentication Discipline | Her görev sonunda `npx tsc --noEmit && npm run build` çalıştırılır | PASS |
| II. Security (uygulama katmanı yorumu) | `note` alanı yalnızca `getLink`/`updateLink` içinde mevcut `userId` daraltmasıyla okunur/yazılır; ek erişim kontrolü gerekmez (FR-007, spec Assumptions) | PASS |
| III. Realistic Testing | `lib/validation.ts`e not uzunluk doğrulaması (`validateNote`) eklenir + birim test | PASS |
| IV. Documentation & Responsiveness | Not paneli ve ikon mevcut tasarım token'larını (glass-effect, spacing, renk) kullanır; mobil/tablet/masaüstü responsive (UI-005) | PASS |
| V. Simplicity / YAGNI | Zengin metin, ayrı not tablosu, versiyon geçmişi YOK — tek nullable kolon + panel (spec Assumptions) | PASS |
| Ek: Uniqueness/Pagination/Cache | Etkilenmiyor — `note` kolonu bu kısıtlara dahil değil | PASS |

**Post-design re-check (Faz 1 sonrası)**: data-model.md ve contracts/ yukarıdaki satırlarla tutarlı; yeni ihlal yok. GATE: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/002-linke-kisisel-not-alani/
├── plan.md              # Bu dosya
├── research.md          # Faz 0 çıktısı
├── data-model.md        # Faz 1 çıktısı
├── contracts/
│   └── server-actions.md    # updateLink genişlemesi
├── quickstart.md        # Faz 1 çıktısı
└── tasks.md             # Faz 2 çıktısı (speckit-tasks)
```

### Source Code (repository root) — DEĞİŞECEK DOSYALAR

```text
prisma/
├── schema.prisma                        # Link modeline nullable `note` kolonu (EKLEME)
└── migrations/0002_link_note/migration.sql   # YENİ migration (ALTER TABLE ... ADD COLUMN)

lib/
├── types.ts            # LinkWithTags'e `note: string | null` (EKLEME)
├── queries.ts           # toLinkWithTags/LINK select note alanını taşır (EKLEME)
└── validation.ts        # validateNote (max 200 karakter) (EKLEME)

app/actions/links.ts      # UpdateLinkInput.note + updateLink note kaydeder (EKLEME)

components/
├── link-detail-form.tsx  # Çökebilen "Not Ekle/Düzenle" paneli (EKLEME)
└── link-card.tsx         # Not ikonu + tooltip (notu olan linklerde) (EKLEME)

tests/unit/
└── validation.test.ts    # validateNote testleri (EKLEME)
```

**Structure Decision**: Mevcut tek Next.js projesi yapısı korunur; yeni dosya/route/bağımlılık eklenmez, yalnız yukarıdaki dosyalara ekleme yapılır.

## Complexity Tracking

*Anayasa ihlali yok — bu bölüm boş bırakılmıştır.*
