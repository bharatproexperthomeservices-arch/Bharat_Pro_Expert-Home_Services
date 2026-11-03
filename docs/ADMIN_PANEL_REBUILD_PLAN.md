# Bharat Pro Expert — Admin Operations Rebuild Plan

## Scope and guardrails
Build a first-party operations console for Bharat Pro Expert Home Services. Use common operations patterns (request queue, partner profile, availability calendar, booking detail and audit history) without copying Urban Company branding, source code, exact screen design, or proprietary assets.

Keep the customer catalogue, service/package/add-on IDs, existing prices, booking/payment business rules and customer-facing content unchanged unless separately approved. Admin portal work must not alter production records or deploy automatically.

## Required modules
1. Overview: live booking counts by status, daily job pipeline, partner availability, pending approvals, cancellations and payment reconciliation alerts.
2. Request queue: searchable/filterable booking list, request detail, service/package/questionnaire snapshot, customer contact/address with least-privilege visibility, requested schedule, payment state, event history.
3. Booking operations: safe assignment/reassignment, status transitions, cancellation/reschedule policy, notes and notification outbox. Require confirmation for consequential actions.
4. Partners: applications, profile, skill/service-area coverage, document/KYC review, approval/suspension, schedule and job history. Restrict access to identity documents.
5. Calendar: week/day/month views; working/job/leave/training states; collision prevention and timezone handling; availability is backed by database records.
6. Catalogue (read first): services, packages, add-ons, prices and publication history. Protect existing catalogue with baseline export/hash and review any mutation.
7. CMS: hero banners, seasonal campaigns, editable page sections, drafts, preview, publish/rollback and audit history.
8. Finance: Cashfree order/payment state, refunds only via verified authorized workflow, reconciliation and export. Never accept browser-reported payment success.
9. Admin access: Supabase Auth, allow-listed admin membership and role/permission checks; roles such as owner, operations, partner reviewer, support, finance and content editor.
10. Audit/reports/settings: append-only actor/action/target/time records, filtered reports and operational configuration.

## Required backend trust boundaries
- The browser must not have a service-role key or trusted admin bearer token.
- Validate Supabase access tokens server-side and authorize each operation from persisted admin membership/permissions.
- Every query and mutation is server-authorized; enforce database RLS as defense in depth.
- Use explicit allowed status-transition maps and optimistic concurrency/idempotency for booking assignment and payment-related operations.
- Keep admin changes in durable database tables, not in-memory mock responses.
- Log sensitive actions without logging OTPs, passwords, secrets, or full payment credentials.
- Use a transactional/outbox pattern for notifications and operations needing reliable follow-through.
- Payment status comes from server-verified Cashfree order/payment state and signed/validated webhook events; browser callbacks are not proof.
- Add rate limits, CSRF/origin protections where applicable, input validation, safe error responses and security tests.

## Suggested data model (adapt only after schema audit)
- admin_memberships (auth user ID, role, active flag)
- admin_permissions / role_permissions
- partners, partner_documents (private storage), partner_skills, partner_service_areas
- partner_availability, partner_time_off, partner_assignments
- bookings (reuse canonical existing table; do not create a conflicting duplicate)
- booking_events, booking_notes, notification_outbox
- payment_orders / payment_events (reuse verified canonical payment references)
- cms_pages, cms_revisions, cms_publications
- catalogue records (reuse canonical existing service/package/add-on records)
- admin_audit_log

## Delivery gates
Phase 0: inventory routes, source, deployed project linkage, Supabase schema/RLS, env var names and existing customer/admin flows. Export/compare current catalogue and booking schema.
Phase 1: establish dedicated admin entry and responsive shell, sign-in and authorization. No fake admin data or mock login.
Phase 2: implement read-only live dashboard, booking queue/detail, partners and calendar using audited schemas.
Phase 3: add tested controlled mutations, approvals, assignment and availability.
Phase 4: CMS/catalogue editor with drafts, preview, permissions, audit and rollback.
Phase 5: Cashfree reconciliation, reports, operational hardening and end-to-end testing.
Release: preview only, user review, explicit approval, then planned deployment.

## Acceptance tests
- Unauthenticated, expired, non-admin and wrong-role requests are denied server-side.
- Admin data is not exposed through public/customer endpoints.
- Booking assignment rejects unavailable/conflicting partners and duplicate retries.
- Status transitions reject invalid transitions and retain immutable event history.
- Calendar uses correct timezone and prevents conflicting jobs/time off.
- Content draft/publish/rollback persists and creates audit entries.
- Payment state is independently verified; failed booking persistence is recoverable/reconciled.
- Catalogue IDs, prices, packages, add-ons and customer checkout behavior match the baseline.
- Verify real OTP, Cashfree sandbox, desktop/tablet/mobile layout, and critical booking journey before release.

## Destructive cleanup policy
Removing Firebase references from a source branch does not delete Firebase Console projects, Auth users, Firestore documents, Storage objects, or deployed environment variables. Do not delete any Firebase project or data until exact project IDs, dependencies, backups/exports, and rollback ownership are confirmed. Project deletion is a separate irreversible operator action.
