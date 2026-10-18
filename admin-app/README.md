# Bharat Pro Expert - Standalone Admin Panel Application

This module represents the separate Admin Panel application for **Bharat Pro Expert Home Services**.

## Requirements & Security Isolation
- Connected exclusively to the **Bharat Pro Expert Admin Production** Firebase project.
- Isolated from customer public web navigation.
- Accessible only by authorized administrators authenticated against the Admin Firebase project.

## Configuration
Configure environment variables in Vercel or `.env`:
- `VITE_ADMIN_FIREBASE_API_KEY`
- `VITE_ADMIN_FIREBASE_AUTH_DOMAIN`
- `VITE_ADMIN_FIREBASE_PROJECT_ID`
- `VITE_ADMIN_FIREBASE_STORAGE_BUCKET`
- `VITE_ADMIN_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_ADMIN_FIREBASE_APP_ID`
