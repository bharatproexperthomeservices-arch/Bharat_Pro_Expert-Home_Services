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
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyB1GbzmsTs4Uspa4m8h-zYCNbqupfI-L9s",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "bharatproexpert-homeservices.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "bharatproexpert-homeservices",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "bharatproexpert-homeservices.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "11342758143",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:11342758143:web:1c23b2f9cb5c55715e0cca",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-EGTW0MDD3W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let recaptchaVerifier = null;
let confirmationResult = null;

export function setupRecaptcha(containerId = 'recaptcha-container') {
  console.log("Auth Step 3: Setting up RecaptchaVerifier for container:", containerId);
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      console.warn("Auth Step 3: Non-critical clearing error for recaptcha:", e);
    }
    recaptchaVerifier = null;
  }

  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log("Auth Step 3: Recaptcha solved successfully");
      },
      'expired-callback': () => {
        console.warn("Auth Step 3: Recaptcha expired, resetting verifier");
        if (recaptchaVerifier) {
          try { recaptchaVerifier.clear(); } catch (e) {}
          recaptchaVerifier = null;
        }
      }
    });
  } catch (err) {
    console.error("Auth Step 3 error in setupRecaptcha:", err);
  }

  return recaptchaVerifier;
}

function formatAuthError(error) {
  console.error('Firebase Auth Error:', error);
  const code = error?.code || '';
  const msg = error?.message || '';
  let friendlyError = 'Google Sign-In failed. Please try again or use Mobile OTP.';

  if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
    const currentDomain = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'www.bharatproexpert.com';
    friendlyError = `Domain (${currentDomain}) is not authorized in Firebase Console -> Auth -> Authorized Domains list. Please add it or log in with Mobile OTP.`;
  } else if (code === 'auth/popup-blocked') {
    friendlyError = 'Sign-in popup was blocked by your browser. Please allow popups for this site or use Mobile OTP.';
  } else if (code === 'auth/popup-closed-by-user') {
    friendlyError = 'Google sign-in window was closed before completing. Please try again.';
  } else if (code === 'auth/cancelled-popup-request') {
    friendlyError = 'Sign-in request was cancelled. Please try again.';
  } else if (code === 'auth/network-request-failed') {
    friendlyError = 'Network error during Google Sign-In. Please check your internet connection and retry.';
  } else if (code === 'auth/operation-not-allowed') {
    friendlyError = 'Google Sign-In is disabled in Firebase Console -> Auth -> Sign-in method.';
  } else if (msg) {
    friendlyError = msg.replace(/^Firebase:\s*/, '').replace(/\(auth\/[^\)]+\)\.?/, '').trim() || friendlyError;
  }

  return {
    success: false,
    error: friendlyError,
    code: code
  };
}

export async function loginWithGoogle() {
  console.log("Auth Step 1: Initiating Google Sign-In...");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result && result.user) {
      const user = result.user;
      console.log("Auth Step 1 complete: Google Popup Sign-In success for UID:", user.uid);
      return {
        success: true,
        user: {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email || '',
          phone: user.phoneNumber ? user.phoneNumber.replace('+91', '') : '',
          avatar: user.photoURL || '🌐',
          loginType: 'google'
        }
      };
    }
    return formatAuthError(new Error("No user returned from Google popup"));
  } catch (error) {
    console.warn("Auth Step 1 popup attempt result:", error?.code, error?.message);
    if (error?.code === 'auth/popup-blocked') {
      console.log("Auth Step 1: Popup blocked, falling back to signInWithRedirect...");
      try {
        await signInWithRedirect(auth, googleProvider);
        return { success: true, redirecting: true };
      } catch (redirectErr) {
        console.error("Auth Step 1 error: signInWithRedirect fallback failed", redirectErr);
        return formatAuthError(redirectErr);
      }
    }
    return formatAuthError(error);
  }
}

