# Bharat Pro Expert — Apartment Cleaning Website (iOS-style)

Static site, no build step. Open `index.html` or host the folder on Firebase Hosting / Netlify / any server.

## Structure
- `index.html` — shell
- `css/styles.css` — iOS design system (light + dark)
- `js/data.js` — 8 apartment-cleaning categories (home deep, bathroom, kitchen, sofa/carpet/mattress, appliance, floor/window, fans/wardrobes, move-in/special), 64 cleaning services (prices, FAQs, coupons, slots). Edit here to change content.
- `js/app.js` — router + pages (Home, Services, Category, Detail, Search, Cart, Checkout, Bookings, Account, Help, Partner) + Hindi/English
- `manifest.webmanifest`, `icons/icon.svg` — installable PWA

## APK / iOS app
Wrap this folder with Capacitor: `npm i @capacitor/core @capacitor/cli`, `npx cap init BharatProExpert com.bharatproexpert.homeservices --web-dir=.`, then `npx cap add android ios`.

## Contacts used
Support +91 89202 52647 · bharatproexpert@gmail.com · bharatproexperthomeservices@gmail.com

## Note
Bookings/login/OTP are demo (saved in browser localStorage). Connect Firebase (Auth + Firestore) for real backend.


## Cashfree Payment Gateway (Vercel)

The deployed storefront booking flow uses Cashfree Hosted Checkout. Create orders and verify successful payments through the server-side Vercel API routes; never expose the Cashfree Secret Key in frontend variables such as `VITE_*` or `NEXT_PUBLIC_*`.

Set these in **Vercel → Project → Settings → Environment Variables** for the deployment environments you use:

- `CASHFREE_APP_ID` — App ID from Cashfree.
- `CASHFREE_SECRET_KEY` — Secret Key from the same Cashfree environment; server-only.
- `CASHFREE_ENV` — `sandbox` while testing, then `production` after Cashfree approves live payments.
- `PUBLIC_APP_URL` — full public HTTPS URL for this website, e.g. your production domain.

After saving variables, redeploy the Vercel project. First complete an end-to-end sandbox payment and confirm the booking is only marked PAID after the server verifies Cashfree's order and payment status. Switch to production only after live credentials and merchant onboarding are approved.

Cashfree's zero-fee offer is subject to merchant eligibility and the offer terms; integration does not automatically activate the offer.
