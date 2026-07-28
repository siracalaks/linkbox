# Research: Linke kişisel not alanı

Spec zaten netleştirilmiş (3 clarification sorusu cevaplanmış), bu yüzden
NEEDS CLARIFICATION kalmadı. Aşağıdaki kararlar mevcut kod tabanına göre
teyit edilmiştir.

## D1: Not kolonu nerede saklanır?

- **Decision**: `links.note TEXT NULL` — Prisma `Link` modeline `note String?`.
- **Rationale**: Spec Key Entities zaten bunu istiyor (nullable, max 200
  karakter). Ayrı tablo (`link_notes`) gereksiz normalizasyon olur (1:1
  ilişki, YAGNI).
- **Alternatives considered**: Ayrı tablo — reddedildi (gereksiz JOIN,
  spec 1:1 ilişki istiyor).

## D2: Uzunluk doğrulaması nerede yapılır?

- **Decision**: `lib/validation.ts` içinde `validateNote(raw: string)` —
  mevcut `validateTagName`/`validateUrl` desenini takip eder, trim sonrası
  200 karakter sınırı, Türkçe hata mesajı "Not 200 karakteri geçemez"
  (Edge Case ile birebir).
- **Rationale**: Mevcut validation modülü zaten server action'larda
  kullanılıyor; tutarlılık.
- **Alternatives considered**: DB CHECK constraint — ek güvenlik katmanı
  olarak migration'a da eklenir (defense in depth), ama tek başına yeterli
  değildir çünkü kullanıcıya anlık Türkçe hata mesajı UI tarafında
  gösterilmelidir (FR-003, Edge Case).

## D3: `updateLink` action'ı nasıl genişler?

- **Decision**: `UpdateLinkInput`e opsiyonel `note?: string | null` eklenir;
  boş string veya `undefined` → `null` (not silinmiş sayılır, Edge Case).
  Mevcut `title`/`description` alanlarıyla aynı `updateMany({where:{id,userId}})`
  çağrısında güncellenir — ek sorgu yok.
- **Rationale**: Mevcut fonksiyon zaten aynı satırı güncelliyor; ek bir
  action (`updateNote`) YAGNI, tek çağrıda tutarlı kaydetme (spec Edge
  Case: "son kaydedilen not veri bütünlüğünü korur" zaten `updateMany`nin
  atomikliğiyle sağlanıyor).
- **Alternatives considered**: Ayrı `updateNote(id, note)` server action —
  reddedildi; iki ayrı "Kaydet" aksiyonu UI karmaşıklığı yaratır ve spec
  UI-002'de tek panel + tek "Kaydet" butonu tarif ediliyor. Bu nedenle not
  paneli KENDİ "Kaydet" butonuna sahip olacak ve yalnız `note` alanını
  gönderen bir çağrı yapacak (bkz. contracts/server-actions.md) — ama aynı
  `updateLink` fonksiyonu üzerinden, mevcut title/description değerleri
  korunarak (formda mevcut state'ten okunur).

## D4: Not ikonu/tooltip nasıl gösterilir?

- **Decision**: `LinkCard` içinde, notu olan linklerde (`link.note` truthy)
  diğer aksiyon ikonlarıyla hizalı bir `sticky_note_2` (Material Symbols)
  ikonu; `title` HTML attribute + `aria-label` ile tooltip (native browser
  tooltip, ek kütüphane yok). Tooltip metni `link.note.slice(0, 50)`.
- **Rationale**: Mevcut ikon seti Material Symbols Outlined (`link-card.tsx`,
  `link-detail-form.tsx`); native `title` attribute basit, erişilebilir,
  ek bağımlılık gerektirmez (YAGNI — anayasa V).
- **Alternatives considered**: Özel tooltip komponenti (Radix/Floating UI)
  — reddedildi, gereksiz bağımlılık; native title yeterli (spec sadece
  "tooltip" diyor, özel etkileşim istemiyor).

## D5: Migration nasıl yazılır?

- **Decision**: `prisma/migrations/0002_link_note/migration.sql` elle
  yazılır: `ALTER TABLE "links" ADD COLUMN "note" TEXT;` + spec Edge Case
  200 karakter sınırını DB düzeyinde de güvence altına almak için
  `CHECK (char_length("note") <= 200)`. Mevcut `0001_init` migration'ı
  DEĞİŞTİRİLMEZ (talimat gereği).
- **Rationale**: Bu ortamda `prisma migrate dev` çalışmıyor (Postgres yok);
  0001_init ile aynı desen izlenir (bkz. o migration'ın başlığı).
- **Alternatives considered**: `prisma db push` — reddedildi, proje zaten
  elle migration deseni kullanıyor ve deploy `prisma migrate deploy`
  bekliyor.
