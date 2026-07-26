# Linkbox Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### I. Authentication Discipline
Her görev sonunda `npx tsc --noEmit && npm run build` komutu başarıyla geçmelidir. Bu, tip güvenliği ve derleme bütünlüğünün korunmasını zorunlu kılar.

### II. Security First
Supabase Auth + JWT ile sunucu‑tarafı oturum doğrulaması yapılır, tüm tablo erişimleri Row‑Level Security (RLS) politikalarıyla sınırlandırılır. Service key gibi gizli anahtarlar hiçbir zaman istemci kodunda bulunmaz; ortam değişkenleri Edge Functions’da güvenli şekilde yönetilir.

### III. Test‑First (NON‑NEGOTIABLE)
Tüm yeni özellikler önce birim ve entegrasyon testleriyle tanımlanır. Testler kırmızı (fail) durumda olmalı, ardından kod geliştirilerek yeşile (pass) dönüştürülür. Test kapsamı %100 unit, %80 integration hedeflenir.

### IV. Documentation & Design System Alignment
Her bileşen, API ve veri modeli `STITCH-PROMPT.md` tasarım sistemine uygun olarak dokümante edilir. Kod yorumları, tip tanımları ve README dosyaları tutarlı bir biçimde tutulur.

### V. Simplicity & YAGNI
Gereksiz karmaşıklık eklenmez. Özellikler sadece kullanıcı değerine sahip olduğunda geliştirilir; “You‑Aren’t‑Gonna‑Need‑It” prensibi sıkı şekilde uygulanır. Performans bütçesi: JS bundle ≤ 150 KB gzipped, LCP < 1 s, TTI < 2 s.

## Additional Constraints
- **App Router + Route Handlers**: API uç noktaları `app/api/*/route.ts` içinde tanımlanmalı, `Response.json` kullanılmalı.  
- **Server Components**: Veri çekimi `await supabase.from(...).select()` ile Server Component içinde yapılır; client‑side JavaScript en aza indirilir.  
- **Realtime Sync**: Etiket ve link değişiklikleri Supabase Realtime/WebSocket üzerinden `useRealtime` hook’u ile anlık senkronize edilir.  
- **Edge Functions for Scraping**: URL eklenirken OpenGraph verileri Edge Function’da (Deno) 2 s içinde çekilir, sonuç `links` tablosuna kaydedilir.  
- **Full‑Text Search**: `pg_search` ve GIN + pg_trgm indeksleri kullanılarak yüksek performanslı web‑search sağlanır.  
- **ISR & Edge Caching**: Popüler etiket sayfaları (`/t/:slug`) ISR (revalidate = 60 s) ile önbelleğe alınır.  
- **Rate Limiting & Middleware**: Vercel Edge Middleware ile IP‑bazlı 60 req/min limit, CORS ve CSRF korumaları uygulanır.  

## Development Workflow
1. **Branching**: `feature/*`, `bugfix/*`, `hotfix/*` adlandırma kurallarına uyulur.  
2. **Pull Request**: PR açıldığında otomatik olarak `npm run lint`, `npm test`, `npx tsc --noEmit` ve `npm run build` çalıştırılır; tüm adımlar başarılı olmalı.  
3. **Code Review**: En az bir ekip üyesi güvenlik, RLS ve performans kontrolleri yapar; `STITCH-PROMPT.md` referans alınır.  
4. **Quality Gates**: CI/CD pipeline’da test coverage %90, bundle size kontrolü ve Lighthouse LCP/TTI hedefleri zorunludur.  
5. **Deployment**: Başarılı pipeline sonrası Vercel preview ortamına otomatik deploy; prod’a geçiş için manuel onay ve `git tag vX.Y.Z` ile versiyonlama yapılır.

## Governance
Bu constitution tüm proje uygulamalarının üstünde yer alır; çelişen prosedürler geçersiz sayılır. Her değişiklik için:
- **Amendment Documentation**: Değişiklik nedeni, etki analizi ve geri dönüş planı bir markdown dosyasıyla kaydedilir.  
- **Approval**: En az iki senior geliştirici ve bir güvenlik sorumlusu onayı gerekir.  
- **Migration**: Gerekli veri migrasyonları ve RLS güncellemeleri otomatik testlerle doğrulanır.  
- **Compliance Check**: PR’ler `npm run lint`, `npm test`, `npx tsc --noEmit && npm run build` ve `npm run audit` komutlarıyla geçmelidir.  

**Version**: 1.0.0 | **Ratified**: 2026-07-26 | **Last Amended**: 2026-07-26