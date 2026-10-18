import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
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
import firebaseConfigJson from '../firebase-applet-config.json';

// ReCAPTCHA Enterprise / Firebase Phone Auth Site Key
export const reCaptchaSiteKey = "6LdnC9MtAAAAAAAAEDe0ll5X9OF9jRunXjRedGaq-k_";

// Initialize Firebase App dynamically using environment variables or firebaseConfigJson
export const firebaseConfig = {
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string) || firebaseConfigJson.apiKey || "",
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfigJson.authDomain || "",
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfigJson.projectId || "",
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfigJson.storageBucket || "",
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfigJson.messagingSenderId || "",
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string) || firebaseConfigJson.appId || ""
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with databaseId exactly according to Firebase Integration Skill
export const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);

// Suppress transient initial connection retry warnings
try {
  setLogLevel('error');
} catch {}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Diagnostic connection test according to Firebase Integration guidelines
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
