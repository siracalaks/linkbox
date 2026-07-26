# Feature Specification: Linkbox
**Feature Branch**: `001-linkbox`  
**Created**: 2026-07-26  
**Status**: Draft  

## Clarifications

### Session 2026-07-26

- Q: Link verilerini saklamak için veritabanı şeması tasarımı nasıl olmalı? (MVP seviyesinde en basit, ölçeklenebilir yapı) → A: Tek bir `links` tablosu: id, url, title, created_at, user_id; etiketler için ayrı `tags` tablosu ve many‑to‑many `link_tags` köprü tablosu.
- Q: Tam metin arama için hangi yaklaşım en hızlı ve en az karmaşık çözüm sunar? → A: PostgreSQL'in built‑in `tsvector` + GIN indeksi kullanarak `links` tablosunda `title` ve `url` alanlarını indekslemek.
- Q: Kullanıcı oturum yönetimi ve kimlik doğrulama için en uygun yöntem nedir? → A: Supabase Auth (email/password + magic link) ve JWT‑tabanlı oturum çerezleri.
- Q: Etiket bazlı filtreleme performansını artırmak için hangi veri erişim stratejisi tercih edilmeli? → A: SQL'de `JOIN` + `WHERE tag_id = ?` sorgusunu `link_tags` köprü tablosu üzerinden çalıştırmak ve `link_tags` üzerinde indeks oluşturmak.
- Q: Uygulama katmanında veri katmanına (Supabase) erişim için hangi client stratejisi en basit ve sürdürülebilir? → A: Supabase JS SDK'ını doğrudan Next.js API Routes içinde kullanmak (server‑side) ve React hooks (`useSWR`, `useSupabase`) ile client‑side veri çekmek.
- Q: Link kayıtları ve etiket ilişkisi için many‑to‑many köprü tablosu `link_tags` üzerinde hangi indeks stratejisi, okuma‑ağırlıklı sorgular (etikete göre filtreleme) için en verimli olur? → A: Kombine B‑Tree indeksi (tag_id, link_id) – sorgu yönüne göre sıralı
- Q: Tam metin arama için `links` tablosundaki `title` ve `url` alanlarını `tsvector` sütunu ile indekslerken, hangi güncelleme mekanizması veri tutarlılığı için en basit ve güvenilir? → A: PostgreSQL `GENERATED ALWAYS AS` sanal sütun ve `CREATE TRIGGER` ile otomatik güncelleme
- Q: Kullanıcı başına saklanan link sayısı arttıkça sayfalama performansını korumak için hangi veri çekme stratejisi tercih edilmeli? → A: Keyset pagination (WHERE id > last_seen_id ORDER BY id) – sabit performans
- Q: Etiket bazlı filtreleme sonuçlarını cache'lemek için hangi Next.js katmanı ve hangi cache çözümü en düşük ek karmaşıklıkla uyum sağlar? → A: API Route içinde `lru-cache` (in‑memory) ve `Cache-Control: s-maxage` header
- Q: Kullanıcıların aynı linki birden çok kez eklemesini önlemek için veritabanı düzeyinde hangi kısıtlama en uygun? → A: `links` tablosunda (`user_id`, `url`) birleşik UNIQUE kısıtlaması
- Q: Kullanıcıların kişisel veri (linkler, etiketler) saklanırken veri‑at‑rest şifrelemesi nasıl uygulanmalı? Hangi yaklaşım GDPR‑uyumlu, düşük bakım maliyetli ve Supabase ile sorunsuz çalışır? → A: PostgreSQL `pgcrypto` uzantısı ile `links` ve `tags` tablolarındaki hassas alanları (url, title) `BYTEA` olarak şifreleyip, uygulama katmanında anahtar yönetimini Supabase `service_role` JWT'siyle sağlayın.
- Q: Kullanıcı oturumlarının süresi dolduğunda otomatik olarak veri silme (right‑to‑be‑forgotten) politikası nasıl uygulanmalı? Hangi yöntem en az kod ve en yüksek güvenilirlik sunar? → A: Next.js API Route içinde bir server‑side endpoint (`/api/cleanup`) oluşturup, Vercel cron (scheduled functions) ile haftalık tetikleyerek aynı cascade delete mantığını uygulayın.
- Q: Kullanıcıların veri ihlali durumunda bildirim ve loglama mekanizması nasıl tasarlanmalı? Hangi çözüm GDPR veri ihlali raporlamasını en basit şekilde karşılar? → A: PostgreSQL `event_trigger` ile `audit.log` tablosuna her kritik işlem (link ekleme, silme, etiket değişikliği) kaydedin; Next.js API Route `/api/audit` üzerinden admin UI ile görüntüleyin.
- Q: Kullanıcıların veri erişim izinlerini (ör. sadece kendi linklerini görme) uygulama katmanında nasıl enforce edilebilir? En düşük ek karmaşıklıkla hangi strateji tercih edilmeli? → A: Supabase Row‑Level Security (RLS) politikaları tanımlayarak `user_id = auth.uid()` koşulunu `links`, `tags` ve `link_tags` tablolarına ekleyin; Next.js API Route sadece sorgu gönderir.
- Q: Kullanıcıların veri saklama süresi (ör. 90 gün sonrası otomatik silme) nasıl yönetilmeli? Hangi yöntem veri bütünlüğünü korurken en az bakım gerektirir? → A: Supabase `cron` (pg_cron) job ile haftalık `DELETE FROM links WHERE created_at < now() - interval '90 days'` çalıştırın; aynı job `tags` ve `link_tags` için de cascade delete yapar.

