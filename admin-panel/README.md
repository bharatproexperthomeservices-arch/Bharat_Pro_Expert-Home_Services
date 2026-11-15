# Bharat Pro Expert — isolated Admin Panel

This is a separate React + Vite application under `admin-panel/`. It does not import, patch, or bundle the customer website source. It connects to the existing Supabase project with the public anon/publishable key.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the same project values used by the customer website.
3. Run the SQL migration in `supabase/migrations/202611150001_admin_panel_foundation.sql` in the Supabase SQL Editor.
4. Create the first admin user in Supabase Authentication (Email provider), then bootstrap their allowlist row using the exact Auth user UUID and email:

```sql
insert into public.admin_users (user_id, email, role)
select id, email, 'super_admin'
from auth.users
where lower(email) = lower('YOUR_ADMIN_EMAIL')
on conflict (user_id) do update set email = excluded.email, role = 'super_admin';
```

5. Install and run:

```bash
cd admin-panel
npm install
npm run dev
```

## Deployment

Deploy as a separate Vercel project with **Root Directory = `admin-panel`**, Framework = Vite, Build Command = `npm run build`, Output Directory = `dist`. Add the two Supabase environment variables to that Vercel project. This keeps the customer website's existing deployment/build configuration separate.

## Included screens

- Supabase email/password login, checked against `admin_users`.
- Collapsible responsive Navy/Gold/White sidebar.
- Service records, homepage text, media URL library and coupons.
- KPI dashboard, partner approval/rejection, booking dispatch board and waitlist view.

## Important integration boundaries

- The current customer catalogue (8 categories and service cards) is authored in the customer website's `js/data.js`. This PR deliberately does not modify that file or any customer website file. The new `admin_services`, `admin_site_settings`, `admin_media`, and `admin_coupons` tables are an isolated admin content store. **Saving content here does not automatically publish it to the currently-live customer website.** A separate, explicitly approved customer-site integration is required to make the live site read these tables.
- Existing operational table shapes vary across deployments. The screens use current table records and display Supabase/RLS errors instead of silently inventing data. Partner document links are shown if document URL columns exist in partner rows. Booking assignment expects `dispatch_status` and `assigned_partner_id` from the existing partner availability/dispatch migration.
- No service-role key is used in the browser. The Supabase anon key is safe to expose only with correctly configured RLS.
- The UI checks admin membership, but database RLS is the actual authorization boundary. Never remove the policies or place a service-role key in a `VITE_*` variable.
- Run the SQL migration in staging first and review existing policies before production use. The migration adds policies but does not remove existing business tables or records.

## Scope

All files in this PR are new files under `admin-panel/`. The customer-facing website files, root package scripts, payment integrations, services, prices, packages, add-ons and booking flows are unchanged.
