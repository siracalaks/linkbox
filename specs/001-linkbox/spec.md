# Feature Specification: Linkbox

**Feature Branch**: `001-linkbox`
**Created**: 2026-07-26
**Status**: Draft

## Clarifications

### Session 2026-07-26

- Q: Kullanıcıların linklerini ve etiketlerini depolamak için veri modelini nasıl tasarlamalıyız? → A: İki ayrı tablo: `links` ve `tags` + many‑to‑many ilişki tablosu `link_tags` (normalize edilmiş yapı).
- Q: Kullanıcı oturum yönetimi ve yetkilendirme için hangi yaklaşımı benimsemeliyiz? → A: Supabase Auth (email/password + OAuth) ve JWT tabanlı server‑side session.
- Q: Link ve etiket arama fonksiyonelliği için en uygun indeksleme stratejisi nedir? → A: PostgreSQL `GIN` indeksi + `tsvector` ile tam metin arama (link URL, başlık, etiketler).
- Q: Kullanıcı arayüzünde “tek sayfada yönet” deneyimini sağlamak için hangi UI mimarisini seçmeliyiz? → A: Next.js 13 App Router + React Server Components + TanStack Query (veri önbellekleme).
- Q: Uygulamanın ölçeklenebilirliği ve maliyet etkinliği için veri erişim katmanını nasıl yapılandırmalıyız? → A: Supabase RPC (PostgreSQL fonksiyonları) + Row‑Level Security ile doğrudan client‑side çağrılar.
- Q: Link ve etiket verilerini saklarken hangi tablo yapısını tercih etmeliyiz? → A: Tam normalize: `links`, `tags` ve `link_tags` ara tablosu (many‑to‑many)
- Q: Kullanıcıların link ekleme ve etiketleme işlemlerinde hangi veri bütünlüğü kontrolünü sunmalıyız? → A: Doğrudan PostgreSQL trigger + constraint (ör. `CHECK (url ~ '^https?://')` ve `EXCLUDE` etiketi kontrolü)
- Q: Tam metin arama performansını artırmak için hangi indeks kombinasyonunu kullanmalıyız? → A: `GIN` indeksi on bir `tsvector` kolonu, bu kolonu `title`, `url` ve `tags.name` ile doldurmak
- Q: Kullanıcı arayüzünde link ve etiket listelerini önbelleğe alırken hangi stratejiyi benimsemeliyiz? → A: TanStack Query `staleTime: Infinity` + manuel invalidation
- Q: Kullanıcıların sadece kendi linklerini görebilmesi için RLS politikalarını nasıl tanımlamalıyız? → A: Poliçeyi `CREATE POLICY user_links ON links FOR SELECT USING (user_id = current_setting('request.jwt.claim.sub')::uuid);` ve `link_tags` için `USING (EXISTS (SELECT 1 FROM links WHERE links.id = link_tags.link_id AND links.user_id = current_setting('request.jwt.claim.sub')::uuid))`
- Q: Kullanıcıların linklerini ve etiketlerini saklarken veri bütünlüğü ve performans dengesini sağlamak için hangi tablo yapısını tercih etmeliyiz? → A: Tam normalize edilmiş yapı: `links`, `tags` ve `link_tags` ara tablosu (many‑to‑many).
- Q: Supabase Auth entegrasyonu ve JWT tabanlı oturum yönetimi için hangi güvenlik stratejisini uygulamalıyız? → A: Supabase Auth (email/password + OAuth) + JWT ile server‑side session, `request.jwt.claim.sub` üzerinden RLS kontrolü.
- Q: Tam metin arama ve etiket filtrelemesi için en etkili indeksleme yaklaşımı nedir? → A: Tek `tsvector` kolonu (`search_vector`) üzerine GIN indeksi; `title`, `url` ve `tags.name` concat edilerek güncellenir.
- Q: Next.js 13 App Router içinde veri önbellekleme ve senkronizasyonu nasıl yönetmeliyiz? → A: TanStack Query ile `staleTime: Infinity` ve manuel invalidation (mutasyon sonrası `queryClient.invalidateQueries(['links'])`).
- Q: Row‑Level Security (RLS) politikalarını ve PostgreSQL fonksiyonlarını (RPC) nasıl birleştirerek KVKK/DSGVO uyumluluğunu en iyi sağlayabiliriz? → A: RLS politikalarıyla `user_id` kontrolü, `link_tags` için `USING (EXISTS (...))`; RPC fonksiyonları sadece izin verilen alanları döndürür ve loglama/tracking eklenir.

## User Scenarios & Testing

### User Story 1 - Çekirdek Akış (Priority: P1)
Kişisel link biriktirme ve etiketleme aracı - kaydet, etiketle, ara, tek sayfada yönet için ana kullanıcı akışı uçtan uca çalışır.

**Acceptance Scenarios**:
1. **Given** uygulama açık, **When** kullanıcı ana aksiyonu tamamlar, **Then** sonuç kalıcı olarak kaydedilir ve kullanıcıya doğrulanmış geri bildirim gösterilir.

### Edge Cases
- Boş/geçersiz girdi durumunda kullanıcıya anlaşılır hata gösterilir.
- Dış servis erişilemezse akış veri kaybetmeden durur ve tekrar denenebilir.

## Requirements

### Functional Requirements
- **FR-001**: Sistem, "Kişisel link biriktirme ve etiketleme aracı - kaydet, etiketle, ara, tek sayfada yönet" kapsamındaki ana kullanıcı akışını uçtan uca SUNMALIDIR.
- **FR-002**: Sistem, tüm kullanıcı girdilerini doğrulamalı ve hataları ham teknik mesaj olmadan GÖSTERMELİDİR.
- **FR-003**: Sistem, kalıcı verileri güvenli biçimde saklamalı ve yetkisiz erişimi ENGELLEMELİDİR.

### Key Entities
- **Kullanıcı**: Sistemi kullanan aktör.
- **Ana Kayıt**: Kişisel link biriktirme ve etiketleme aracı - kaydet, etiketle, ara, tek sayfada yönet akışının ürettiği temel veri varlığı.

## Success Criteria

### Measurable Outcomes
- **SC-001**: Ana akış, yeni bir kullanıcı tarafından yardım almadan 5 dakika içinde tamamlanabilir.
- **SC-002**: `npx tsc --noEmit && npm run build` komutu her fazın sonunda hatasız geçer.
- **SC-003**: Hatalı girdilerin %100'ü kullanıcı-dostu mesajla karşılanır.

## Assumptions
- LLM üretimi kullanılamadığı için bu spec sihirbaz girdilerinden deterministik üretildi; detaylar /speckit-clarify ile derinleştirilebilir.
- Proje iskeleti şu komutla kurulur: `npx create-next-app@latest . --ts --app --tailwind --eslint --no-src-dir`
