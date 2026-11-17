-- Hakem Ücret Takibi — şema + RLS + RPC
-- Supabase SQL editöründe BİR KERE çalıştırın (sonra seed.sql).

create extension if not exists pgcrypto;

-- ============ TABLOLAR ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id serial primary key,
  label text not null unique            -- ör. '2026-2027'
);

create table if not exists public.fee_categories (
  id serial primary key,
  season_id int not null references public.seasons(id) on delete cascade,
  key text not null,
  label text not null,
  referee numeric(10,2) not null,
  assistant numeric(10,2) not null,
  fourth numeric(10,2) not null,        -- 0 olabilir (Futsal İl grubu)
  sort_order int not null default 0,
  unique (season_id, key)
);

create table if not exists public.travel_bands (
  id serial primary key,
  season_id int not null references public.seasons(id) on delete cascade,
  code text not null,                   -- '0' (yolsız) ... ayrı değil; yalnız 6 kademe
  label text not null,                  -- '0–20 km'
  min_km int, max_km int,               -- 200+ için max_km null
  fee numeric(10,2) not null,
  unique (season_id, code)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id int not null references public.seasons(id),
  match_date date not null,
  category_id int not null references public.fee_categories(id),
  role text not null check (role in ('referee','assistant','fourth')),
  venue text not null check (venue in ('home','away')),
  second_same_day boolean not null default false,
  travel_band_id int references public.travel_bands(id),   -- null → yol ücreti yok
  match_fee numeric(10,2) not null,                         -- maç anında kopya
  harcirah numeric(10,2) not null,
  travel_fee numeric(10,2) not null,
  note text,                                                -- (opsiyonel, güvenli)
  created_at timestamptz not null default now()
);

create index if not exists matches_user_date_idx on public.matches(user_id, match_date);
create index if not exists fee_categories_season_idx on public.fee_categories(season_id);
create index if not exists travel_bands_season_idx on public.travel_bands(season_id);

-- ============ YENİ KULLANICI TETİKLEYİCİSİ ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := lower(trim(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))));
  insert into public.profiles (id, username) values (new.id, uname)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ KULLANICI ADI → E-POSTA (güvenlikli RPC) ============
-- Yalnız e-posta döner; kayıt kullanıcı adlarının geçerliliğin anlaşılması için kullanılamaz.
create or replace function public.get_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result_email text;
begin
  select u.email into result_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(trim(p_username))
  limit 1;
  return result_email;
end;
$$;

revoke all on function public.get_email_by_username(text) from public;
grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- ============ RLS ============
alter table public.profiles       enable row level security;
alter table public.seasons        enable row level security;
alter table public.fee_categories enable row level security;
alter table public.travel_bands   enable row level security;
alter table public.matches        enable row level security;

-- profiles: yalnız kendi satırı
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select using (auth.uid() = id);
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- seasons / fee_categories / travel_bands: herkes okur, yalnız admin değiştirir
drop policy if exists seasons_read on public.seasons;
create policy seasons_read on public.seasons for select using (true);
drop policy if exists seasons_admin on public.seasons;
create policy seasons_admin on public.seasons for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
);

drop policy if exists fee_categories_read on public.fee_categories;
create policy fee_categories_read on public.fee_categories for select using (true);
drop policy if exists fee_categories_admin on public.fee_categories;
create policy fee_categories_admin on public.fee_categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
);

drop policy if exists travel_bands_read on public.travel_bands;
create policy travel_bands_read on public.travel_bands for select using (true);
drop policy if exists travel_bands_admin on public.travel_bands;
create policy travel_bands_admin on public.travel_bands for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin)
);

-- matches: yalnız sahibi CRUD
drop policy if exists matches_own_select on public.matches;
create policy matches_own_select on public.matches for select using (auth.uid() = user_id);
drop policy if exists matches_own_insert on public.matches;
create policy matches_own_insert on public.matches for insert with check (auth.uid() = user_id);
drop policy if exists matches_own_update on public.matches;
create policy matches_own_update on public.matches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists matches_own_delete on public.matches;
create policy matches_own_delete on public.matches for delete using (auth.uid() = user_id);

-- ============ İLK YÖNETİCİ ============
-- Kayıt olduktan sonra çalıştırın:
--   update public.profiles set is_admin = true where username = 'KULLANICI_ADINIZ';
