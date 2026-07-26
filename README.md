# Linkbox

Kişisel link kaydetme, etiketleme ve tam-metin arama uygulaması.
Next.js 14 (App Router) + Supabase (Auth, Postgres + RLS, Realtime) + Tailwind CSS.

Spec-Driven Development (spec-kit) ile geliştirilmiştir: `specs/001-linkbox/`
(spec → plan → tasks → implement). Tasarım referansı: `docs/STITCH-PROMPT.md`
ve `docs/design/` (Tech Indigo Modern).

## Özellikler

- Link kaydetme (URL + opsiyonel başlık/açıklama + etiketler), aynı URL'de mükerrer koruması
- Etiket chip'leriyle AND mantıklı filtreleme
- PostgreSQL `tsvector` + GIN ile tam-metin arama (başlık, açıklama, URL, etiket adları; 300 ms debounce)
- Supabase Realtime ile aynı hesabın diğer oturumlarında anlık liste tazeleme
- Keyset pagination (OFFSET yok, sabit maliyet)
- Tüm ekranlar mobil / tablet / masaüstü responsive

## Geliştirme

```bash
npm install
npm run dev       # http://localhost:3000
```

Doğrulama kapısı (her değişiklikte):

```bash
npm test && npx tsc --noEmit && npm run build
```

## Ortam değişkenleri

Uygulama bu değişkenler OLMADAN da derlenir ve açılır; bu durumda ekranda
"Veritabanı yapılandırması bekleniyor" görünür. Değişkenler eklendiğinde
uygulama yeniden başlatmayla çalışmaya başlar.

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase proje URL'si
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # anon (public) anahtar
SUPABASE_SERVICE_ROLE_KEY=       # yalnızca sunucu; signed URL üretimi için
```

Sırlar asla koda gömülmez; service-role anahtarı yalnızca sunucu tarafında
(`lib/supabase/admin.ts`, `server-only`) kullanılır.

## Veritabanı

Şema `supabase/migrations/0001_init.sql` dosyasındadır ve şunları içerir:
tablolar (`links`, `tags`, `link_tags`), `UNIQUE(user_id, url)`,
RLS politikaları (`auth.uid() = user_id`), `search_vector` trigger'ları,
GIN + keyset indeksleri, `previews` private storage bucket'ı.

Migration'ı uygulamak için Supabase SQL editöründe dosyayı çalıştırın veya:

```bash
supabase db push
```

Bu depo ortamında migration ÇALIŞTIRILMAZ (SUPABASE_DB_URL yok).

## Deploy (Coolify / nixpacks)

- Build: `npm run build` — Start: `npm start`
- Ortam değişkenleri Coolify panelinden elle eklenir.
- Vercel/Netlify'a özgü hiçbir yapılandırma kullanılmaz.

## Dizin yapısı

```
app/            # App Router sayfaları + server action'lar
components/     # UI bileşenleri (tasarım token'larıyla)
lib/            # Supabase client'ları (lazy), sorgular, doğrulama, imleç
supabase/       # SQL migration dosyaları
specs/          # Spec-kit artefaktları (spec, plan, tasks, ...)
tests/unit/     # Vitest birim testleri (DB'siz saf mantık)
```

Uçtan uca doğrulama senaryoları: `specs/001-linkbox/quickstart.md`.
