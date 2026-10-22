# BHARAT PRO EXPERT HOME SERVICES — ARCHITECTURE AUDIT REPORT & MASTER INTEGRATION PLAN

**Date:** March 2025
**Project Name:** Bharat Pro Expert Home Services
**Live Website:** https://www.bharatproexpert.com
**Firebase Project ID:** `bharatproexpert-homeservices`

---

## 1. PHASE 0 ARCHITECTURE AUDIT REPORT

### 1.1 Tech Stack Summary
- **Frontend Framework:** React 18 + TypeScript + Vite + Tailwind CSS (`@tailwindcss/vite` v4) + Lucide Icons + Framer Motion.
- **Backend API:** Node.js Express server (`server.js`) serving static production assets and serverless API endpoints under `/api/` (`/api/create-order`, `/api/verify-payment`, `/api/health`).
- **Database & Auth:** Firebase v11 Modular Web SDK (Authentication: Phone OTP + Google Sign-In; Firestore Database: `(default)`; Cloud Storage: `bharatproexpert-homeservices.firebasestorage.app`).
- **Payment Gateway:** Razorpay Checkout SDK (`https://checkout.razorpay.com/v1/checkout.js`) with server-side HMAC SHA256 signature verification.
- **Deployment Targets:**
  - Customer Website: Firebase Hosting Target `customer` (`bharatproexpert-homeservices`) & Vercel.
  - Admin Panel: Independent module residing in `admin-app/`, deployed to Firebase Hosting Target `admin` (`bharatproexpert-admin`).

### 1.2 File & Directory Structure Analysis
```
.
├── admin-app/                    # Standalone Admin Panel Application
│   ├── admin-firebase-config.ts # Admin Firebase Config (VITE_ADMIN_FIREBASE_*)
│   ├── package.json
│   └── README.md
├── api/                          # Express API helpers & pricing catalog
├── docs/                         # Documentation & Architecture Audit Reports
├── public/                       # Static public assets (manifest, favicons, logos)
├── scripts/                      # Seed scripts (seed.json)
├── src/                          # Main Customer Application Source
│   ├── components/               # UI Modals, Views, Header, Footer
│   │   ├── admin/                # Admin Panel components inside main SPA
│   │   ├── home/                 # Home View & Hero Banner components
│   │   ├── AuthModal.tsx         # Unified Auth Modal (Google Sign-In + Phone OTP)
│   │   ├── PhoneLogin.tsx        # Phone OTP Firebase Auth Component
│   │   ├── BookingFlowModal.tsx  # Customer Checkout & Razorpay Flow
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.tsx       # Unified Auth Provider
│   ├── services/                 # Customer Auth, DB Service, Razorpay, Admin Services
│   ├── firebase.js               # Firebase v11 modular initialization (JS)
│   ├── firebase-config.ts        # Firebase v11 modular initialization (TS)
│   ├── types.ts                  # Shared TypeScript Interfaces & Enums
│   ├── App.tsx                   # Main SPA Router & Controller
│   └── main.tsx
├── .env.example                  # Environment Variables Template
├── .firebaserc                   # Hosting Targets (customer, admin)
├── firebase.json                 # Firebase Multi-site Deployment Configuration
├── firestore.rules               # Security Rules with RBAC & Custom Claim checks
├── storage.rules                 # Cloud Storage Security Rules
└── firestore.indexes.json        # Collection Group Index definitions
```

