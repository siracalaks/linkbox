# Contract: UI Ekranları (001-linkbox)

Görsel otorite: `docs/STITCH-PROMPT.md` (token'lar) + `docs/design/screen-1.html` (liste) + `docs/design/screen-2.html` (detay). Tüm metinler Türkçe. TÜM ekranlar 640 px / 1024 px breakpoint'leriyle mobil-tablet-masaüstü responsive (UI-006, pazarlıksız).

## Tasarım token'ları (Tailwind config'e aktarılır)
- Renkler: screen-1.html `tailwind.config` renk seti (primary `#c3c0ff`, primary-container `#4f46e5`, background/surface `#051424`, surface-container `#122131`, on-surface `#d4e4fa`, error `#ffb4ab` vb.)
- Spacing: xs 4 / sm 8 / md 16 / lg 24 / xl 40 / 2xl 64 / gutter 24 / container-max 1280
- Radius: DEFAULT .25rem, lg .5rem, xl .75rem, full
- Font: display/headline `Outfit`, body/label `Inter`; fontSize ölçeği screen-2.html'deki gibi
- Efektler: `.glass-effect` (blur 12px, rgba(18,33,49,.8), 1px beyaz %10 kenar), `.indigo-gradient-btn` (135deg #4f46e5→#3730a3), `.card-glow` hover

## Ekran 1 — Dashboard `/` (screen-1.html)
- Header (sticky): logo "Linkbox", masaüstü nav, "Yeni Link Ekle" butonu (masaüstü), avatar dropdown (email, Çıkış Yap)
- Masaüstü (≥768px benzeri md): sol sabit sidebar (280px); mobil: alt nav çubuğu + ortada FAB "+" (modal açar)
- Arama çubuğu: placeholder "Tam metin ara...", 300 ms debounce, URL query param `?q=` günceller (UI-004)
- Etiket chip barı: kullanıcının etiketleri; `#tümü` + toggle'lı chip'ler; seçililer AND filtre `?tags=` (UI-003)
- Kart grid: 1 kolon mobil / 2 tablet (sm) / 3-4 masaüstü (lg/xl), `gap-gutter`; kart: önizleme veya fallback ikon, başlık (yeni sekmede açılır link → detaya giden başlık ayrıca karta tıklamayla `/links/[id]`), kısaltılmış URL, etiket chip'leri, tarih, hover'da Düzenle/Sil ikonları (UI-001)
- Sayfalama footer: "Toplam N link", Önceki/Sonraki (keyset — Önceki, tarayıcı geri/`?cursor` geçmişiyle)
- Boş arama sonucu: "Sonuç bulunamadı" (US3-2); hiç link yoksa boş durum + CTA
- Modal "Yeni Link Ekle": URL (zorunlu), Başlık, Açıklama, Etiketler (virgülle + mevcut etiketlerden autocomplete/datalist); mobilde alttan kayar, masaüstünde ortalı (UI-002); İptal + Linki Kaydet
- Env yoksa: tüm içerik alanı yerine `db-pending` durumu: "Veritabanı yapılandırması bekleniyor"

## Ekran 2 — Link Detayı `/links/[id]` (screen-2.html)
- Header: geri oku, logo, avatar
- Breadcrumb: Tüm Linkler › Detay Görünümü
- Grid: mobil tek kolon; lg'de iki kolon (sol: 16:9 önizleme görseli veya fallback ikon; sağ: detaylar)
- Sağ kolon: başlık, açıklama (düzenlenebilir textarea), "Bağlantı Adresi" salt-okunur alan + Kopyala (clipboard + "Kopyalandı" geri bildirimi), Etiketler bölümü (chip + x ile kaldır, yeni etiket girişi autocomplete), aksiyonlar: Kaydet / Aç (yeni sekme) / Sil (onaylı)
- Footer: "Son güncelleme: <updated_at Türkçe tarih>"
- Bulunamayan id → 404 sayfası (Türkçe)

## Ekran 3 — Giriş `/login`
- Spec kapsamı (Supabase Auth email/password + magic link) gereği zorunlu; ayrı Stitch referansı yok → aynı token/tipografi sistemi, glass panel kart, ortalanmış tek kolon
- Alanlar: E-posta, Şifre; butonlar: "Giriş Yap", "Kayıt Ol", "Giriş bağlantısı gönder" (magic link); hata/bilgi mesajları Türkçe
- Env yoksa: "Veritabanı yapılandırması bekleniyor"

## Erişilebilirlik (UI-007)
- Tüm ikon butonlarda `aria-label`; modal `role="dialog"` `aria-modal` + ESC ile kapanır + odak yönetimi; chip toggle'lar `aria-pressed`; klavye ile tüm akışlar tamamlanabilir; kontrast koyu temada AA
