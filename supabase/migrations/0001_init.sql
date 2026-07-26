-- Linkbox 001 — başlangıç şeması
-- Kaynak: specs/001-linkbox/data-model.md
-- NOT: Bu dosya bu ortamda ÇALIŞTIRILMAZ (SUPABASE_DB_URL yok);
-- Supabase SQL editöründe veya `supabase db push` ile uygulanır.

-- gen_random_uuid() için (Supabase'de varsayılan olarak açık)
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tablolar
-- ---------------------------------------------------------------------------

create table public.links (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  url           text not null check (url ~* '^https?://'),
  title         text,
  description   text,
  preview_path  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  search_vector tsvector not null default ''::tsvector,
  -- FR-002: aynı kullanıcı aynı URL'yi ikinci kez ekleyemez
  constraint links_user_url_unique unique (user_id, url)
);

-- FR-010 / D9: keyset pagination (created_at, id) DESC
create index links_keyset_idx on public.links (user_id, created_at desc, id desc);
-- FR-003: tam-metin arama
create index links_search_idx on public.links using gin (search_vector);

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       varchar(50) not null check (char_length(name) between 1 and 50),
  created_at timestamptz not null default now(),
  -- D8: etiketler kullanıcıya özel (anayasa II RLS gereği)
  constraint tags_user_name_unique unique (user_id, name)
);

create table public.link_tags (
  link_id uuid not null references public.links (id) on delete cascade,
  tag_id  uuid not null references public.tags (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (link_id, tag_id)
);

-- FR-009: etiket bazlı filtreleme okuma yönü
create index link_tags_tag_link_idx on public.link_tags (tag_id, link_id);

-- ---------------------------------------------------------------------------
-- Tam-metin arama: search_vector = title + description + url + etiket adları
-- (D7: GENERATED kolon başka tablodan okuyamaz, bu yüzden trigger)
-- ---------------------------------------------------------------------------

create or replace function public.compute_link_search_vector(
  p_link_id uuid, p_title text, p_description text, p_url text
) returns tsvector
language sql stable as $$
  select to_tsvector(
    'simple',
    coalesce(p_title, '') || ' ' ||
    coalesce(p_description, '') || ' ' ||
    coalesce(p_url, '') || ' ' ||
    coalesce((
      select string_agg(t.name, ' ')
      from public.tags t
      join public.link_tags lt on lt.tag_id = t.id
      where lt.link_id = p_link_id
    ), '')
  );
$$;

create or replace function public.links_refresh_search_vector()
returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.search_vector := public.compute_link_search_vector(new.id, new.title, new.description, new.url);
  return new;
end;
$$;

create trigger links_search_vector_trg
  before insert or update of title, description, url on public.links
  for each row execute function public.links_refresh_search_vector();

create or replace function public.link_tags_refresh_search_vector()
returns trigger
language plpgsql as $$
declare
  v_link_id uuid := coalesce(new.link_id, old.link_id);
begin
  update public.links l
     set search_vector = public.compute_link_search_vector(l.id, l.title, l.description, l.url),
         updated_at    = now()
   where l.id = v_link_id;
  return coalesce(new, old);
end;
$$;

create trigger link_tags_search_vector_trg
  after insert or delete on public.link_tags
  for each row execute function public.link_tags_refresh_search_vector();

-- ---------------------------------------------------------------------------
-- RLS (anayasa II): auth.uid() = user_id — USING + WITH CHECK
-- ---------------------------------------------------------------------------

alter table public.links enable row level security;
alter table public.tags enable row level security;
alter table public.link_tags enable row level security;

create policy links_select on public.links
  for select using (auth.uid() = user_id);
create policy links_insert on public.links
  for insert with check (auth.uid() = user_id);
create policy links_update on public.links
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy links_delete on public.links
  for delete using (auth.uid() = user_id);

create policy tags_select on public.tags
  for select using (auth.uid() = user_id);
create policy tags_insert on public.tags
  for insert with check (auth.uid() = user_id);
create policy tags_update on public.tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tags_delete on public.tags
  for delete using (auth.uid() = user_id);

create policy link_tags_select on public.link_tags
  for select using (auth.uid() = user_id);
create policy link_tags_insert on public.link_tags
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.links l where l.id = link_id and l.user_id = auth.uid())
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
  );
create policy link_tags_delete on public.link_tags
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Realtime (FR-004): links tablosu değişikliklerini yayınla
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.links;
exception when others then
  null; -- yayın yoksa veya tablo zaten ekliyse sessizce geç
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage (FR-006): önizleme görselleri için private bucket
-- Erişim yalnızca sunucu tarafı signed URL (createSignedUrl, 300 sn)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('previews', 'previews', false)
on conflict (id) do nothing;
