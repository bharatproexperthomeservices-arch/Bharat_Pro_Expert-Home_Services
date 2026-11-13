-- Partner availability, demand capture and dispatch foundation.
-- Additive only: does not drop or rewrite services, packages, prices, bookings or existing auth data.
-- Apply in Supabase SQL Editor after reviewing the existing bookings schema.

create extension if not exists pgcrypto;

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null,
  city text not null,
  pincode text,
  skill_ids text[] not null default '{}',
  status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','INACTIVE','SUSPENDED')),
  availability_status text not null default 'AVAILABLE' check (availability_status in ('AVAILABLE','BUSY','OFFLINE')),
  rating numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  jobs_completed integer not null default 0 check (jobs_completed >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing deployments may already have a Prisma-backed partners table. Add only
-- the dispatch fields needed by this feature; preserve all existing partner columns.
alter table public.partners
  add column if not exists auth_user_id uuid,
  add column if not exists full_name text,
  add column if not exists pincode text,
  add column if not exists skill_ids text[] not null default '{}',
  add column if not exists availability_status text not null default 'AVAILABLE',
  add column if not exists jobs_completed integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

do $
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='partners' and column_name='name') then
    execute 'update public.partners set full_name = coalesce(nullif(full_name, ''''), name) where full_name is null or full_name = ''''';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='partners' and column_name='skill') then
    execute 'update public.partners set skill_ids = array[skill] where cardinality(skill_ids) = 0 and skill is not null';
  end if;
end $;

update public.partners set full_name = coalesce(nullif(full_name, ''), 'Partner') where full_name is null or full_name = '';
create unique index if not exists partners_auth_user_id_uidx on public.partners(auth_user_id) where auth_user_id is not null;

create index if not exists partners_city_status_availability_idx
  on public.partners (lower(city), status, availability_status);
create index if not exists partners_skill_ids_gin_idx on public.partners using gin (skill_ids);

create table if not exists public.notify_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  city text not null,
  pincode text not null,
  service_id text not null,
  status text not null default 'PENDING' check (status in ('PENDING','NOTIFIED','BOOKED','CANCELLED')),
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  notification_channel text,
  notification_reference text
);

create index if not exists notify_requests_city_pincode_status_idx
  on public.notify_requests (lower(city), pincode, status, created_at desc);

create table if not exists public.partner_notifications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  booking_id text not null,
  message text not null,
  notification_type text not null default 'JOB_ASSIGNED',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists partner_notifications_partner_created_idx
  on public.partner_notifications (partner_id, created_at desc);

-- Keep dispatch metadata separate from business booking fields to avoid changing existing booking data.
alter table if exists public.bookings
  add column if not exists dispatch_status text not null default 'UNASSIGNED',
  add column if not exists assigned_partner_id uuid references public.partners(id) on delete set null,
  add column if not exists assigned_at timestamptz;

create or replace function public.check_partner_availability(p_city text, p_service_id text)
returns table (active_partner_count bigint, available_partner_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where upper(p.status) in ('ACTIVE','APPROVED')) as active_partner_count,
    count(*) filter (
      where p.status = 'ACTIVE'
        and p.availability_status = 'AVAILABLE'
        and (cardinality(p.skill_ids) = 0 or p_service_id = any(p.skill_ids))
    ) as available_partner_count
  from public.partners p
  where lower(trim(p.city)) = lower(trim(p_city));
$$;

-- Call only from a trusted server after Razorpay signature/payment verification.
-- Uses row locking to prevent assigning the same partner to concurrent jobs.
create or replace function public.dispatch_paid_booking(p_booking_id text, p_city text, p_service_id text, p_customer_address text)
returns table (assigned boolean, partner_id uuid, partner_name text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner public.partners%rowtype;
begin
  select * into v_partner
  from public.partners p
  where lower(trim(p.city)) = lower(trim(p_city))
    and p.status = 'ACTIVE'
    and p.availability_status = 'AVAILABLE'
    and (cardinality(p.skill_ids) = 0 or p_service_id = any(p.skill_ids))
  order by p.rating desc, p.jobs_completed desc, p.created_at asc
  for update skip locked
  limit 1;

  if not found then
    return query select false, null::uuid, null::text, 'NO_AVAILABLE_MATCH'::text;
    return;
  end if;

  update public.partners
     set availability_status = 'BUSY', updated_at = now()
   where id = v_partner.id;

  update public.bookings
     set dispatch_status = 'ASSIGNED',
         assigned_partner_id = v_partner.id,
         assigned_at = now()
   where id::text = p_booking_id;

  insert into public.partner_notifications(partner_id, booking_id, message)
  values (v_partner.id, p_booking_id, 'New Job Assigned: ' || coalesce(nullif(trim(p_customer_address), ''), 'Customer address available in booking details'));

  return query select true, v_partner.id, v_partner.full_name, 'ASSIGNED'::text;
end;
$$;

-- RLS is enabled for all new tables. Access is granted through narrowly-scoped policies.
alter table public.partners enable row level security;
alter table public.notify_requests enable row level security;
alter table public.partner_notifications enable row level security;

drop policy if exists "Partners can view own profile" on public.partners;
create policy "Partners can view own profile" on public.partners
  for select to authenticated using (auth_user_id = auth.uid());

drop policy if exists "Partners can view own notifications" on public.partner_notifications;
create policy "Partners can view own notifications" on public.partner_notifications
  for select to authenticated using (
    exists (select 1 from public.partners p where p.id = partner_id and p.auth_user_id = auth.uid())
  );

-- Demand submissions and waitlist notifications are server-mediated; no public table writes.
revoke all on public.notify_requests from anon, authenticated;
revoke all on public.partner_notifications from anon, authenticated;
revoke all on function public.dispatch_paid_booking(text,text,text,text) from public, anon, authenticated;
revoke all on function public.check_partner_availability(text,text) from public, anon;
grant execute on function public.check_partner_availability(text,text) to authenticated;
