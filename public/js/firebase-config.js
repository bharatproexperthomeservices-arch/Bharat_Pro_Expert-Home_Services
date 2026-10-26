import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyB1GbzmsTs4Uspa4m8h-zYCNbqupfI-L9s",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "bharatproexpert-homeservices.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "bharatproexpert-homeservices",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "bharatproexpert-homeservices.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "11342758143",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:11342758143:web:37ee73d3cd1689735e0cca",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-EGTW0MDD3W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let recaptchaVerifier = null;
let confirmationResult = null;

export function setupRecaptcha(containerId = 'recaptcha-container') {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
    recaptchaVerifier = null;
  }

  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {}
  });

  return recaptchaVerifier;
}

export async function checkGoogleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      return {
        success: true,
        user: {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email,
          phone: user.phoneNumber || '',
          avatar: user.photoURL || '🌐',
          loginType: 'google'
        }
      };
    }
  } catch (error) {
    console.error('Firebase Redirect Result Error:', error);
  }
  return null;
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      success: true,
      user: {
        uid: user.uid,
        name: user.displayName || 'Google User',
        email: user.email,
        phone: user.phoneNumber || '',
        avatar: user.photoURL || '🌐',
        loginType: 'google'
      }
    };
  } catch (error) {
    console.error('Firebase Google Login Error:', error);
    const code = error?.code || '';
    const msg = error?.message || '';

    // If popup was blocked or closed before completing, attempt redirect fallback seamlessly
    if (code === 'auth/popup-closed-by-user' || code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return {
          success: false,
          redirecting: true,
          error: 'Redirecting to Google Sign-In...'
        };
      } catch (redirectErr) {
        console.error('Firebase Redirect Fallback Error:', redirectErr);
      }
    }

    let friendlyError = 'Google Sign-In failed. Please try again or use Mobile OTP.';

    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      const currentDomain = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'www.bharatproexpert.com';
      friendlyError = `Domain (${currentDomain}) is not authorized in Firebase Console -> Auth -> Authorized Domains list. Please add it or log in with Mobile OTP.`;
    } else if (code === 'auth/popup-blocked') {
      friendlyError = 'Sign-in popup was blocked by your browser. Redirecting to Google Sign-In...';
    } else if (code === 'auth/popup-closed-by-user') {
      friendlyError = 'Google sign-in window was closed before completing. Redirecting to Google Sign-In...';
    } else if (code === 'auth/cancelled-popup-request') {
      friendlyError = 'Sign-in request was cancelled. Please try again.';
    } else if (code === 'auth/network-request-failed') {
      friendlyError = 'Network error during Google Sign-In. Please check your internet connection and retry.';
    } else if (msg) {
      friendlyError = msg.replace(/^Firebase:\s*/, '').replace(/\(auth\/[^\)]+\)\.?/, '').trim() || friendlyError;
    }

    return {
      success: false,
      error: friendlyError,
      code: code
    };
  }
}

export async function sendPhoneOtp(phoneNumber, containerId = 'recaptcha-container') {
  try {
    const verifier = setupRecaptcha(containerId);
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    return { success: true };
  } catch (error) {
    console.error('Firebase Phone OTP Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send OTP. Please try again.'
    };
  }
}

export async function verifyPhoneOtp(otpCode) {
  if (!confirmationResult) {
    return {
      success: false,
      error: 'OTP request session expired. Please resend OTP.'
    };
  }

  try {
    const result = await confirmationResult.confirm(otpCode);
    const user = result.user;
    return {
      success: true,
      user: {
        uid: user.uid,
        name: user.displayName || 'Bharat Pro Customer',
        phone: user.phoneNumber ? user.phoneNumber.replace('+91', '') : '',
        loginType: 'phone'
      }
    };
  } catch (error) {
    console.error('Firebase Verify OTP Error:', error);
    return {
      success: false,
      error: error.message || 'Invalid OTP entered. Please try again.'
    };
  }
}

export async function firebaseLogout() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export { auth, onAuthStateChanged };
