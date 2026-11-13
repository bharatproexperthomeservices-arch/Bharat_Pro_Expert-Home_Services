# Additive features: integration contract

This branch is deliberately separate from the existing availability/dispatch PR. It adds a new migration and isolated feature modules; it does not edit current checkout, splash, location, auth, Razorpay or dispatch files.

## Feature 1 — Chat & tips
- `messages` table and Realtime publication are added by the migration.
- `js/booking-chat.js` loads/subscribes to booking messages and sends via `POST /api/chat/messages`.
- Customer/partner authorization must be checked server-side against the booking participants.
- On completion, the UI should open the rating/tip modal. The server must validate rating 1–5 and tip amount, update booking rating/tip, and post the tip through the repository's existing double-entry ledger engine with a unique idempotency key. The actual ledger engine was not located in the source inspection, so this PR does not invent or bypass it.

## Feature 2 — Wallet & referrals
- If `public.users` exists, migration adds `wallet_balance` and `referral_code`; it never creates a competing users table.
- `transactions` is an append-only history with unique idempotency key.
- `js/wallet-referrals.js` provides isolated API client and checkout calculation.
- Signup bonus and wallet debit must execute in trusted server transactions, once per referral/payment. Wallet deduction occurs only after verified Razorpay payment. The existing user primary-key/auth mapping must be confirmed before enabling endpoints.

## Feature 3 — Surge pricing
- Adds `surge_rules` with city/time/category/multiplier.
- `js/surge-pricing.js` selects the applicable active rule and calculates a quote.
- Admin CRUD and checkout display must be wired after confirming the existing admin authorization model. Server must re-check surge before order creation to prevent client price tampering.

## Feature 4 — Partner acceptance & earnings
- Adds isolated earnings and fairness-event tables plus additive booking metadata.
- Partner API endpoint contract: `GET /api/partner/jobs/active`, `GET /api/partner/earnings`, `POST /api/partner/job/accept`, `POST /api/partner/job/decline`.
- A scheduled worker/queue is required for the 60-second timeout; browser timers are not reliable. Reassignment must lock the booking and partner rows, and fairness penalty must be idempotent.
- On SETTLED, insert partner earnings once using `partner_earnings.booking_id` uniqueness. Integrate with the existing ledger/commission rules only after they are identified.

## Required before production
1. Confirm the existing `public.users` and `public.bookings` schemas and auth identity mapping in staging.
2. Implement authenticated Vercel handlers for chat, tips, wallet, referrals, surge admin CRUD and partner endpoints using server-only Supabase service credentials.
3. Connect the existing UI routes without replacing existing flows.
4. Add tests for replayed webhooks, duplicate referral claims, duplicate tip settlement, concurrent accept/timeout, and wallet underflow.
5. Run staging integration tests; this branch is a database/client foundation and is not a live or complete UI rollout.
