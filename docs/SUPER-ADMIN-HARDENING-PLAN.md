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