## User Scenarios & Testing  

### User Story 1 - Link Kaydetme (Priority: P1)  
Kullanıcı, bir web sayfasının URL’sini, isteğe bağlı başlık ve açıklama ile kaydeder ve bu kayda bir veya birden fazla etiket ekler.  

**Acceptance Scenarios:**  
1. **Given** kullanıcı oturum açmış ve geçerli bir JWT’ye sahiptir, **When** “Yeni Link Ekle” formunda `url`, `title` (opsiyonel) ve `tags` girilir, **Then** sistem linki veritabanına ekler, `user_id` alanı JWT’den alınan kimlikle eşleşir ve UI’da yeni link anlık olarak listelenir.  
2. **Given** aynı URL daha önce aynı kullanıcı tarafından eklenmişse, **When** aynı URL tekrar gönderilir, **Then** sistem “Bu link zaten kayıtlı” hatasını gösterir ve yeni kayıt oluşturulmaz.  

### User Story 2 - Etiketleme ve Filtreleme (Priority: P1)  
Kullanıcı, kaydettiği linkleri etiketlerine göre filtreleyerek sadece ilgili etiketle işaretlenmiş linkleri görüntüler.  

**Acceptance Scenarios:**  
1. **Given** kullanıcı oturum açmış, **When** etiket çubuğundan bir etiket seçilir, **Then** sistem `link_tags` ilişkisini kullanarak sadece seçilen etiketle eşleşen linkleri gösterir.  
2. **Given** birden fazla etiket seçilmişse, **When** filtre uygulanır, **Then** sistem “AND” mantığıyla tüm seçilen etiketleri taşıyan linkleri listeler.  

### User Story 3 - Tam Metin Arama (Priority: P2)  
Kullanıcı, başlık, açıklama, URL ve etiket metinleri içinde anahtar kelime araması yapar ve sonuçları milisaniyeler içinde alır.  

**Acceptance Scenarios:**  
1. **Given** kullanıcı oturum açmış, **When** arama kutusuna bir kelime girilir ve “Enter” tuşuna basılır, **Then** sistem `tsvector`‑tabanlı GIN indeksi üzerinden arama yapar ve eşleşen linkleri sıralı olarak gösterir.  
2. **Given** arama sonuçları boş ise, **When** arama kutusuna yeni bir kelime girilir, **Then** sistem “Sonuç bulunamadı” mesajı gösterir.  