export async function checkGoogleRedirectResult() {
  try {
    console.log("Auth Step 1: Checking Google redirect result...");
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      console.log("Auth Step 1 complete: Google Redirect Sign-In success for UID:", user.uid);
      return {
        success: true,
        user: {
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email || '',
          phone: user.phoneNumber ? user.phoneNumber.replace('+91', '') : '',
          avatar: user.photoURL || '🌐',
          loginType: 'google'
        }
      };
    }
    console.log("Auth Step 1: No Google redirect result found");
    return { success: false, noResult: true };
  } catch (error) {
    console.error("Auth Step 1 error in checkGoogleRedirectResult:", error);
    return formatAuthError(error);
  }
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    console.log("Auth Step 2: onAuthStateChanged event fired, user:", firebaseUser ? firebaseUser.uid : "None");
    if (firebaseUser) {
      try {
        const userObj = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Bharat Pro Customer',
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber ? firebaseUser.phoneNumber.replace('+91', '') : '',
          avatar: firebaseUser.photoURL || '🌐',
          loginType: firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'phone'
        };
        console.log("Auth Step 2 complete: User auth session synchronized", userObj.uid);
        callback(null, userObj);
      } catch (err) {
        console.error("Auth Step 2 error handling onAuthStateChanged:", err);
        callback(err, null);
      }
    } else {
      callback(null, null);
    }
  });
}

export async function sendPhoneOtp(phoneNumber, containerId = 'recaptcha-container') {
  console.log("Auth Step 3: Preparing Phone OTP request...");
  try {
    const raw = String(phoneNumber || '').replace(/[^\d+]/g, '');
    let formattedPhone = raw;
    if (/^\d{10}$/.test(raw)) {
      formattedPhone = `+91${raw}`;
    } else if (/^91\d{10}$/.test(raw)) {
      formattedPhone = `+${raw}`;
    } else if (!raw.startsWith('+')) {
      formattedPhone = `+91${raw}`;
    }

    if (!/^\+\d{10,15}$/.test(formattedPhone)) {
      return {
        success: false,
        error: 'Please enter a valid 10-digit Indian mobile number.'
      };
    }

    const verifier = setupRecaptcha(containerId);
    console.log("Auth Step 3: Calling signInWithPhoneNumber for:", formattedPhone);
    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    console.log("Auth Step 3 complete: Phone OTP sent successfully");
    return { success: true, formattedPhone };
  } catch (error) {
    console.error('Auth Step 3 error in sendPhoneOtp:', error);
    const code = error?.code || '';
    let friendlyError = error?.message || 'Failed to send OTP. Please try again.';

    if (code === 'auth/invalid-phone-number') {
      friendlyError = 'Invalid phone number format. Please enter a valid 10-digit mobile number.';
    } else if (code === 'auth/too-many-requests') {
      friendlyError = 'Too many OTP requests. Please wait a few minutes before trying again.';
    } else if (code === 'auth/quota-exceeded') {
      friendlyError = 'SMS quota exceeded for today. Please log in using Google Sign-In.';
    } else if (code === 'auth/captcha-check-failed') {
      friendlyError = 'reCAPTCHA verification failed. Please try again.';
    } else if (code === 'auth/unauthorized-domain') {
      const currentDomain = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'www.bharatproexpert.com';
      friendlyError = `Domain (${currentDomain}) is not authorized for OTP in Firebase Console -> Auth -> Authorized Domains.`;
    }

    return {
      success: false,
      error: friendlyError,
      code
    };
  }
}

export async function verifyPhoneOtp(otpCode) {
  console.log("Auth Step 3: Verifying Phone OTP code...");
  if (!confirmationResult) {
    console.warn("Auth Step 3: OTP confirmation session missing or expired");
    return {
      success: false,
      error: 'OTP session expired. Please click "Resend OTP".'
    };
  }

  try {
    const cleanCode = String(otpCode || '').trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return {
        success: false,
        error: 'Please enter the 6-digit OTP received on your mobile.'
      };
    }

    const result = await confirmationResult.confirm(cleanCode);
    const user = result.user;
    console.log("Auth Step 3 complete: Phone OTP verified successfully for UID:", user.uid);
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
    console.error('Auth Step 3 error in verifyPhoneOtp:', error);
    const code = error?.code || '';
    let friendlyError = 'Invalid OTP entered. Please try again.';

    if (code === 'auth/invalid-verification-code') {
      friendlyError = 'Incorrect 6-digit OTP code entered. Please check and try again.';
    } else if (code === 'auth/code-expired') {
      friendlyError = 'The OTP code has expired. Please click "Resend OTP".';
    }

    return {
      success: false,
      error: friendlyError,
      code
    };
  }
}

export async function firebaseLogout() {
  console.log("Auth Step: Logging out from Firebase Auth...");
  try {
    await signOut(auth);
    console.log("Auth Step complete: Logged out from Firebase Auth");
    return { success: true };
  } catch (error) {
    console.error("Auth Step error during logout:", error);
    return { success: false, error: error.message };
  }
}

