# Architecture & Logic Engine Documentation — Bharat Pro Admin Panel (Phase 1)

## Executive Summary
Bharat Pro is an enterprise home services operational platform built with strict business logic engines, immutable audit trails, and state machine safeguards.

---

## Directory Structure
```
bharat-pro-expert/
├── client/                     # React frontend (Vite + TailwindCSS + Zustand + Recharts)
│   ├── src/
│   │   ├── components/         # Layout & shared UI components
│   │   ├── pages/              # 8 Operational pages (Dashboard, Partners, KYC Queue, Bookings, Dispatch, Payments, Audit Log, Settings)
│   │   └── store/              # Zustand global application state
├── server/                     # Express API Backend & Logic Layer
│   ├── logic/                  # Pure logic engines
│   │   ├── activationGate.js   # Hard-coded activation gate pure function
│   │   ├── auditLogger.js      # System-wide audit logger
│   │   ├── dispatchEngine.js   # Weighted partner matching & proximity validation
│   │   ├── ledgerEngine.js     # Double-entry ledger journal engine
│   │   ├── pricingEngine.js    # Stepwise price calculation & tier commission
│   │   ├── qualityScoreEngine.js # Dynamic performance scoring & tier assignment
│   │   └── stateMachine.js     # Booking state machine transition validator
│   ├── repository/             # Abstraction store (MemoryRepository)
│   ├── routes/                 # Express API routes
│   └── seed/                   # Pre-seeded operational dataset (10 partners, 20 bookings, 5 cities, 10 services)
├── shared/                     # Cross-layer constants & business rules
│   └── constants.js            # 17 Document types, state maps, reason codes, account codes
└── tests/                      # Jest unit test suite covering all 5 logic engines
```

---

## The 5 Core Logic Engines

### 1. Hard-Coded Activation Gate (`server/logic/activationGate.js`)
- Enforces that a partner becomes `ACTIVE` **only** if all 3 criteria are satisfied:
  1. `kycStatus === 'KYC_CLEARED'`
  2. `trainingCompleted === true`
  3. `backgroundCheckStatus === 'CLEARED'`
- **Safeguard**: Pure function logic, zero override flags.

### 2. Booking State Machine (`server/logic/stateMachine.js`)
- Validates transitions across allowed states:
  - `PENDING` → `ASSIGNED`, `CANCELLED`
  - `ASSIGNED` → `EN_ROUTE`, `CANCELLED`, `PENDING`
  - `EN_ROUTE` → `IN_PROGRESS`, `CANCELLED`
  - `IN_PROGRESS` → `COMPLETED`, `CANCELLED`
  - `COMPLETED` → `SETTLED`
- **Safeguard**: Every transition strictly requires a valid `reasonCode`. Invalid or un-reasoned transitions are immediately rejected.

### 3. Double-Entry Ledger Engine (`server/logic/ledgerEngine.js`)
- Enforces double-entry accounting where `sum(Debits) === sum(Credits)`.
- Rejects unbalanced transactions.
- Computes partner payable balances dynamically.

### 4. Pricing & Commission Engine (`server/logic/pricingEngine.js`)
- Calculates price in order: `basePrice` → `categoryMultiplier` → `cityFactor` → `surgeMultiplier` → `promoDiscount` → `tax (GST 5%)`.
- Computes platform commission and net partner payout based on tier:
  - **GOLD**: 12% commission
  - **SILVER**: 15% commission
  - **BRONZE**: 18% commission
  - **AT_RISK**: 20% commission

### 5. Weighted Dispatch Engine (`server/logic/dispatchEngine.js`)
- Scores partners based on formula: `Score = (skillMatch * 40) + (proximityScore * 25) + (availabilityScore * 15) + (ratingScore * 10) + (fairnessScore * 10)`.
- Proximity check strictly enforces `< 15 km` boundary.
- Fairness weight prevents over-assigning jobs to the same partner within 24 hours.

---

## Running Local Environment
- **Run Backend Tests**: `npm test`
- **Build Client**: `npm run build`
- **Start Backend Server**: `npm start`
