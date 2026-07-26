# Linkbox Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### I. Authentication Discipline
Her görev sonunda aşağıdaki komut başarıyla çalıştırılmalıdır:  
`npx tsc --noEmit && npm run build`  
Bu, tip güvenliğini ve derleme hatalarını önceden yakalamayı zorunlu kılar.

### II. Security
- **Row‑Level Security (RLS)**: `public.links` ve ilişkili tablolar için `auth.uid() = user_id` politikaları zorunludur; `WITH CHECK` ile veri ekleme/güncelleme aynı koşulla sınırlandırılır.  
- **Service‑Role gizliliği**: Supabase Service‑Role anahtarı yalnızca sunucu tarafında (`createServerClient`) bulunur, istemci kodunda asla yer almaz.  
- **JWT yönetimi**: Kimlik doğrulama sadece Next.js Middleware üzerinden yapılır; tokenlar çerezlerde `httpOnly` ve `secure` olarak saklanır, localStorage kullanılmaz.  
- **Realtime izolasyonu**: Kanal abonelikleri `user_id` filtresiyle sınırlanır, tüm kullanıcıların verileri dinlenmez.  
- **Depolama erişimi**: Özel dosyalar (ör. önizleme görselleri) `createSignedUrl` ile 5 dk geçerli imzalı URL üzerinden sunulur; public bucket’larda hassas veri bulunmaz.

### III. Realistic Testing
- CRUD akışları, etiket güncellemeleri ve tam‑metin arama için smoke / birim testleri zorunludur.  
- Testler, CI pipeline’da `npm test` ve ardından yukarıdaki derleme komutu ile geçmelidir.  
- “%100 coverage” gibi iddialar zorunlu değildir; temel kalite kapısı derleme başarısıdır.

### IV. Documentation & Responsiveness
- Tüm UI bileşenleri ve API sözleşmeleri `STITCH-PROMPT.md` tasarım sistemine tam uyumlu olmalıdır.  
- Her ekran (mobil, tablet, masaüstü) için responsive tasarım zorunludur; medya sorguları ve fluid layout kullanılmalıdır.  
- Dokümantasyon, kod içinde JSDoc ve proje kökünde `README.md` ile güncel tutulur.

### V. Simplicity / YAGNI
- Gereksiz özellik eklemek yasaktır; sadece MVP çekirdek işlevleri (link kaydet, etiketle, ara, filtrele) geliştirilir.  
- Karmaşık altyapı (pgvector, AI öneri, vs.) sadece ihtiyaç doğduğunda eklenir; mevcut mimari basit ve sürdürülebilir kalır.

## Additional Constraints
- **Performance**: `title`, `description`, `url`, `tags` alanlarını birleştiren `tsvector` kolonu ve GIN indeksi oluşturulmalı; tam‑metin arama milisaniyeler içinde yanıt verir.  
- **Pagination**: Keyset pagination (`WHERE id > last_id ORDER BY id`) kullanılmalı, büyük veri setlerinde sabit performans sağlanır.  
- **Uniqueness**: (`user_id`, `url`) birleşik UNIQUE kısıtlaması ile aynı linkin tekrar eklenmesi önlenir.  
- **Cache**: Popüler etiket listeleri ve sık okunan sorgular ISR (`revalidate = 60`) ve `Cache‑Control: public, max-age=60` başlıklarıyla önbelleğe alınır.

## Development Workflow
- **Branching**: `main` sadece onaylı PR’larla güncellenir; özellik geliştirmeleri `feature/<name>` dalında yapılır.  
- **Code Review**: Her PR’da RLS politikaları, middleware doğrulaması ve storage erişim kontrolleri incelenir; onay için en az bir ekip üyesi gerekir.  
- **Quality Gates**: CI’da sırasıyla `npm lint`, `npm test`, `npx tsc --noEmit`, `npm run build` çalıştırılır; herhangi bir adım başarısız olursa merge engellenir.  
- **Deployment**: Docker/Nixpacks ile Coolify üzerinde otomatik build; ortam değişkenleri sadece sunucu tarafında tanımlanır, Vercel‑özel yapılandırmalar kullanılmaz.

## Governance
- Bu constitution tüm proje uygulamalarının üstünde yer alır; çelişen prosedürler geçersiz sayılır.  
- Değişiklikler, en az iki geliştiricinin onayı ve bir sürüm notu ile `CONSTITUTION.md` dosyasında belgelemeli; ardından `Version` ve tarih alanları güncellenmelidir.  
- Uygulama sırasında ortaya çıkan yeni güvenlik riskleri, anında ilgili ilkeye (Security) eklenir ve CI pipeline’ına yansıtılır.  

**Version**: 1.0.0 | **Ratified**: 2026-07-26 | **Last Amended**: 2026-07-26