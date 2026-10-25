import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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
    let errorMsg = error.message || 'Google sign-in failed. Please try again.';
    if (error.code === 'auth/unauthorized-domain' || (error.message && error.message.includes('auth/unauthorized-domain'))) {
      errorMsg = 'This domain is not authorized in Firebase Console. Please add this domain under Firebase > Authentication > Settings > Authorized Domains, or use Mobile OTP login.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMsg = 'Sign-in popup was closed before completing. Please try again.';
    }
    return {
      success: false,
      error: errorMsg
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
