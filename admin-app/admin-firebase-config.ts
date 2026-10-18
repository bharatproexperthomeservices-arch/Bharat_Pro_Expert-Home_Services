import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const adminFirebaseConfig = {
  apiKey: (import.meta.env?.VITE_ADMIN_FIREBASE_API_KEY as string) || "",
  authDomain: (import.meta.env?.VITE_ADMIN_FIREBASE_AUTH_DOMAIN as string) || "",
  projectId: (import.meta.env?.VITE_ADMIN_FIREBASE_PROJECT_ID as string) || "",
  storageBucket: (import.meta.env?.VITE_ADMIN_FIREBASE_STORAGE_BUCKET as string) || "",
  messagingSenderId: (import.meta.env?.VITE_ADMIN_FIREBASE_MESSAGING_SENDER_ID as string) || "",
  appId: (import.meta.env?.VITE_ADMIN_FIREBASE_APP_ID as string) || ""
};

const adminApp = getApps().find(a => a.name === 'adminApp') || initializeApp(adminFirebaseConfig, 'adminApp');
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminGoogleProvider = new GoogleAuthProvider();
