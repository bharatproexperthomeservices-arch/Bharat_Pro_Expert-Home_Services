-- Additive marketplace expansion: chat, tips, wallet/referrals, surge pricing, partner earnings.
-- STRICT NON-DESTRUCTIVE POLICY: no DROP, TRUNCATE, DELETE, or rewrite of existing business records.
-- Apply to a staging Supabase project first. Existing tables/columns are preserved.

create extension if not exists pgcrypto;

-- 1) In-app chat. IDs intentionally remain unconstrained so existing customer/partner identity
-- models can be connected without assuming their current primary-key layout.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null,
  sender_id text not null,
  receiver_id text not null,
  message_text text not null check (char_length(message_text) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists messages_booking_created_idx on public.messages(booking_id, created_at);
create index if not exists messages_sender_created_idx on public.messages(sender_id, created_at desc);
create index if not exists messages_receiver_created_idx on public.messages(receiver_id, created_at desc);
alter table public.messages enable row level security;
-- No direct client INSERT policy: message authorization is enforced by the trusted API.
drop policy if exists "Participants read booking messages" on public.messages;
create policy "Participants read booking messages" on public.messages
for select to authenticated using (
  sender_id = auth.uid()::text or receiver_id = auth.uid()::text
);

-- Enable realtime if the publication exists; safe to re-run.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      execute 'alter publication supabase_realtime add table public.messages';
    end if;
  end if;
end $$;

-- 2) Wallet and immutable transaction history.
-- Extend the existing public.users table only when it exists; do not create a competing users table.
do $$
begin
  if to_regclass('public.users') is not null then
    execute 'alter table public.users add column if not exists wallet_balance numeric(12,2) not null default 0';
    execute 'alter table public.users add column if not exists referral_code text';
    execute 'create unique index if not exists users_referral_code_uidx on public.users(referral_code) where referral_code is not null';
  end if;
end $$;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('CREDIT','DEBIT')),
  description text not null,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_created_idx on public.transactions(user_id, created_at desc);
alter table public.transactions enable row level security;
drop policy if exists "Users read own wallet transactions" on public.transactions;
create policy "Users read own wallet transactions" on public.transactions
for select to authenticated using (user_id = auth.uid()::text);

-- 3) City/time/service surge rules.
create table if not exists public.surge_rules (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  start_time time not null,
  end_time time not null,
  multiplier numeric(5,2) not null check (multiplier >= 1 and multiplier <= 5),
  service_category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time <> end_time)
);
create index if not exists surge_rules_lookup_idx on public.surge_rules(lower(city), is_active, service_category);
alter table public.surge_rules enable row level security;
drop policy if exists "Active surge rules readable" on public.surge_rules;
create policy "Active surge rules readable" on public.surge_rules
for select to authenticated using (is_active = true);

-- 4) Partner earnings and assignment acceptance metadata.
create table if not exists public.partner_earnings (
  id uuid primary key default gen_random_uuid(),
  partner_id text not null,
  booking_id text not null,
  base_amount numeric(12,2) not null default 0,
  tip_amount numeric(12,2) not null default 0,
  commission numeric(12,2) not null default 0,
  net_earning numeric(12,2) not null,
  settlement_reference text,
  created_at timestamptz not null default now(),
  unique (booking_id)
);
create index if not exists partner_earnings_partner_created_idx on public.partner_earnings(partner_id, created_at desc);

do $$
begin
  if to_regclass('public.bookings') is not null then
    execute 'alter table public.bookings add column if not exists assignment_timeout timestamptz';
    execute 'alter table public.bookings add column if not exists rating smallint';
    execute 'alter table public.bookings add column if not exists tip_amount numeric(12,2) not null default 0';
  end if;
end $$;

-- Fairness events are additive and do not alter the existing partner score/ledger schema.
create table if not exists public.partner_fairness_events (
  id uuid primary key default gen_random_uuid(),
  partner_id text not null,
  booking_id text not null,
  penalty_points numeric(8,2) not null default 1,
  reason text not null default 'ASSIGNMENT_TIMEOUT',
  created_at timestamptz not null default now(),
  unique (partner_id, booking_id, reason)
);

-- Earnings rows are inserted idempotently by the settlement server workflow.
-- This table does not replace or mutate an existing double-entry ledger.
