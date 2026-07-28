-- Linkbox 0002_link_note — links tablosuna kişisel not kolonu (specs/002-linke-kisisel-not-alani)
-- ELLE YAZILDI (lokalde Postgres yok; `prisma migrate dev` çalıştırılamaz).
-- Deploy'da `prisma migrate deploy` ile uygulanır (package.json "start").
-- 0001_init.sql DEĞİŞTİRİLMEDİ — bu, salt EKLEME yapan yeni bir migration'dır.

-- FR-001: Link modeline nullable not kolonu
ALTER TABLE "links" ADD COLUMN "note" TEXT;

-- FR-003 / Edge Case: 200 karakter sınırı veritabanı düzeyinde de güvence altına alınır
ALTER TABLE "links" ADD CONSTRAINT "links_note_length_check"
    CHECK (char_length("note") <= 200);
