# Quickstart: Linke kişisel not alanı

## Ön koşullar

- Mevcut Linkbox kurulumu (bkz. README.md); `DATABASE_URL` yapılandırılmış
  veya env'siz "Veritabanı yapılandırması bekleniyor" modu.
- Deploy öncesi: `prisma migrate deploy` yeni `0002_link_note` migration'ını
  uygular (mevcut `npm start` script'i zaten bunu çalıştırıyor).

## Doğrulama Senaryoları (spec Acceptance Scenarios ile birebir)

1. **Not ekleme** (US1-1): Oturum aç → bir linkin detay sayfasına git
   (`/links/[id]`) → "Not Ekle" panelini aç → 200 karakterden az metin gir
   → "Kaydet" → panel kapanmadan/sayfa yenilenince not kalıcı olmalı; ana
   sayfada (`/`) o linkin kartında not ikonu görünmeli.
2. **Not düzenleme** (US1-2): Notu olan bir linkin detayına git → panel
   otomatik notu göstersin (US2-2) → metni değiştir → "Kaydet" → değişiklik
   anında yansımalı (mevcut `router.refresh()` deseni).
3. **200 karakter sınırı** (Edge Case): 201 karakter gir → "Kaydet" →
   "Not 200 karakteri geçemez" hatası, kayıt değişmemeli.
4. **Not silme** (Edge Case): Mevcut notu tamamen sil (boş bırak) →
   "Kaydet" → not `NULL` olur, ana sayfada ikon kaybolur.
5. **Tooltip önizleme** (US2-1, FR-006): Ana sayfada not ikonlu bir karta
   git, ikonun üzerine gel → ilk 50 karakter tooltip olarak görünmeli.
6. **Sahiplik** (FR-007): Farklı bir kullanıcı olarak aynı link id'sine
   `/links/[id]` ile erişmeye çalış → mevcut `getLink(userId, id)`
   daraltması nedeniyle 404 (mevcut davranış, DEĞİŞMEDİ).

## Regresyon Kontrolü (KURAL: mevcut davranış bozulmamalı)

- Not eklemeden önce var olan link CRUD akışları (`createLink`,
  `deleteLink`, etiket senkronu, arama, filtre, sayfalama, realtime
  yenileme) aynen çalışmalı — bu özellik yalnız `updateLink`e ekleme yapar.
- `npx tsc --noEmit && npm run build` temiz geçmeli (anayasa I).
- `npm test` mevcut testler + yeni `validateNote` testleri dahil geçmeli.
- Responsive kontrol: 375px (mobil), 768px (tablet), 1280px (masaüstü)
  genişliklerinde not paneli ve kart ikonu düzgün yerleşmeli (UI-005).
