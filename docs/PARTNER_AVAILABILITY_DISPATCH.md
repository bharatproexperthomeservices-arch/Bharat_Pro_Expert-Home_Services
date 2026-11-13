# Partner Availability & Demand Capture — rollout notes

This change is additive. It does not drop or truncate existing customer services, packages, prices, bookings, Razorpay settings, or location/onboarding data.

## Included
- `supabase/migrations/202611130001_partner_availability_dispatch.sql`: creates the new partner, waitlist, notification tables and availability/dispatch RPCs; adds isolated dispatch metadata to bookings.
- `js/partner-availability.js`: typed client-side API wrapper for availability, waitlist submission and server-mediated dispatch.

## Required server endpoints before enabling checkout
Implement authenticated, rate-limited Vercel endpoints:
- `POST /api/notify-request`: validate payload, insert into `notify_requests` using Supabase service-role key stored only in server environment; never expose that key in browser code.
- `POST /api/dispatch-paid-booking`: verify the Razorpay payment signature/payment status server-side, then call `dispatch_paid_booking` using the service-role client. Never trust a browser-supplied "paid" flag.

## Important integration gates
1. Run the migration in a staging Supabase project first. Confirm the existing `bookings.id` type and current booking status constraints before production rollout.
2. Wire `checkPartnerAvailability(city, serviceId)` into the validated checkout submit path. If `availablePartnerCount === 0`, show the Urban Company-style bottom sheet and do not create a Razorpay order.
3. After Razorpay verification succeeds, call the server dispatch endpoint. If no matching partner is available, preserve the paid booking and set it to a dispatch-pending/manual-follow-up state; never lose a paid order.
4. Add the Admin Demand/Waitlist route using an authenticated admin server endpoint. The current localStorage admin gate is not sufficient authorization for privileged waitlist reads or SMS/WhatsApp sends.
5. "Notify Waitlist" must call a real SMS/WhatsApp provider only after credentials and an approved template are configured. Until then, expose it as a clearly labelled simulation and do not claim a message was sent.

## Security
- The service-role key belongs only in server-side environment variables.
- New waitlist writes and partner notifications are blocked from direct anonymous/authenticated table writes by RLS.
- The dispatch RPC is revoked from browser roles and must be called from a trusted server.
- Availability RPC is read-only and executable by authenticated users.

## Existing data safety
No `DROP TABLE`, `TRUNCATE`, bulk rewrite, or destructive migration is included. Existing booking business columns remain untouched; dispatch state is stored in separate columns.