### User Story 4 - Gerçek‑Zaman Güncellemeler (Priority: P2)  
Kullanıcı, aynı hesap üzerinden birden fazla tarayıcıda oturum açtığında, bir tarayıcıda yapılan link ekleme, güncelleme veya silme işlemleri diğer tarayıcılarda anlık olarak yansır.  

**Acceptance Scenarios:**  
1. **Given** iki tarayıcıda aynı kullanıcı oturum açmış, **When** bir tarayıcıda yeni bir link eklenir, **Then** diğer tarayıcıda link listesi 1‑2 saniye içinde güncellenir.  
2. **Given** bir tarayıcıda bir link etiketi değiştirilir, **When** değişiklik kaydedilir, **Then** diğer tarayıcıda ilgili linkin etiket listesi anında güncellenir.  

### Edge Cases  
- JWT süresi dolmuşsa, tüm API istekleri `401 Unauthorized` döndürür ve kullanıcı oturum açma sayfasına yönlendirilir.  
- URL geçersiz formatta (ör. `http//example`) gönderilirse, sistem `400 Bad Request` hatası ve “Geçersiz URL” mesajı verir.  
- Etiket adı 0 karakter uzunluğunda veya 50 karakteri aşarsa, sistem `400 Bad Request` ile “Etiket uzunluğu geçersiz” hatası verir.  
- Aynı anda birden fazla aynı URL eklenmeye çalışılırsa, veritabanı `UNIQUE (user_id, url)` kısıtlaması sayesinde sadece bir tanesi kabul edilir; diğerleri `409 Conflict` hatası alır.  

## Requirements  

### Functional Requirements  
- FR-001: Sistem, oturum açmış kullanıcıların `auth.uid()` değerini `user_id` alanı ile eşleştirerek `public.links` tablosunda **INSERT** işlemini yalnızca kendi kullanıcı kimliğine sahip satırlar için **İZNELİMELİDİR**.  
- FR-002: Sistem, aynı kullanıcı için aynı `url` değerine sahip ikinci bir kayıt girişini **REDDEDEBİLMEK** zorundadır (UNIQUE kısıtlama).  
- FR-003: Sistem, `title`, `description`, `url` ve `tags` alanlarını birleştiren `tsvector` sütununu otomatik olarak güncelleyerek **FULL‑TEXT ARAMA** için GIN indeksi **SAĞLAMALIDIR**.  
- FR-004: Sistem, Supabase Realtime kanalı üzerinden `INSERT`, `UPDATE`, `DELETE` olaylarını dinleyerek UI’da **ANLIK GÜNCELLEME** yapmalıdır.  
- FR-005: Sistem, tüm mutasyon (ekleme, güncelleme, silme) işlemlerini Next.js 14 `app` router’da **SERVER‑ACTION** olarak tanımlamalı ve Service‑Role anahtarını yalnızca sunucu ortamında tutmalıdır.  
- FR-006: Sistem, önizleme görselleri gibi özel dosyalar için **SIGNED URL** üretmeli ve bu URL’yi 5 dk geçerli olacak şekilde istemciye sunmalıdır.  
- FR-007: Sistem, etiket listeleri ve popüler linkler gibi sık okunan veri setlerini **ISR** (revalidate = 60 s) ile önbelleğe almalı ve `Cache‑Control: public, max‑age=60` başlığını eklemelidir.  
- FR-008: Sistem, tüm API isteklerini **Middleware‑based auth gateway** üzerinden geçirerek JWT doğrulaması yapmalı ve yetkisiz istekleri `401` ile reddetmelidir.  
- FR-009: Sistem, `link_tags` köprü tablosu üzerinde `(tag_id, link_id)` bileşik indeksi oluşturarak **ETİKET BAZLI FILTRELEME** sorgularının O( log N ) performansta çalışmasını **GARANTİLEMELİDİR**.  
- FR-010: Sistem, sayfalama için **KEYSET pagination** ( `WHERE id > last_seen_id ORDER BY id ASC` ) kullanarak büyük veri setlerinde sabit yanıt süresi **SAĞLAMALIDIR**.  

