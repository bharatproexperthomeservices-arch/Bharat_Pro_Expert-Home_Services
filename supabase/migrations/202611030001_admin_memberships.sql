-- Admin identity allow-list only. Operational records and catalogues are intentionally untouched.
-- Review and apply manually in the SAME Supabase project used by the customer application.
create table if not exists public.admin_memberships (
  auth_user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null check (role in ('owner','operations','partner_reviewer','support','finance','content_editor')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.admin_memberships enable row level security;
revoke all on table public.admin_memberships from anon, authenticated;
-- No browser-facing policies are granted. The server checks membership using a secret
-- service-role credential, and must never return credentials or membership rows wholesale.
comment on table public.admin_memberships is 'Restricted allow-list for authorized operations administrators. Manage through trusted server/operator only.';
