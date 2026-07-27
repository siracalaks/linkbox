-- Linkbox 0001_init — kendi sunucu PostgreSQL başlangıç şeması
-- ELLE YAZILDI (lokalde Postgres yok; `prisma migrate dev` çalıştırılamaz).
-- Deploy'da `prisma migrate deploy` ile uygulanır (package.json "start").
-- prisma/schema.prisma ile birebir tutarlıdır; ek olarak search_vector
-- (tsvector) kolonu, GIN indeksi ve trigger'lar ham SQL olarak buradadır.
-- Gereksinim: PostgreSQL 13+ (gen_random_uuid yerleşik).

-- ---------------------------------------------------------------------------
-- Tablolar
-- ---------------------------------------------------------------------------

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "preview_path" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
    -- FR-003: tam-metin arama kolonu (Prisma modelinde yok; trigger günceller)
    "search_vector" tsvector NOT NULL DEFAULT ''::tsvector,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id"),
    -- Edge case: geçersiz URL formatı veritabanı düzeyinde de reddedilir
    CONSTRAINT "links_url_check" CHECK ("url" ~* '^https?://')
);

-- FR-002: aynı kullanıcı aynı URL'yi ikinci kez ekleyemez
CREATE UNIQUE INDEX "links_user_url_unique" ON "links"("user_id", "url");
-- FR-010 / D9: keyset pagination (created_at, id) DESC
CREATE INDEX "links_keyset_idx" ON "links"("user_id", "created_at" DESC, "id" DESC);
-- FR-003: tam-metin arama GIN indeksi
CREATE INDEX "links_search_idx" ON "links" USING GIN ("search_vector");

CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id"),
    -- Edge case: etiket adı 1–50 karakter
    CONSTRAINT "tags_name_check" CHECK (char_length("name") BETWEEN 1 AND 50)
);

-- D8: etiketler kullanıcıya özel — UNIQUE(user_id, name)
CREATE UNIQUE INDEX "tags_user_name_unique" ON "tags"("user_id", "name");

CREATE TABLE "link_tags" (
    "link_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "link_tags_pkey" PRIMARY KEY ("link_id", "tag_id")
);

-- FR-009: etiket bazlı filtreleme okuma yönü
CREATE INDEX "link_tags_tag_link_idx" ON "link_tags"("tag_id", "link_id");

-- ---------------------------------------------------------------------------
-- Yabancı anahtarlar (CASCADE — link/etiket/kullanıcı silinince köprü temizlenir)
-- ---------------------------------------------------------------------------

ALTER TABLE "links" ADD CONSTRAINT "links_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_link_id_fkey"
    FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Tam-metin arama: search_vector = title + description + url + etiket adları
-- (D7: GENERATED kolon başka tablodan okuyamaz, bu yüzden trigger)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.compute_link_search_vector(
  p_link_id uuid, p_title text, p_description text, p_url text
) RETURNS tsvector
LANGUAGE sql STABLE AS $$
  SELECT to_tsvector(
    'simple',
    coalesce(p_title, '') || ' ' ||
    coalesce(p_description, '') || ' ' ||
    coalesce(p_url, '') || ' ' ||
    coalesce((
      SELECT string_agg(t.name, ' ')
      FROM public.tags t
      JOIN public.link_tags lt ON lt.tag_id = t.id
      WHERE lt.link_id = p_link_id
    ), '')
  );
$$;

CREATE OR REPLACE FUNCTION public.links_refresh_search_vector()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at := now();
  new.search_vector := public.compute_link_search_vector(new.id, new.title, new.description, new.url);
  RETURN new;
END;
$$;

CREATE TRIGGER links_search_vector_trg
  BEFORE INSERT OR UPDATE OF title, description, url ON "links"
  FOR EACH ROW EXECUTE FUNCTION public.links_refresh_search_vector();

CREATE OR REPLACE FUNCTION public.link_tags_refresh_search_vector()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_link_id uuid := coalesce(new.link_id, old.link_id);
BEGIN
  UPDATE public.links l
     SET search_vector = public.compute_link_search_vector(l.id, l.title, l.description, l.url),
         updated_at    = now()
   WHERE l.id = v_link_id;
  RETURN coalesce(new, old);
END;
$$;

CREATE TRIGGER link_tags_search_vector_trg
  AFTER INSERT OR DELETE ON "link_tags"
  FOR EACH ROW EXECUTE FUNCTION public.link_tags_refresh_search_vector();
