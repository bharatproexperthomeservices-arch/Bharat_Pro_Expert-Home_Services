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
