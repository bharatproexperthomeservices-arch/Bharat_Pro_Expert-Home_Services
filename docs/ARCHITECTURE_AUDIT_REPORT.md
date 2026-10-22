# BHARAT PRO EXPERT HOME SERVICES — ARCHITECTURE AUDIT REPORT & 73-MODULE MASTER INTEGRATION PLAN

**Project Name**: Bharat Pro Expert Home Services
**Live Platform**: https://www.bharatproexpert.com
**Firebase Project ID**: `bharatproexpert-homeservices`
**Shared Apps**: Customer Website (Web), Customer App (Android), Partner App (Android), Super Admin Web Panel

---

## 1. TECH STACK & SYSTEM ARCHITECTURE AUDIT

- **Frontend Core**: Single Page Application (SPA) built with React 18, TypeScript 5.7, Tailwind CSS v4, Lucide Icons, Framer Motion, bundled via Vite 6.
- **Backend API**: Node.js Express Server (`server.js`) serving static assets and providing API endpoints:
  - `/api/create-order` (Razorpay order generation)
  - `/api/verify-payment` (HMAC SHA256 payment signature verification)
  - `/api/health` (System status)
- **Database & Auth**: Firebase Firestore (Production database) and Firebase Auth (Phone OTP + Google Sign-In) with Custom Claims role-based security.
- **Static Assets**: Vite-compiled bundle in `dist/`, raw static data scripts in `public/js/`.

---

## 2. EXISTING SERVICES, CATEGORIES, PACKAGES & PRICING INVENTORY

The customer website catalog (`src/data.ts` and `src/cleaningCategoriesData.ts`) contains the authoritative active catalogue. All prices are preserved exactly as configured:

1. **Full Home Deep Cleaning**: Base ₹2,499
   - 1 BHK: ₹2,499 | 2 BHK: ₹3,499 | 3 BHK: ₹4,499 | 4 BHK: ₹5,999
   - Included: Deep scrubbing, window/balcony cleaning, cabinet degreasing, bathroom descaling.
2. **Sofa & Upholstery Cleaning**: Base ₹799
   - 3-Seater: ₹799 | 5-Seater: ₹1,199 | 7-Seater: ₹1,599 | Recliner: ₹499/seat
   - Included: Injection-extraction vacuuming, stain removal, fabric sanitization.
3. **Bathroom Deep Cleaning**: Base ₹499
   - 1 Bathroom: ₹499 | 2 Bathrooms: ₹899 | 3 Bathrooms: ₹1,299
   - Included: Hard water stain removal, tile grouting scrubbing, mirror polishing, exhaust cleaning.
4. **Kitchen Deep Cleaning**: Base ₹1,199
   - Standard Kitchen: ₹1,199 | Modular Kitchen with Chimney: ₹1,699
   - Included: Chimney degreasing, cabinet interior/exterior, appliance wiping, countertop sanitizing.
5. **Carpet Deep Cleaning**: Base ₹599
   - Small (Up to 50 sq ft): ₹599 | Large (Up to 150 sq ft): ₹1,099
6. **Water Tank Cleaning**: Base ₹799
   - Overhead Tank (Up to 1000L): ₹799 | Underground Sump (Up to 5000L): ₹1,999

*Note: No existing prices, packages, or add-ons are modified or removed during Admin Panel provisioning.*

---

## 3. FIREBASE 360° SHARED FIRESTORE COLLECTIONS SCHEMA

All 4 platforms share one unified Firestore database schema:

### Core Operational Collections
`users`, `admins`, `roles`, `permissions`, `partners`, `partner_applications`, `partner_documents`, `partner_verifications`, `partner_profiles`, `partner_availability`, `partner_calendar`, `partner_leaves`, `partner_attendance`, `partner_jobs`, `partner_job_offers`, `partner_job_assignments`, `partner_job_status_history`, `partner_live_locations`, `partner_ratings`, `partner_reviews`, `partner_disputes`, `partner_tickets`, `partner_training`, `partner_certifications`, `partner_quality_audits`, `partner_warnings`, `partner_strikes`, `partner_suspensions`, `partner_wallet_transactions`, `partner_payouts`, `partner_incentives`, `partner_emergency_passes`, `hubs`, `hub_managers`, `zones`, `service_areas`, `pincodes`, `service_categories`, `services`, `packages`, `addons`, `bookings`, `booking_status_history`, `job_assignments`, `dispatch_queue`, `job_escalations`, `cancellations`, `no_shows`, `transactions`, `payments`, `refunds`, `coupons`, `offers`, `campaigns`, `homepage_sections`, `banners`, `sliders`, `pages`, `media`, `notifications`, `notification_campaigns`, `settings`, `website_config`, `app_config`, `seo_settings`, `forms`, `form_submissions`, `audit_logs`, `system_health`, `backups`, `integrations`.

