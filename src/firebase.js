import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import firebaseConfigJson from '../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || "AIzaSyB1GbzmsTs4Uspa4m8h-zYCNbqupfI-L9s",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || "bharatproexpert-homeservices.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || "bharatproexpert-homeservices",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || "bharatproexpert-homeservices.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || "11342758143",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || "1:11342758143:web:1c23b2f9cb5c55715e0cca",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId || "G-BV51FNHHE8"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let analytics = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}
export { analytics };

let messaging = null;
if (typeof window !== 'undefined') {
  isMessagingSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch(() => {});
}
export { messaging };

export default app;