### 1.3 Existing Catalogue Items & Pricing Preserved
All existing services, categories, packages, prices, and add-ons are preserved exactly as defined in `src/data.ts` and `scripts/seed.json`:
1. **Cleaning & Pest Control (`cat-cleaning`)**: Full Home Deep Cleaning (₹2,499), Bathroom Deep Cleaning (₹499), Kitchen Deep Cleaning (₹1,299), Sofa & Upholstery Cleaning (₹799), Pest Control Anti-Termite (₹999).
2. **AC & Appliance Repair (`cat-ac`)**: Split AC Foam Jet Service (₹599), Window AC Servicing (₹449), Washing Machine Repair (₹399), Refrigerator Servicing (₹499).
3. **Plumbing & Electrical (`cat-plumbing`)**: Tap & Mixer Repair (₹199), Electrical Switchboard Repair (₹149), Water Heater / Geyser Installation (₹499).
4. **Painting & Waterproofing (`cat-painting`)**: Full Home Interior Painting Inspection (₹99), Waterproofing Consultation (₹299).

---

## 2. FIREBASE 360° ARCHITECTURE & COLLECTION MAPPING

Single Firebase Project `bharatproexpert-homeservices` connecting all 4 applications:
1. **Customer Website** (Web App ID: `1:11342758143:web:1c23b2f9cb5c55715e0cca`)
2. **Customer Android App** (Android App ID: `1:11342758143:android:eae95193e24bd6325e0cca`)
3. **Partner Android App** (Android App ID: `1:11342758143:android:697528286ad0de115e0cca`)
4. **Admin Panel** (Web App ID: `1:11342758143:web:37ee73d3cd1689735e0cca`)

### Shared Firestore Collections Mapping (Modules 1–73)
- **Core Platform:** `users`, `admins`, `roles`, `permissions`, `settings`, `website_config`, `app_config`, `seo_settings`, `media`, `audit_logs`.
- **Catalogue & Pricing:** `service_categories`, `services`, `packages`, `addons`, `pricing_rules`, `surge_windows`, `surge_multipliers`.
- **Bookings & Dispatch:** `bookings`, `booking_status_history`, `job_assignments`, `dispatch_queue`, `job_escalations`, `cancellations`, `no_shows`.
- **Partner Operations & Hubs:** `partners`, `partner_applications`, `partner_documents`, `partner_verifications`, `partner_availability`, `partner_calendar`, `partner_leaves`, `partner_attendance`, `partner_jobs`, `hubs`, `zones`, `pincodes`.
- **Finance, Wallet & Settlements:** `transactions`, `payments`, `refunds`, `coupons`, `partner_wallet_transactions`, `partner_payouts`, `partner_incentives`, `settlements`, `partner_ledger`, `company_ledger`, `disputes`.
- **Modules 59–73 Advanced Collections:**
  - *Module 59 Inventory:* `inventory_items`, `inventory_categories`, `inventory_stock`, `inventory_orders`, `inventory_vendors`, `inventory_purchase_orders`.
  - *Module 61 Loyalty:* `loyalty_programs`, `loyalty_tiers`, `subscription_plans`, `customer_subscriptions`.
  - *Module 62 Warranty:* `warranty_policies`, `rework_requests`, `warranty_claims`.
  - *Module 63 Fraud & Risk:* `fraud_rules`, `risk_scores`, `fraud_alerts`, `fraud_cases`.
  - *Module 64 Insurance:* `insurance_providers`, `insurance_policies`, `insurance_claims`, `welfare_schemes`.
  - *Module 65 Skill Matrix:* `skill_taxonomy`, `partner_skills`, `brand_specializations`.
  - *Module 66 Referrals:* `referral_programs`, `referral_codes`, `referral_tracking`.
  - *Module 67 Communication:* `communication_channels`, `communication_messages`, `moderation_flags`.
  - *Module 68 Compliance:* `compliance_requirements`, `partner_licenses`, `license_expiry_alerts`.
  - *Module 69 Auto-Suspension:* `suspension_rules`, `suspension_events`, `suspension_appeals`.
  - *Module 70 KB & Community:* `kb_articles`, `sop_library`, `partner_announcements`.
  - *Module 71 Predictive Analytics:* `prediction_models`, `churn_predictions`, `demand_forecasts`.
  - *Module 72 BGV Agencies:* `verification_agencies`, `verification_requests`, `verification_results`.
  - *Module 73 Hub P&L:* `hub_financial_accounts`, `hub_pnl_snapshots`, `hub_budget_plans`.