### Advanced Master Collections (Modules 59–73)
- **Supply & Inventory (59)**: `inventory_items`, `inventory_categories`, `inventory_stock`, `inventory_orders`, `inventory_order_items`, `inventory_consumption_logs`, `inventory_reorder_alerts`, `inventory_vendors`, `inventory_purchase_orders`, `inventory_grn`, `inventory_returns`, `inventory_audit_logs`.
- **Dynamic Surge Engine (60)**: `pricing_rules`, `pricing_rule_conditions`, `pricing_rule_actions`, `surge_windows`, `surge_multipliers`, `surge_audit_logs`, `pricing_experiments`, `demand_signals`, `supply_signals`, `dynamic_price_snapshots`.
- **Loyalty & Subscriptions (61)**: `loyalty_programs`, `loyalty_tiers`, `loyalty_points_ledger`, `subscription_plans`, `subscription_plan_benefits`, `customer_subscriptions`, `subscription_billing_history`, `subscription_cancellations`, `loyalty_redemptions`, `loyalty_campaigns`.
- **Warranty & Rework (62)**: `warranty_policies`, `warranty_policy_coverage`, `rework_requests`, `rework_jobs`, `rework_assignments`, `warranty_claims`, `warranty_claim_evidence`, `warranty_settlements`, `rework_reason_codes`.
- **Fraud & Risk Scoring (63)**: `fraud_rules`, `fraud_signals`, `risk_scores`, `risk_score_history`, `fraud_alerts`, `fraud_cases`, `fraud_case_evidence`, `fraud_actions`, `velocity_checks`, `device_fingerprints`, `ip_reputation`.
- **Partner Welfare & Insurance (64)**: `insurance_providers`, `insurance_policies`, `insurance_policy_holders`, `insurance_premium_schedule`, `insurance_claims`, `insurance_claim_documents`, `insurance_claim_status_history`, `welfare_schemes`, `welfare_enrollments`, `welfare_benefit_usage`, `welfare_disbursements`.
- **Skill Matrix & Certifications (65)**: `skill_taxonomy`, `skill_categories`, `skill_levels`, `skill_prerequisites`, `partner_skills`, `partner_skill_assessments`, `partner_skill_certifications`, `brand_specializations`, `brand_certification_exams`, `certification_issuers`, `certification_renewals`.
- **Partner Referral & Recruitment (66)**: `referral_programs`, `referral_codes`, `referral_tracking`, `referral_rewards`, `referral_campaigns`, `referral_fraud_flags`, `recruitment_pipeline`, `recruitment_sources`, `recruitment_campaign_performance`.
- **Communication Audit & Moderation (67)**: `communication_channels`, `communication_messages`, `communication_attachments`, `communication_calls`, `communication_call_recordings`, `moderation_rules`, `moderation_flags`, `moderation_reviews`, `blocked_keywords`, `communication_audit_logs`, `communication_retention_policies`.
- **Regulatory Compliance Tracker (68)**: `compliance_requirements`, `compliance_requirement_templates`, `compliance_by_zone`, `partner_compliance_records`, `partner_licenses`, `license_expiry_alerts`, `compliance_audit_logs`, `compliance_inspection_reports`, `regulatory_bodies`.
- **Auto-Suspension Engine (69)**: `suspension_rules`, `suspension_rule_conditions`, `suspension_events`, `suspension_actions`, `suspension_appeals`, `suspension_reactivation_rules`, `suspension_notification_templates`.
- **Knowledge Base & SOPs (70)**: `kb_categories`, `kb_articles`, `kb_article_versions`, `kb_media`, `kb_search_logs`, `kb_feedback`, `sop_library`, `sop_sections`, `partner_community_posts`, `partner_community_comments`, `partner_community_moderation`, `partner_announcements`.
- **Predictive Analytics (71)**: `prediction_models`, `prediction_runs`, `prediction_results`, `churn_predictions`, `demand_forecasts`, `supply_forecasts`, `revenue_forecasts`, `anomaly_detections`, `model_performance_metrics`.
- **Verification Agency BGV (72)**: `verification_agencies`, `verification_agency_configs`, `verification_requests`, `verification_request_documents`, `verification_status_history`, `verification_results`, `verification_webhooks_log`, `verification_sla_tracker`.
- **Hub P&L Dashboard (73)**: `hub_financial_accounts`, `hub_revenue_entries`, `hub_cost_entries`, `hub_commission_entries`, `hub_payout_liabilities`, `hub_expense_categories`, `hub_expense_approvals`, `hub_pnl_snapshots`, `hub_budget_plans`.

---

## 4. 9-STAGE PARTNER FILTRATION FUNNEL

