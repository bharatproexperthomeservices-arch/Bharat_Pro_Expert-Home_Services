# AGENTS.md — Bharat Pro Expert Guidance

## Architecture
- **Frontend**: Single Page Application (SPA) built with HTML, CSS, JS (`index.html`, `css/styles.css`, `js/data.js`, `js/app.js`), bundled via Vite.
- **Backend API**: Node.js Express server (`server.js`) hosting serverless-compatible API routes under `/api/` (`/api/create-order`, `/api/verify-payment`, `/api/health`).
- **Payment Gateway**: Razorpay Checkout SDK (`https://checkout.razorpay.com/v1/checkout.js`).

## Scripts
- `npm run dev`: Starts local Vite development server.
- `npm run build`: Builds production bundle with Vite.
- `npm start`: Runs production server via Express (`server.js`).

## Vercel Deployment & Environment Variables
- `vercel.json` configures API routes and static asset rewrites.
- **Environment Variables Required**:
  - `RAZORPAY_KEY_ID`: Razorpay key ID for order creation and checkout.
  - `RAZORPAY_KEY_SECRET`: Razorpay key secret for HMAC SHA256 payment signature verification.

## Verification Workflow
Before submitting changes or triggering production deployments:
1. Run `npm run build` to ensure static production assets build without error.
2. Run `PORT=5005 node server.js` to verify server startup and backend API response (`/api/health` and `/api/create-order`).
3. Verify payment signature security and catalogue pricing sync between `js/data.js` and `api/pricing-catalog.js`.
