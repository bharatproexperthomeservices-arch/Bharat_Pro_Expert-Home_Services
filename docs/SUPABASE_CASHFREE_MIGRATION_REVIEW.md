# Supabase / Phone OTP / Cashfree Migration — Review Notes

## Requested release choices
- Customer authentication: phone OTP only, using Supabase Auth.
- Payment provider: Cashfree only.
- Active app data/backend direction: Supabase.
- Release boundary: review branch only; do not merge or deploy without owner approval.

## Changes in this branch
- Corrected the customer OTP verification call to pass the entered phone number and the six-digit OTP.
- Replaced the app logout handler's obsolete Firebase function call with Supabase sign-out.
- Removed Google login from the active login form/action and deleted the old Google redirect handling.
- Updated the login status copy to identify Supabase as the OTP provider.
- Changed payment order creation to require Cashfree server credentials and removed Razorpay order creation from this endpoint.
- Restricted the payment verification endpoint to Cashfree.
- Added the Cashfree JS checkout SDK to the page and wired the checkout result to server-side payment-status verification before the booking finalization function is called.
- Changed location initialization so the three-step location onboarding runs on each page refresh. The previously confirmed location is loaded for display while fresh GPS lookup is started.
- Removed legacy Firebase config/rules and stale public JS mirrors which duplicated the root app module paths and contained Firebase-era auth code.

## Findings requiring follow-up before production
1. **Admin security is not production-ready:** current admin API uses a known mock bearer token and placeholder/in-memory endpoints. Replace with Supabase Auth JWT verification plus role/permission enforcement and persisted admin actions before enabling privileged actions.
2. **Database and RLS must be reviewed:** validate ownership policies for bookings, addresses, customer profile, payment references, partner records and any CMS data. Never enable broad public writes or expose service credentials in browser code.
3. **Booking/payment reconciliation:** current client finalization stores the booking after payment verification. Add a trusted server-side, idempotent payment-to-booking record path and reconciliation for successful payment with failed booking persistence, before live launch.
4. **Customer booking ownership:** server endpoints should authenticate the Supabase JWT and bind customer identity to the booking rather than relying on browser-submitted fields.
5. **Cashfree settings:** configure CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV (sandbox first/production only after approval), and PUBLIC_APP_URL on the server deployment. Keep secrets server-only. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or Supabase's supported publishable key) are browser configuration, not secret keys.
6. **Supabase SMS:** configure an approved SMS provider, phone OTP limits and redirect/site settings. An app-side code patch alone cannot prove delivery.
7. **Live location:** browser geolocation needs HTTPS and user permission; a readable address depends on the reverse-geocode API. Check serviceability for newly selected locations before booking. The configured target for the splash is short, but GPS/network delay is outside the site's guarantee.
8. **Regression scope:** preserve catalog/services/prices/add-ons and verify all business copy and payment calculation fixtures against the baseline.

## Validation status
- Static source changes were made using exact targeted edits against the reviewed main-branch files.
- CI lint/build, full automated tests, live Supabase Auth, live GPS/reverse geocoding, Cashfree sandbox checkout, payment webhook/reconciliation, and responsive browser/device tests are **not yet confirmed** by this note.
- A successful build or CI run is not a substitute for provider-backed end-to-end verification.
- Do not merge or deploy based on this document alone.
