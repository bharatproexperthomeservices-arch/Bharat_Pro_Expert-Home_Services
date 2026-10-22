# Super Admin Hardening — Audit and Delivery Plan

## Scope and safety
This work is being developed on `feat/super-admin-hardening`. Do not remove the current customer site, booking flow, authentication, payment handlers, or existing admin modules until replacement workflows have been tested and a rollback is available.

## Confirmed repository architecture (initial source inspection)
- The root application is a Vite/React application. Root `package.json` builds with `npm run build`, and root `vercel.json` publishes `dist` with an SPA rewrite to `index.html`.
- The current customer entry is wired through `src/App.tsx`; the Admin Dashboard is `src/components/AdminDashboard.tsx`.
- The current admin already has modules for bookings, dispatch, hubs/map, catalogue, pricing, partner management, quality/training, inventory, customer/CMS, governance/audit, finance, AI developer, automation, and task queue.
- The Admin Dashboard loads bookings, partners, WhatsApp logs, services, hubs, and admin requests through existing service functions.
- The current Admin Dashboard's `handleAuditLog` writes to browser console only; this is not a durable server-side audit trail.
- `src/services/dbService.ts` includes localStorage fallback paths and seeds local defaults. Production readiness must verify Firestore rules, server authorization, persistence semantics, and data migration before relying on any admin write.
- The root Vercel configuration does not independently deploy the `admin-app/` folder. The root app is the current deployment target.

## Work added in this branch
- Added `src/components/admin/AdminSystemReadiness.tsx`, a read-only release-gate view that reports records loaded by the current Admin session and clearly labels provider/security checks as unverified.
- Integrated that view into the existing Governance tab without removing existing governance tools.
- This panel deliberately does not pretend to verify external payment, maps, backup, or deployment providers without authenticated server-side checks.

## Release gates still required before claiming production-ready
1. Run `npm install`, `npm run build`, and the available type/lint checks in a real project environment; resolve all errors.
2. Review Admin authentication/session handling, verify owner/role enforcement on the server, and test unauthorised access with separate accounts.
3. Audit Firestore Security Rules and test customer/partner/hub-manager/admin access boundaries.
4. Replace console-only audit logging with a protected, durable audit collection/API; capture actor, action, target, timestamp, result, and correlation ID. Prevent client-forged audit events.
5. Verify payment order creation, provider signature validation, webhooks, idempotency, refunds, and reconciliation server-side. Never expose payment secrets in browser bundles.
6. Verify hub geofencing and dispatch constraints on the server; test edge cases and concurrent assignments.
7. Verify CMS draft/publish, price snapshots, booking immutability, and recovery/rollback behavior.
8. Test backup creation and restoration, logs, alerts, and operational failure modes.
9. Confirm Vercel project/root directory, build logs, environment variables, domains, and preview deployment. Deploy to production only after passing checks and reviewing the diff.
10. Expand the remaining modules incrementally with real backend workflows and automated tests; a navigation item or visual screen alone is not a completed module.

## Current status
This branch contains an initial, additive Admin readiness feature. It is not a claim that all 73 modules, integrations, security reviews, tests, or production deployment are complete.


## Audit findings from the next source review (2026-10-22)

These are source-code findings, not claims that an exploit or live production failure was observed.

### Critical — Admin credential is embedded in browser-delivered source
- `src/services/adminAuthService.ts` contains a hard-coded master passphrase and compares user input against it in client-side code.
- `getRegisteredAdmins()` also returns a passphrase as part of a client-side account object.
- Browser-delivered credentials cannot be treated as secret. A safe fix must move verification to a trusted server/identity provider and avoid locking out the legitimate owner during migration. Do not merely replace this value with a `VITE_` variable; that would still expose it.
- Until that migration is complete, treat the existing credential as exposed and rotate it through a secure server-side flow.

### High — Payment gateway scope does not match the requested Cashfree integration
- The root API files currently use Razorpay (`api/create-order.js`, `api/verify-payment.js`) and environment variables named `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
- A repository search did not find a Cashfree implementation in the default branch. Cashfree must be implemented as a separate, server-side provider flow, with sandbox tests and webhook/signature verification before switching production traffic.
- Do not place any Cashfree secret in browser code or commit it to GitHub.

### High — Firestore rules need emulator-backed negative tests
- `firestore.rules` allows any authenticated user to read and write `otp_verifications`; this should be narrowed to a trusted server-only verification flow.
- Admin access is based on a client-visible Firestore document lookup; confirm that users cannot create or modify their own `admins/{uid}` authorization document under the deployed rules.
- Several collection rules use broad authenticated reads or writes. Build an explicit collection-by-collection access matrix and test allowed and denied cases with the Firebase Emulator before tightening rules in production.

### High — Admin audit events are not durable
- `AdminDashboard.tsx` currently writes audit information to `console.log`. This is not a protected, durable audit trail and must be replaced by a trusted backend write with actor/action/target/timestamp and authorization checks.

### Validation evidence
- For commit `e636dcd34701185e35c6e86d09ac07487f060c7e`, GitHub Actions reported the TypeScript validation and production build job as successful, and the Vercel Preview Comments check as successful.
- These checks validate the current build workflow only; they do not prove live Firebase permissions, real payment capture, Cashfree readiness, or production deployment health.


### Follow-up fix (2026-10-22)
- Removed the hard-coded Razorpay live Key ID fallback from `src/services/razorpayService.ts`. Checkout now requires `VITE_RAZORPAY_KEY_ID` to be configured at build/deployment time and returns a clear missing-configuration error rather than silently using a repository-embedded live identifier.
- This change was committed to `feat/super-admin-hardening` as `23ac1936e0260b520faff9e2f57195b8fab87b9d`.
- The latest confirmed successful CI runs were for the prior documentation commit; the new payment-key change still needs its own CI run verified.
- Admin authentication remains a separate unresolved security issue. Do not treat this branch as production-ready until the browser-side passphrase and OTP flow are migrated to trusted server-side verification and regression-tested.
