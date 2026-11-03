# Admin portal first-run setup (review branch)

## What exists in this milestone
- Separate responsive portal assets at `/admin` (static entry: `public/admin/index.html`).
- Supabase email/password sign-in, then server-verified admin session.
- The server authorizes a user only if the Supabase Auth user ID has an active `public.admin_memberships` row.
- Express endpoint: `GET /api/admin/session`; Vercel function endpoint: `GET /api/admin/session`.
- All booking, partner, finance, content and catalogue operations remain disabled until schema/RLS and permissions are reviewed. The page intentionally has no demo records.

## Before using the preview
1. Confirm the exact Supabase project URL is the existing intended customer backend. This option uses one shared Supabase project, not a second project.
2. Configure Vercel's public build variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (only a publishable/anon key belongs in the browser).
3. Configure server-only `SUPABASE_SERVICE_ROLE_KEY` in Vercel Functions. `SUPABASE_URL` may be set server-side too. Never use a `VITE_` prefix for the service role key.
4. Apply `supabase/migrations/202611030001_admin_memberships.sql` only after reviewing it against the intended project. It creates only the admin allow-list table; it does not modify bookings or catalogue tables.
5. In Supabase Auth, create an administrator account and enable email/password provider according to your organization's policy. Use a strong unique password and MFA where supported by your configuration.
6. Retrieve the created Auth user's UUID from the trusted Supabase dashboard. Through an authorized SQL/admin session, add exactly the approved operator:
   ```sql
   insert into public.admin_memberships (auth_user_id, role, active)
   values ('REPLACE_WITH_VERIFIED_AUTH_USER_UUID', 'owner', true);
   ```
   Use a role narrowly appropriate to the operator. Do not insert a guessed UUID or make all registered users admins.
7. Use only an explicitly authorized preview deployment to verify login and that a normal customer account is denied. Do not merge or promote this branch without owner approval.

## Known implementation boundary
This milestone authenticates and authorizes the portal entry only. The console reports no fake counts or fake actions. Admin modules must next be built against inspected real schemas and RLS rules, with API authorization on every operation, tests and audit records. Payment/booking linkage, refund paths, KYC data and financial adjustments need separate controls and tests.

## Release safety
- Do not delete any Firebase projects or legacy customer records as part of this UI milestone.
- No production deployment or main-branch merge is approved by this change.
- The configured Vercel build output is `dist`; static portal files are duplicated under `public/admin` so Vite emits them. Root `admin/` copies are authoring mirrors only.