1. **Stage 0: Application Received** (Google Form submission → `New Lead`)
2. **Stage 1: Document Verification** (Aadhaar, PAN, Bank Details → `Pending Review`)
3. **Stage 2: Background Verification** (Third-party BGV Agency Check → `Under Verification`)
4. **Stage 3: Skill Assessment** (Theory + Practical trade test → `Assessment Pending`)
5. **Stage 4: In-Person Interview** (Communication & behavioral evaluation → `Interview Pending`)
6. **Stage 5: Training Assignment** (SOPs & Skill India Certification → `Training Pending`)
7. **Stage 6: Kit Procurement** (Mandatory cleaning gear issuance via Inventory → `Kit Pending`)
8. **Stage 7: Hub Assignment** (Geofenced 8–10 km Hub mapping → `Hub Assigned`)
9. **Stage 8: Activation** (Live on Partner App → `Active / Live`)

---

## 5. URBAN COMPANY-STYLE HUB MANAGEMENT & GEOFENCING SPECIFICATION

- **Geofence Boundary**: 8–10 KM radius circle or custom polygon geofence rendered via Google Maps API.
- **Pre-Seeded Hubs**:
  - **Gurugram**: Old Gurgaon (HUB-GGN-01), DLF & Cyber City (HUB-GGN-02), Golf Course Ext (HUB-GGN-03), New Gurgaon (HUB-GGN-04), Dwarka Exp Corridor (HUB-GGN-05), Manesar (HUB-GGN-06).
  - **Delhi**: North (DEL-01), North-West (DEL-02), West (DEL-03), South-West (DEL-04), South (DEL-05), South-East (DEL-06), Central (DEL-07), New Delhi (DEL-08), East (DEL-09), North-East (DEL-10), Shahdara (DEL-11), Outer (DEL-12).
  - **Noida**: Noida Central (NOI-01), Expressway (NOI-02), Ext / Gr Noida West (NOI-03), South Exp (NOI-04), Greater Noida (NOI-05).
  - **Bihar & Jharkhand**: Darbhanga North/South (DBG-01/02), Muzaffarpur Central/South (MUZ-01/02), Ranchi West/East (RAN-01/02), Patna Central/North/City (PAT-01/02/03).

---

## 6. FILES & FOLDERS MODIFICATION PLAN

- **Files to Add**:
  - `docs/ARCHITECTURE_AUDIT_REPORT.md` (This master report)
- **Files to Update/Enhance (Admin System)**:
  - `src/App.tsx` (Route handling and login gate mounting)
  - `src/services/dbService.ts` (Firestore operational collections CRUD)
  - `src/services/adminAuthService.ts` (Owner verification & session handling)
  - `src/components/AdminDashboard.tsx` (Super Admin module orchestrator)
  - `src/components/AdminLoginGate.tsx` (Strict Owner authentication screen)
  - `src/components/admin/AdminSidebar.tsx` (73-module collapsible sidebar)
  - `src/components/admin/AdminHubMapView.tsx` (Interactive 8-10 km hub map geofencing)
  - `src/components/admin/AdminHubOperations.tsx` (Hub management & pincode mapping)
  - `src/components/admin/AdminPartnerSuite.tsx` (9-stage partner onboarding & Partner 360)
  - `src/components/admin/AdminDispatchEngine.tsx` (Smart auto dispatch & escalation queue)
  - `src/components/admin/AdminInventorySupplies.tsx` (Module 59 SKU kit management)
  - `src/components/admin/AdminPricingEngine.tsx` (Module 60 & 61 dynamic surge pricing)
  - `src/components/admin/AdminQualityAndTraining.tsx` (Modules 62 & 65 warranty rework & skill matrix)
  - `src/components/admin/AdminGovernanceAndAudit.tsx` (Modules 63, 68, 69, 72 fraud, compliance, auto-suspension, BGV)
  - `src/components/admin/AdminFinanceAndSettlementSuite.tsx` (Modules 64 & 73 insurance claims & Hub P&L)
- **Files MUST NOT Modify (Customer Website & Booking Flow)**:
  - `src/components/home/PremiumCleaningHomeView.tsx`
  - `src/components/BookingFlowModal.tsx`
  - `src/components/ServiceDetailModal.tsx`
  - `src/components/CustomerDashboardModal.tsx`
  - `src/data.ts` & `src/cleaningCategoriesData.ts` (Prices, services, and packages remain untouched)
  - `server.js` & `api/*` (Razorpay payment gateway endpoints preserved)

---

## 7. DEPLOYMENT & TESTING CHECKLIST

1. [x] TypeScript compilation check (`npm run lint` / `tsc --noEmit`).
2. [x] Production bundle build (`npm run build` / `vite build`).
3. [x] Express backend health check (`PORT=5005 node server.js`).
4. [ ] Verify customer website loading, service selection, and Razorpay checkout flow (100% unchanged).
5. [ ] Verify Admin Login Gate restriction (`Bharatproexperthomeservices@gmail.com`).
6. [ ] Verify 73 Super Admin module navigation tabs and live Firestore sync.
7. [ ] Verify Hub geofencing map view (8–10 km boundary circles).
8. [ ] Verify 9-stage partner onboarding funnel.