export async function saveBookingToFirestore(bookingData) {
  try {
    console.log("Firestore Step: Saving booking to 'bookings' collection...", bookingData);
    const docRef = await addDoc(collection(db, "bookings"), bookingData);
    console.log("Firestore Step complete: Booking saved with Document ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Firestore Step error in saveBookingToFirestore:", error);
    return { success: false, error: error.message || 'Failed to save booking to Firestore' };
  }
}

// Real-Time CMS Subscribers & Auto-Seeding Logic
export function subscribeCMS(onUpdate) {
  let isSeeding = false;

  async function checkAndSeedIfEmpty() {
    if (isSeeding) return;
    isSeeding = true;
    try {
      const catSnap = await getDocs(collection(db, "categories"));
      if (catSnap.empty && window.BPE_DATA) {
        console.log("Firestore CMS: Seeding initial data from BPE_DATA...");
        const D = window.BPE_DATA;

        if (D.brand) {
          await setDoc(doc(db, "site_settings", "main"), {
            brand: D.brand || {},
            promo: D.promo || {},
            cities: D.cities || [],
            howItWorks: D.howItWorks || [],
            trust: D.trust || [],
            faqs: D.faqs || [],
            testimonials: D.testimonials || [],
            updatedAt: new Date()
          });
        }

        if (Array.isArray(D.heroSlides)) {
          for (const s of D.heroSlides) {
            await setDoc(doc(db, "sliders", s.id), s);
          }
        }

        if (Array.isArray(D.categories)) {
          for (const c of D.categories) {
            await setDoc(doc(db, "categories", c.id), c);
          }
        }

        if (Array.isArray(D.services)) {
          for (const s of D.services) {
            await setDoc(doc(db, "services", s.id), s);
          }
        }
        console.log("Firestore CMS: Auto-seeding complete!");
      }
    } catch (err) {
      console.warn("Firestore CMS auto-seeding check error:", err);
    } finally {
      isSeeding = false;
    }
  }

  checkAndSeedIfEmpty();

  const unsubSettings = onSnapshot(collection(db, "site_settings"), (snapshot) => {
    snapshot.forEach((docSnap) => {
      if (docSnap.id === "main" && window.BPE_DATA) {
        const data = docSnap.data();
        if (data.brand) window.BPE_DATA.brand = Object.assign({}, window.BPE_DATA.brand, data.brand);
        if (data.promo) window.BPE_DATA.promo = Object.assign({}, window.BPE_DATA.promo, data.promo);
        if (data.cities) window.BPE_DATA.cities = data.cities;
        if (data.howItWorks) window.BPE_DATA.howItWorks = data.howItWorks;
        if (data.trust) window.BPE_DATA.trust = data.trust;
        if (data.faqs) window.BPE_DATA.faqs = data.faqs;
        if (data.testimonials) window.BPE_DATA.testimonials = data.testimonials;
      }
    });
    if (onUpdate) onUpdate("site_settings");
  }, (err) => console.warn("site_settings listener error:", err));

  const unsubSliders = onSnapshot(collection(db, "sliders"), (snapshot) => {
    if (!snapshot.empty && window.BPE_DATA) {
      const slidersList = [];
      snapshot.forEach((docSnap) => {
        slidersList.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (slidersList.length > 0) {
        window.BPE_DATA.heroSlides = slidersList;
      }
    }
    if (onUpdate) onUpdate("sliders");
  }, (err) => console.warn("sliders listener error:", err));

  const unsubCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
    if (!snapshot.empty && window.BPE_DATA) {
      const catList = [];
      snapshot.forEach((docSnap) => {
        catList.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (catList.length > 0) {
        window.BPE_DATA.categories = catList;
      }
    }
    if (onUpdate) onUpdate("categories");
  }, (err) => console.warn("categories listener error:", err));

  const unsubServices = onSnapshot(collection(db, "services"), (snapshot) => {
    if (!snapshot.empty && window.BPE_DATA) {
      const svcList = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const catId = data.categoryId || data.cat;
        svcList.push({ id: docSnap.id, ...data, cat: catId });
      });
      if (svcList.length > 0) {
        window.BPE_DATA.services = svcList;
      }
    }
    if (onUpdate) onUpdate("services");
  }, (err) => console.warn("services listener error:", err));

  return () => {
    unsubSettings();
    unsubSliders();
    unsubCategories();
    unsubServices();
  };
}

export {
  auth,
  db,
  storage,
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  onAuthStateChanged
};
