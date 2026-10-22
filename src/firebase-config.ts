import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult
} from 'firebase/auth';
import { 
  getFirestore, 
  setLogLevel,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  getDocFromServer,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import { getMessaging, isSupported as isMessagingSupported, Messaging } from 'firebase/messaging';
import firebaseConfigJson from '../firebase-applet-config.json';

// ReCAPTCHA Enterprise / Firebase Phone Auth Site Key
export const reCaptchaSiteKey = "6LdnC9MtAAAAAAAAEDe0ll5X9OF9jRunXjRedGaq-k_";

// Initialize Firebase App dynamically using environment variables or firebaseConfigJson
export const firebaseConfig = {
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string) || firebaseConfigJson.apiKey || "AIzaSyB1GbzmsTs4Uspa4m8h-zYCNbqupfI-L9s",
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfigJson.authDomain || "bharatproexpert-homeservices.firebaseapp.com",
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfigJson.projectId || "bharatproexpert-homeservices",
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfigJson.storageBucket || "bharatproexpert-homeservices.firebasestorage.app",
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfigJson.messagingSenderId || "11342758143",
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string) || firebaseConfigJson.appId || "1:11342758143:web:1c23b2f9cb5c55715e0cca",
  measurementId: (import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID as string) || firebaseConfigJson.measurementId || "G-BV51FNHHE8"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Analytics & Messaging conditionally
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
  isMessagingSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch(() => {});
}

// Suppress transient initial connection retry warnings
try {
  setLogLevel('error');
} catch {}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Diagnostic connection test
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch {
      // Quiet offline check
    }
  }, 2000);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  firebaseSignOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
};

export type { FirebaseUser, ConfirmationResult };
