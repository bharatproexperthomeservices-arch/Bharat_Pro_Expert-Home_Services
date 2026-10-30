# Bharat Pro Expert - Production Location Flow Setup & Testing Guide

## Overview
This document outlines the architecture, environment variables, setup instructions, and testing checklist for the production-ready Location Detection Flow on Bharat Pro Expert.

---

## Environment Variables (`.env`)

Configure the following variables in your `.env` file or hosting provider (Vercel / Cloudflare / Server):

```env
# Client-side (Public)
VITE_SUPABASE_URL=https://<your-supabase-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_GOOGLE_MAPS_API_KEY_BROWSER=<your-google-maps-browser-key>

# Server-side (Secrets)
GOOGLE_MAPS_API_KEY_SERVER=<your-google-maps-server-key>
SUPABASE_URL=https://<your-supabase-project>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
```

---

## Database Migration

Run the SQL migration in `supabase/migrations/20250228000000_location_flow.sql` via the Supabase Dashboard SQL Editor or Supabase CLI:

```sql
-- Tables created:
-- 1. service_pincodes (with RLS public read)
-- 2. user_addresses (with RLS owner policies)
-- 3. notify_requests (with RLS insert policy)
```

---

## Test Checklist

Use this checklist to verify the location flow across various devices and environments:

| Test Case | Scenario | Expected Outcome | Status |
|---|---|---|---|
| **1. Allow Permission** | User clicks Allow on location browser prompt | Screen 1 (Splash 1.2s) -> Screen 2 ("Fetching...") -> Screen 3 ("Delivering service at...") displaying accurate resolved address. | Pass |
| **2. Deny Permission** | User blocks/denies location permission | Displays Screen Error ("Permission Denied") with options to "Retry" or "Search location manually". | Pass |
| **3. GPS Timeout / Unavailable** | GPS signal times out or unavailable | Displays Screen Error ("GPS Timeout" / "Position Unavailable") with Retry button. | Pass |
| **4. Low GPS Accuracy (>500m)** | Device reports accuracy > 500 meters | Triggers interactive Google Map screen with draggable marker to confirm exact location before Screen 3. | Pass |
| **5. Non-Serviceable Area** | Resolved pincode not in `service_pincodes` | Displays warning "We don't serve this area yet", disables Continue button, and provides "Notify Me" option. | Pass |
| **6. Places Autocomplete** | User types area name in "Change location" | Returns Google Places search suggestions restricted to India; selecting one reverse geocodes details. | Pass |
| **7. Saved Addresses Sync** | Logged-in user selects/saves address | Upserts address into Supabase `user_addresses` (updating existing row if within 100m) and marks as default. | Pass |
| **8. Offline Mode** | Device loses internet connection | Shows Offline error state; automatically re-triggers location fetch when connection is restored. | Pass |
| **9. Returning Visit** | User revisits app with cached address | Bypasses 3-screen onboarding immediately; silently refreshes GPS in background if moved > 200m. | Pass |
| **10. Responsive & Accessibility** | Tested on Android Chrome, iOS Safari, and Desktop | Full responsive layout (320px - 1920px), all touch targets >= 44px, `aria-live` status announcements active. | Pass |
