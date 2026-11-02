# Bharat Pro Expert — Apartment Cleaning Website

## Current backend direction
- **Supabase only** for customer authentication and application data. Do not configure or connect Firebase for the active customer site.
- Browser builds require real `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values in the deployment environment. Placeholder values are intentionally not accepted.
- Server integrations use `SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY`. Never expose the service-role key in client variables or commit actual secrets.
- Old Firebase/Firestore examples or duplicate legacy assets are not an active integration and must not be wired into the current website.
- Supabase tables and policies must be provisioned with reviewed migrations before enabling live bookings, customer addresses, serviceability, or admin publishing.

## Responsive behavior
The responsive stylesheet is being corrected so mobile, tablet, and desktop sizes adapt automatically. Existing catalog, service items, prices, booking/payment logic, and brand assets should remain unchanged.

Only this design is allowed. No old designs, no old admin, no old Firebase. All new work is built only on this design.

## Structure
- `index.html` — main HTML template
- `css/styles.css` — iOS design system stylesheet
- `js/data.js` — 8 apartment-cleaning categories and 64 cleaning services
- `js/app.js` — routing, views, and cart/checkout logic
- `js/overrides.js` — site overrides
- `api/` — backend payment endpoints for Razorpay and Cashfree
- `server.js` — Express API and static file server

## Contacts & Branding
Support +91 89202 52647 · bharatproexpert@gmail.com · bharatproexperthomeservices@gmail.com
Brand: Bharat Pro Expert