---

## 3. PARTNER ONBOARDING & HUB GEOFENCING WORKFLOW

### 3.1 Partner 9-Stage Onboarding Funnel
1. **Stage 0 (Lead Capture):** Application received via website / Google Form integration -> Document created in `partner_applications` with status `NEW_LEAD`.
2. **Stage 1 (Document Verification):** Aadhaar, PAN, Address Proof, and Photo uploaded -> Status `UNDER_VERIFICATION`.
3. **Stage 2 (Background Check):** BGV verification requested via IDfy / AuthBridge -> Status `BGV_PENDING`.
4. **Stage 3 (Skill Assessment):** Category skill evaluation completed -> Status `ASSESSMENT_PASSED`.
5. **Stage 4 (Interview):** Personal interview & communication check -> Status `INTERVIEW_CLEARED`.
6. **Stage 5 (Training):** SOP and safety training module completed -> Status `TRAINING_COMPLETED`.
7. **Stage 6 (Kit Procurement):** Mandatory safety kit issued from inventory -> Status `KIT_ISSUED`.
8. **Stage 7 (Hub & Geofence Assignment):** Admin assigns partner to specific Hub (8–10 KM radius) & service area.
9. **Stage 8 (Activation):** Partner state updated to `APPROVED` / `ACTIVE`, login credentials dispatched, ready for live jobs.

### 3.2 City-Wise Hub Directory (Seed Data Ready)
- **Gurugram (6 Hubs):** Old Gurgaon (HUB-GGN-01), DLF & Cyber City (HUB-GGN-02), Golf Course Ext (HUB-GGN-03), New Gurgaon (HUB-GGN-04), Dwarka Expressway (HUB-GGN-05), Manesar & IMT (HUB-GGN-06).
- **Delhi NCR (12 Hubs):** North Delhi (HUB-DEL-01), Rohini (HUB-DEL-02), Rajouri Garden (HUB-DEL-03), Dwarka (HUB-DEL-04), Saket (HUB-DEL-05), Lajpat Nagar (HUB-DEL-06), Connaught Place (HUB-DEL-07), Chanakyapuri (HUB-DEL-08), Mayur Vihar (HUB-DEL-09), Yamuna Vihar (HUB-DEL-10), Shahdara (HUB-DEL-11), Outer Delhi (HUB-DEL-12).
- **Noida (5 Hubs):** Sector 1–30 (HUB-NOI-01), Expressway (HUB-NOI-02), Greater Noida West (HUB-NOI-03), Sector 101–130 (HUB-NOI-04), Greater Noida (HUB-NOI-05).
- **Patna (3 Hubs):** Patna Central/West (HUB-PAT-01), Patna North (HUB-PAT-02), Patna City/Danapur (HUB-PAT-03).
- **Ranchi (2 Hubs):** Ranchi Central/West (HUB-RAN-01), Ranchi East/South (HUB-RAN-02).
- **Muzaffarpur (2 Hubs):** Muzaffarpur North (HUB-MUZ-01), Muzaffarpur South (HUB-MUZ-02).
- **Darbhanga (2 Hubs):** Darbhanga North (HUB-DBG-01), Darbhanga South (HUB-DBG-02).

---

## 4. INTEGRATION VERIFICATION & SAFETY GUARANTEES
- **RULE #1 COMPLIANCE:** All changes are strictly additive or server-side configuration changes. No customer pages, layouts, styles, fonts, colors, or checkout routes have been modified.
- **SECURITY:** `firestore.rules` enforces authenticated access on OTP records and customer profiles. Admin panel requires `admins/{uid}.active == true` for operational access.
- **PAYMENT INTEGRATION:** Razorpay payment signature verification endpoints (`/api/create-order` and `/api/verify-payment`) remain 100% active.