### UI/UX Requirements  
- UI-001: “Dashboard” ekranı, kaydedilen linklerin kart görünümünde `title`, `url`, `tags` ve ekleme tarihini göstermelidir.  
- UI-002: “Yeni Link Ekle” modalı, `url` (zorunlu), `title` (opsiyonel), `description` (opsiyonel) ve çoklu etiket girişi (autocomplete) alanlarını içermelidir.  
- UI-003: “Etiket Filtreleme” çubuğu, seçilen etiketleri chip olarak gösterip kaldırma imkanı sunmalıdır.  
- UI-004: “Arama” alanı, her karakter girişinde debounce (300 ms) ile tam‑metin arama sonuçlarını güncellemelidir.  
- UI-005: Tüm ekranlar `docs/STITCH-PROMPT.md`’de tanımlı tasarım token’ları (renk, spacing, tipografi) ve komponent stil rehberine **tamamen uyumlu** olmalıdır.  
- UI-006: Tüm ekranlar mobil, tablet ve masaüstü cihazlarda **responsive** tasarım kurallarına (breakpoint: 640 px, 1024 px) **uymalıdır**.  
- UI-007: Erişilebilirlik gereksinimleri: tüm interaktif öğeler `aria-label` ve `role` tanımlarıyla **WCAG 2.1 AA** seviyesini karşılamalı, klavye navigasyonu mümkün olmalıdır.  

### Key Entities  
- **users**: `id (uuid PK)`, `email`, `created_at`  
- **links**: `id (uuid PK)`, `user_id (uuid FK → users.id)`, `url (text)`, `title (text)`, `description (text)`, `created_at (timestamp)`, `search_vector (tsvector GENERATED ALWAYS AS (...))`  
- **tags**: `id (uuid PK)`, `name (varchar(50) UNIQUE)`  
- **link_tags**: `link_id (uuid FK → links.id)`, `tag_id (uuid FK → tags.id)`, `PRIMARY KEY (link_id, tag_id)`  

## Success Criteria  

### Measurable Outcomes  
- SC-001: Ortalama tam‑metin arama yanıt süresi 150 ms’nin altında olmalıdır (5 000 kayıt üzerinden ölçüm).  
- SC-002: Realtime güncellemeler tüm bağlı istemcilerde 2 s içinde yansıtılmalıdır.  
- SC-003: Dashboard’da 50 000+ link gösterildiğinde sayfalama gecikmesi 300 ms’yi geçmemelidir.  
- SC-004: JWT doğrulama ve RLS politikaları sayesinde yetkisiz veri erişimi %0 olmalıdır (penetrasyon testleriyle doğrulanacak).  
- SC-005: UI‑testleri (Cypress) üzerinden tüm kullanıcı akışları %95 başarı oranı ile otomatik geçmelidir.  

## Assumptions  
- Kullanıcı kimlik doğrulama sadece Supabase Auth (email/password + magic link) ile sağlanacaktır; üçüncü‑taraf OAuth entegrasyonu proje kapsamı dışındadır.  
- Görsel önizlemeler sadece kullanıcı tarafından yüklenen dosyalar için kullanılacak ve bu dosyalar `previews` adlı private bucket içinde saklanacaktır.  
- Etiket isimleri ASCII karakterlerle sınırlı olacak, Unicode desteklenmeyecek (kapsam dışı).  
- Veri‑at‑rest şifreleme için PostgreSQL `pgcrypto` uzantısı kullanılacak; uygulama katmanında ek bir şifreleme katmanı uygulanmayacaktır.  
- Cron‑tabanlı temizlik (90 gün sonrası silme) proje MVP’sinde yer almayacak; sadece manuel silme API’si sağlanacaktır.  

---