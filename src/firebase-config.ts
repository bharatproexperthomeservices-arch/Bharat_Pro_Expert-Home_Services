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
  query, 
  where, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// ReCAPTCHA Enterprise / Firebase Phone Auth Site Key
export const reCaptchaSiteKey = "6LdnC9MtAAAAAAAAEDe0ll5X9OF9jRunXjRedGaq-k_";

// Initialize Firebase App
export const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || "AIzaSyBHkZBT4HTjxZ9nSi5PbsWHpqgIG9O8weI",
  authDomain: firebaseConfigJson.authDomain || "gen-lang-client-0808776459.firebaseapp.com",
  projectId: firebaseConfigJson.projectId || "gen-lang-client-0808776459",
  storageBucket: firebaseConfigJson.storageBucket || "gen-lang-client-0808776459.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "1083157968796",
  appId: firebaseConfigJson.appId || "1:1083157968796:web:03c1157192c02e2ade3a59"
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
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn("Firestore operates in offline/local-cache mode until connection is established.");
      }
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
  query,
  where,
  orderBy,
  onSnapshot
};

export type { FirebaseUser, ConfirmationResult };
