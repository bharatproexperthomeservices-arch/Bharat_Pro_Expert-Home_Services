# Bharat Pro Expert — Home Services Admin Panel (Phase 1)

"Bharat Pro" is an enterprise home services platform admin dashboard (similar to Urban Company) built with real logic engines, state machines, double-entry financial ledgers, and immutable audit logging.

## Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS + Zustand + React Router + Recharts
- **Backend**: Node.js + Express (`server/`)
- **Data Layer**: Repository pattern in-memory data store (`server/repository/memoryRepository.js`)
- **Testing**: Jest unit tests (`tests/`)

---

## Quick Start Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Logic Engine Unit Tests**:
   ```bash
   npm test
   ```

3. **Build Frontend Bundle**:
   ```bash
   npm run build
   ```

4. **Start Backend API & Admin Server**:
   ```bash
   npm start
   ```
   Backend API runs at `http://localhost:5000` (or `PORT`).

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## Core Logic Safeguards Built

1. **Hard-coded Activation Gate (`server/logic/activationGate.js`)**:
   - Partner becomes `ACTIVE` **only** if: KYC Cleared + Training Complete + Background Check Cleared.
   - Enforced via pure logic, cannot be bypassed.

2. **Booking State Machine (`server/logic/stateMachine.js`)**:
   - Enforces valid status transitions (`PENDING` → `ASSIGNED` → `EN_ROUTE` → `IN_PROGRESS` → `COMPLETED` → `SETTLED`).
   - Every transition strictly requires a non-empty `reasonCode`.

3. **Double-Entry Financial Ledger (`server/logic/ledgerEngine.js`)**:
   - Every financial event (earnings, payouts, penalties) creates debits and credits that **must balance to zero**.
   - Rejects unbalanced transactions.

4. **Weighted Dispatch Engine (`server/logic/dispatchEngine.js`)**:
   - Assigns partners based on: `Skill Match (40)` + `Proximity < 15km (25)` + `Availability (15)` + `Rating (10)` + `Fairness (10)`.

5. **Immutable Audit Logging (`server/logic/auditLogger.js`)**:
   - Every compliance action, document review, override, and dispatch assignment logs an immutable entry with actor, reason, timestamp, and target state.

---

## Documentation
See detailed architecture breakdown in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).
