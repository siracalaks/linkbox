# Linkbox

Kişisel link kaydetme, etiketleme ve tam-metin arama uygulaması.
Next.js 14 (App Router) + kendi sunucuda PostgreSQL (Prisma) + Auth.js
(Credentials, JWT) + Tailwind CSS.

Spec-Driven Development (spec-kit) ile geliştirilmiştir: `specs/001-linkbox/`
(spec → plan → tasks → implement). Tasarım referansı: `docs/STITCH-PROMPT.md`
ve `docs/design/` (Tech Indigo Modern).

## Özellikler

- Link kaydetme (URL + opsiyonel başlık/açıklama + etiketler), aynı URL'de mükerrer koruması
- Etiket chip'leriyle AND mantıklı filtreleme
- PostgreSQL `tsvector` + GIN ile tam-metin arama (başlık, açıklama, URL, etiket adları; 300 ms debounce)
- Aynı hesabın diğer oturumlarında periyodik liste tazeleme (~15 sn)
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
DATABASE_URL=    # postgresql://kullanici:sifre@host:5432/veritabani
AUTH_SECRET=     # Auth.js JWT imza sırrı (openssl rand -base64 32)
```

Sırlar asla koda gömülmez. `AUTH_SECRET` yoksa dev fallback ile açılır;
prod'da mutlaka env olarak verilmelidir.

## Veritabanı

Şema `prisma/schema.prisma` + `prisma/migrations/0001_init/migration.sql`
dosyalarındadır: tablolar (`users`, `links`, `tags`, `link_tags`),
`UNIQUE(user_id, url)`, `UNIQUE(user_id, name)`, `search_vector` tsvector
trigger'ları, GIN + keyset indeksleri. Kullanıcı izolasyonu uygulama
katmanında `userId` filtresiyle sağlanır.

Migration ELLE yazılmıştır (bu ortamda Postgres yok; `prisma migrate dev`
çalıştırılmaz). Deploy'da `npm start` içindeki `prisma migrate deploy`
tabloları otomatik kurar. Sağlık kontrolü: `GET /api/health` →
`{ok: true, db: "connected" | "waiting"}`.

## Deploy (Coolify / nixpacks)

- Build: `npm run build` (prisma generate + next build)
- Start: `npm start` (`prisma migrate deploy && next start`)
- Ortam değişkenleri (`DATABASE_URL`, `AUTH_SECRET`) Coolify panelinden elle eklenir.
- Vercel/Netlify'a özgü hiçbir yapılandırma kullanılmaz.

## Dizin yapısı

```
app/            # App Router sayfaları + server action'lar + api (auth, health)
components/     # UI bileşenleri (tasarım token'larıyla)
lib/            # Prisma client (lazy), sorgular, doğrulama, imleç
prisma/         # schema.prisma + elle yazılmış migration'lar
auth.ts         # Auth.js (Credentials + JWT); auth.config.ts edge-uyumlu çekirdek
specs/          # Spec-kit artefaktları (spec, plan, tasks, ...)
tests/unit/     # Vitest birim testleri (DB'siz saf mantık)
```

Uçtan uca doğrulama senaryoları: `specs/001-linkbox/quickstart.md`.
