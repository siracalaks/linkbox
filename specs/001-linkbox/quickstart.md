# Quickstart: Linkbox (001-linkbox)

## Önkoşullar
- Node.js 20+, npm
- (Opsiyonel) Supabase projesi — env'ler OLMADAN da uygulama derlenir ve açılır (bekleme durumu gösterir)

## Kurulum ve doğrulama (env'siz — bu ortamın senaryosu)
```bash
npm install
npm test                 # Vitest birim/smoke testleri
npx tsc --noEmit         # Tip kontrolü
npm run build            # Prod build — env'siz GEÇMELİ
npm start                # http://localhost:3000 → "Veritabanı yapılandırması bekleniyor"
```
Beklenen: build hatasız; `/` ve `/login` açılır, Türkçe bekleme durumu görünür; hiçbir modül env yokluğunda throw etmez.

## Supabase bağlandıktan sonra (Coolify'da elle eklenecek env'ler)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```
1. `supabase/migrations/0001_init.sql` dosyasını Supabase SQL editöründe (veya `supabase db push` ile) uygula — bu repo ortamında ÇALIŞTIRILMAZ.
2. Uygulamayı yeniden başlat.

### Uçtan uca doğrulama senaryoları (contracts/server-actions.md ve spec US1–US4)
1. **Kayıt/giriş**: `/login` → e-posta+şifre ile kayıt ol, giriş yap → `/` dashboard açılır.
2. **Link kaydetme (US1)**: "Yeni Link Ekle" → url + etiketler → kart listede görünür. Aynı URL tekrar → "Bu link zaten kayıtlı".
3. **Filtre (US2)**: iki etiket chip'i seç → yalnızca HER iki etiketi taşıyan linkler listelenir (AND).
4. **Arama (US3)**: arama kutusuna kelime yaz (300 ms debounce) → başlık/açıklama/URL/etiket eşleşmeleri; eşleşme yoksa "Sonuç bulunamadı".
5. **Realtime (US4)**: iki tarayıcıda aynı hesap; birinde link ekle → diğerinde liste ~1-2 sn'de yenilenir.
6. **Detay**: karttan `/links/[id]` → başlık/açıklama/etiket düzenle → Kaydet; Kopyala butonu URL'yi panoya kopyalar; Sil listeden düşürür.
7. **Responsive**: 375 px (mobil: FAB + alt nav, tek kolon), 768 px (2 kolon), 1280 px (sidebar + 3-4 kolon) — üç kırılımda da yerleşim bozulmaz.

## Deploy (Coolify / nixpacks)
- Build: `npm run build` · Start: `npm start` (package.json standart script'leri)
- Vercel/Netlify'a özgü hiçbir yapılandırma yok.
