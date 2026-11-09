# Bharat Pro Expert — Separate Admin Portal (Reserved)

This directory is intentionally isolated from the customer website deployment.

- It is a separate Vercel project/deployment with its own URL when the owner authorizes implementation.
- Do not add admin navigation, routes, bundles, widgets, or links to the public customer website.
- Do not connect this placeholder to Supabase yet.
- Do not copy or reuse the legacy admin panel or its mock authentication/API.
- When explicitly requested, implement the admin portal here and connect it to the shared Supabase project using server-side authorization, role checks, and RLS.
- The owner will provide the implementation scope before any admin features are built.

The public site must not import files from this directory.
