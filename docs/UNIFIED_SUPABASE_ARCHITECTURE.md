# Bharat Pro Expert — Unified Four-Client Architecture

## Workspace layout

- Public customer website / web app: existing repository root; deployed on Vercel.
- Customer Android app: `apps/customer-android/`; separate Android build and Play Store release.
- Delivery Partner Android app: `apps/partner-android/`; separate Android build and Play Store release.
- Admin portal: `apps/admin-portal/`; isolated source and separate Vercel deployment URL, intentionally reserved and not implemented or connected yet.

These are four client applications in one source repository/workspace, not four Supabase projects.

## Shared backend

One Supabase project is the common backend for all clients:
- Supabase Auth: Google OAuth and phone OTP sign-up/sign-in.
- PostgreSQL: shared users/profiles, roles, catalogue, service packages, add-ons, bookings, partner assignments and related operational data.
- Storage: only approved shared assets/documents, with private buckets and policies where needed.
- Edge Functions/server APIs: privileged operations, payment verification, webhooks and sensitive workflows.
- Row Level Security: customers see only their own records; partners see only authorized partner records; admin privileges are granted only to verified admin roles.

Never expose the Supabase service-role key in browser or Android applications. Public clients use only the publishable/anon key. Privileged work runs server-side.

## Authentication

Google login and phone OTP are intended for customer and partner clients and the website. Supabase provider configuration, redirect allowlists, SMS provider/template, OTP limits and production credentials must be configured in the Supabase project before these flows can be considered live.

## Deployment

- Main Vercel deployment: repository root, customer website/web app only.
- Admin portal: separate Vercel project with Root Directory `apps/admin-portal`, separate domain/URL. It is a placeholder until the owner authorizes its implementation.
- Android apps: independent signed Android builds and Play Store submissions; they share the backend but are not deployed by Vercel.

A Vercel deployment does not create/configure Supabase credentials or Android Play Store releases automatically.

## Migration and safety rules

- Do not delete production data, Firebase projects, tables, payment integrations, catalogue entries, packages, add-ons or booking records as part of scaffolding.
- Do not route the public website to the legacy admin UI/API.
- The legacy admin router contains mock authentication/placeholder responses and must not be treated as a production admin system.
- Before retiring legacy admin code, audit every import/route/reference and preserve any non-admin customer functionality.
- Create reviewed, additive Supabase migrations; back up and map existing data before any migration.
- Preserve all existing services, packages, prices, add-ons, customer booking flow and payment behavior.
- Do not merge to production or deploy without the owner's explicit approval.

## Current implementation status

This commit establishes the workspace boundaries and architecture documentation only. It does not provision a Supabase project, set secrets, complete database migrations, configure Google/SMS providers, build Android binaries, or activate the admin portal.
