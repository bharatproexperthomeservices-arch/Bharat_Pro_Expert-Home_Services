# Razorpay webhook setup (Vercel)

## Endpoint

Configure the Razorpay webhook URL as:

`https://www.bharatproexpert.com/api/webhooks/razorpay`

Use the exact canonical production domain configured in Vercel. If your primary domain is different, use that domain instead.

## Vercel environment variable

Add this server-only Production environment variable:

- `RAZORPAY_WEBHOOK_SECRET` — the webhook secret entered when creating the webhook in Razorpay Dashboard.

This is **not** `RAZORPAY_KEY_SECRET`. Do not use a `VITE_` prefix for the webhook secret, and never commit the value to GitHub.

After saving the variable, redeploy the Vercel project that serves the production domain.

## Razorpay Dashboard

1. Open Razorpay Dashboard and select the same mode you are configuring (Test or Live).
2. Add the endpoint URL above.
3. Enter a strong webhook secret and save it as `RAZORPAY_WEBHOOK_SECRET` in Vercel, with the exact same value.
4. Select the events you need, such as `payment.captured`, `payment.failed`, and `refund.processed`.
5. Use the Dashboard's test-webhook action and check Vercel Function Logs.

## Current implementation boundary

The endpoint verifies the `X-Razorpay-Signature` HMAC-SHA256 against the exact raw request body, rejects invalid signatures, limits request size, and acknowledges valid event deliveries. It intentionally does not update Firestore bookings or issue refunds: that requires an idempotent persistence/booking-update implementation and must not be simulated by simply returning HTTP 200.

A browser GET request is expected to return HTTP 405 because Razorpay sends POST requests. A 401 from a real Razorpay test delivery means the signature did not match, usually because the Vercel secret differs from the Razorpay webhook secret. A Vercel deployment-protection login page/401 must be resolved separately so Razorpay can reach the endpoint.
