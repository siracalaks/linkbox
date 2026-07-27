# Feature Specification: Linke kişisel not alanı
**Feature Branch**: `002-linke-kisisel-not-alani`  
**Created**: 2026-07-27  
**Status**: Draft  

## Clarifications

### Session 2026-07-27

- Q: Kullanıcı notu ne kadar uzunlukta olmalı? → A: Maksimum 200 karakter (kısa özet)
- Q: Not alanının UI/UX konumu nerede gösterilsin? → A: Link detay sayfasında açılır/çökebilen bir panel
- Q: Notun veri modeline nasıl eklenecek? → A: Link modeline nullable "note" string kolonu eklemek

## User Scenarios & Testing  

### User Story 1 - Kişisel Not Ekleme (Priority: P2)  
Kullanıcı, bir linki kaydettikten sonra o linke 200 karakteri geçmeyen kısa bir not ekleyebilmelidir.  

**Acceptance Scenarios:**  
1. **Given** kullanıcı oturum açmış ve link detay sayfasına (`/links/[id]`) gitmiştir,  
   **When** “Not Ekle” butonuna tıklar ve 200 karakterden az bir metin girer,  
   **Then** sistem notu kaydeder ve not ikonunu link listesinde gösterir.  

2. **Given** kullanıcı aynı linkin detay sayfasında daha önce bir not eklemişse,  
   **When** not alanını açıp mevcut notu düzenler ve “Kaydet”e basar,  
   **Then** sistem notu günceller ve değişiklik anında UI’da yansıtılır.  

### User Story 2 - Not Görüntüleme (Priority: P2)  
Kullanıcı, link listesinde notu olan linkleri hızlıca ayırt edebilmelidir.  

**Acceptance Scenarios:**  
1. **Given** kullanıcı ana sayfada (`/`) link listesini görüntüler,  
   **When** bir linkin yanında not ikonu görünür,  
   **Then** kullanıcı ikona tıkladığında notun bir önizlemesi (max 50 karakter) tooltip olarak gösterilir.  

2. **Given** kullanıcı listeden bir linke tıkladığında link detay sayfasına yönlendirilir,  
   **When** not alanı mevcutsa, not otomatik olarak genişletilmiş bir panelde gösterilir,  
   **Then** kullanıcı notu doğrudan düzenleyebilir.  

### Edge Cases  
- Not 200 karakteri aşarsa sistem “Not 200 karakteri geçemez” uyarısı verir ve kaydetme işlemini engeller.  
- Not alanı boş bırakılırsa (silinirse) sistem notu `NULL` olarak saklar; not ikonu listede gösterilmez.  
- Kullanıcı aynı linki farklı tarayıcı sekmelerinde açıp not eklemeye çalışırsa, son kaydedilen not veri bütünlüğünü korur (son kaydetme kazanır).  

## Requirements  

### Functional Requirements  
- FR-001: Sistem, `Link` modeline nullable `note` string kolonu eklemelidir.  
- FR-002: Sistem, bir linkin detay sayfasında “Not Ekle/Düzenle” panelini açabilmelidir.  
- FR-003: Sistem, notun maksimum uzunluğunu 200 karakter ile sınırlamalıdır.  
- FR-004: Sistem, not kaydedildiğinde ilgili `Link` kaydını güncelleyerek `note` alanını saklamalıdır.  
- FR-005: Sistem, notu olan linklerde link listesinde bir not ikonu göstermelidir.  
- FR-006: Sistem, not ikonu üzerine gelindiğinde notun ilk 50 karakterini tooltip olarak sunmalıdır.  
- FR-007: Sistem, notun sadece link sahibi tarafından görüntülenip düzenlenebilmesini sağlamalıdır.  

### UI/UX Requirements  
- UI-001: Link detay sayfasında “Not Ekle/Düzenle” paneli, mevcut içerik altında açılır/çökebilen bir alan olarak yer almalıdır.  
- UI-002: Not paneli, 200 karakterlik bir textarea ve “Kaydet” butonu içermelidir.  
- UI-003: Not ikonu, link listesinde her satırın sağ tarafında, diğer aksiyon ikonlarıyla hizalanmış şekilde görünmelidir.  
- UI-004: Not ikonu üzerine gelindiğinde, 50 karaktere kadar bir tooltip gösterilmelidir.  
- UI-005: İlgili ekranlar mobil, tablet ve masaüstünde responsive olmalıdır; özellikle not paneli ve ikon yerleşimi farklı ekran genişliklerine uyum sağlamalıdır.  

### Key Entities  
- **Link**  
  - `note` String? (nullable, max 200 karakter)  

## Success Criteria  

### Measurable Outcomes  
- SC-001: Üretim ortamında `links` tablosunda `note` kolonu %100 mevcut ve NULL değerli kayıtlarla uyumlu olmalıdır.  
- SC-002: Kullanıcıların %95’i not ekleme/düzenleme akışını hatasız tamamlayabilmelidir (örnekleme testleri).  
- SC-003: Link listesinde not ikonu gösterimi, notu olan linklerde %100 doğrulukla gerçekleşmelidir.  
- SC-004: Tooltip içinde gösterilen not önizlemesi, 50 karakteri aşmadığı sürece %100 doğru metni yansıtmalıdır.  

## Assumptions  
- Not alanı sadece düz metin kabul eder; zengin metin, markdown veya emoji gibi ek formatlar desteklenmez.  
- Notun 200 karakter sınırı, UTF‑8 kodlamasında byte bazlı değil karakter bazlı olarak sayılır.  
- Not ikonu ve tooltip tasarımı mevcut ikon seti ve stil rehberi içinde tanımlı varsayılan renk ve boyutları kullanır.  
- Notun sadece link sahibi tarafından görülmesi, mevcut Auth.js oturum yönetimi ve Prisma `userId` ilişkisi üzerinden sağlanır; ek bir erişim kontrol mekanizması eklenmez.