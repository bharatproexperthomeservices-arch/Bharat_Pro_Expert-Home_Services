-- Isolated Admin Panel foundation. Additive only; no customer tables are dropped or rewritten.
-- Run this migration in the SAME Supabase project used by the customer website.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin','super_admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_bpe_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users a where a.user_id = auth.uid());
$$;
revoke all on function public.is_bpe_admin() from public, anon;
grant execute on function public.is_bpe_admin() to authenticated;

alter table public.admin_users enable row level security;
drop policy if exists "Admins can read own admin record" on public.admin_users;
create policy "Admins can read own admin record" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

create table if not exists public.admin_services (
  id uuid primary key default gen_random_uuid(),
  category_id text not null check (category_id in ('deep','bath','kitchen','sofa','appl','floor','dust','special')),
  title text not null,
  image_url text,
  price numeric(12,2) not null default 0,
  strike_price numeric(12,2),
  duration integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists admin_services_category_idx on public.admin_services(category_id);

create table if not exists public.admin_site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_media (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null default '',
  discount_type text not null check (discount_type in ('flat','percent')),
  value numeric(12,2) not null check (value > 0),
  minimum_order numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_services enable row level security;
alter table public.admin_site_settings enable row level security;
alter table public.admin_media enable row level security;
alter table public.admin_coupons enable row level security;

drop policy if exists "BPE admins manage admin services" on public.admin_services;
create policy "BPE admins manage admin services" on public.admin_services for all to authenticated using (public.is_bpe_admin()) with check (public.is_bpe_admin());
drop policy if exists "BPE admins manage site settings" on public.admin_site_settings;
create policy "BPE admins manage site settings" on public.admin_site_settings for all to authenticated using (public.is_bpe_admin()) with check (public.is_bpe_admin());
drop policy if exists "BPE admins manage media" on public.admin_media;
create policy "BPE admins manage media" on public.admin_media for all to authenticated using (public.is_bpe_admin()) with check (public.is_bpe_admin());
drop policy if exists "BPE admins manage coupons" on public.admin_coupons;
create policy "BPE admins manage coupons" on public.admin_coupons for all to authenticated using (public.is_bpe_admin()) with check (public.is_bpe_admin());

-- Add admin-only policies to the existing operational tables when they exist.
-- Existing policies remain in place; these policies only add the admin path.
do $$
begin
  if to_regclass('public.bookings') is not null then
    execute 'alter table public.bookings enable row level security';
    execute 'drop policy if exists "BPE admins manage bookings" on public.bookings';
    execute 'create policy "BPE admins manage bookings" on public.bookings for all to authenticated using (public.is_bpe_admin()) with check (public.is_bpe_admin())';
  end if;
  if to_regclass('public.partners') is not null then
    execute 'alter table public.partners enable row level security';
    execute 'drop policy if exists "BPE admins manage partners" on public.partners';
    execute 'create policy "BPE admins manage partners" on public.partners for all to authenticated using (public.is_bpe_admin()) with check (public.is_bpe_admin())';
  end if;
  if to_regclass('public.notify_requests') is not null then
    execute 'alter table public.notify_requests enable row level security';
    execute 'drop policy if exists "BPE admins read waitlist" on public.notify_requests';
    execute 'create policy "BPE admins read waitlist" on public.notify_requests for select to authenticated using (public.is_bpe_admin())';
    execute 'drop policy if exists "BPE admins update waitlist" on public.notify_requests';
    execute 'create policy "BPE admins update waitlist" on public.notify_requests for update to authenticated using (public.is_bpe_admin()) with check (public.is_bpe_admin())';
  end if;
end $$;

grant select, insert, update, delete on public.admin_services, public.admin_site_settings, public.admin_media, public.admin_coupons to authenticated;
grant select, update on public.bookings, public.partners to authenticated;
