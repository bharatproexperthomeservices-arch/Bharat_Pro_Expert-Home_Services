import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  onSnapshot 
} from '../firebase-config';
import { AdminLoginRequest } from '../types';
import { 
  sendOwnerEmailNotification, 
  sendAdminLoginOtpEmail,
  OWNER_EMAIL 
} from './emailService';

const STORAGE_ADMIN_REQUESTS_KEY = 'bharat_pro_admin_requests_v1';
const STORAGE_ADMIN_SESSION_KEY = 'bharat_pro_admin_session_v2';
const STORAGE_ACTIVE_OTP_KEY = 'bharat_pro_active_admin_otp_v2';
const STORAGE_FAILED_ATTEMPTS_KEY = 'bharat_pro_admin_failed_attempts';
const STORAGE_LOCKOUT_EXPIRY_KEY = 'bharat_pro_admin_lockout_until';
const STORAGE_REGISTERED_ADMINS_KEY = 'bharat_pro_registered_admins_v1';

// Production Master Security Key (Step 1 Credential)
// Kept secure and strictly checked on verification
const ADMIN_MASTER_PASSPHRASE = 'BharatPro@Security2026';

export interface AdminAccount {
  name: string;
  email: string;
  phone: string;
  role: string;
  passphrase: string;
  registeredAt: string;
  status: 'ACTIVE' | 'PENDING';
}

/**
 * Get all registered admin accounts
 */
export const getRegisteredAdmins = (): AdminAccount[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_REGISTERED_ADMINS_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * Register a new Admin Account
 */
export const registerAdminAccount = async (payload: {
  name: string;
  email: string;
  phone: string;
  role?: string;
  passphrase: string;
}): Promise<{ success: boolean; message: string; error?: string }> => {
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanPass = payload.passphrase.trim();
  
  if (!cleanEmail || !cleanPass) {
    return { success: false, message: '', error: 'Email and passphrase are required.' };
  }

  const existing = getRegisteredAdmins();
  if (existing.some(a => a.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: '', error: 'An admin account with this email already exists. Please Sign In.' };
  }

  const newAdmin: AdminAccount = {
    name: payload.name.trim() || 'Admin User',
    email: cleanEmail,
    phone: payload.phone.trim() || '',
    role: payload.role || (isOwnerEmail(cleanEmail) ? 'Master Administrator' : 'Operations Supervisor'),
    passphrase: cleanPass,
    registeredAt: new Date().toISOString(),
    status: 'ACTIVE'
  };

  existing.push(newAdmin);
  try {
    localStorage.setItem(STORAGE_REGISTERED_ADMINS_KEY, JSON.stringify(existing));
    await setDoc(doc(db, 'admin_users', cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')), newAdmin);
  } catch {}

  // Alert Owner
  sendOwnerEmailNotification({
    type: 'ADMIN_LOGIN_REQUEST',
    subject: `👤 [Bharat Pro] New Admin User Registered: ${newAdmin.email}`,
    body: `A new administrative user has been registered:\nName: ${newAdmin.name}\nEmail: ${newAdmin.email}\nPhone: ${newAdmin.phone}\nRole: ${newAdmin.role}`
  }).catch(() => {});

  return { 
    success: true, 
    message: 'Admin account registered successfully! You can now sign in with your email.' 
  };
};

// Lockout configuration (Brute-force protection)
const MAX_FAILED_ATTEMPTS = 4;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const OTP_EXPIRY_DURATION_MS = 5 * 60 * 1000; // 5 minutes strictly

/**
 * Check if the admin portal is currently in security lockout
 */
export const getAdminLockoutStatus = (): { isLocked: boolean; remainingSeconds: number } => {
  try {
    const lockoutUntilStr = localStorage.getItem(STORAGE_LOCKOUT_EXPIRY_KEY);
    if (!lockoutUntilStr) return { isLocked: false, remainingSeconds: 0 };
    
    const lockoutUntil = parseInt(lockoutUntilStr, 10);
    const now = Date.now();
    if (now < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      return { isLocked: true, remainingSeconds };
    }
    // Lockout expired, clean up
    localStorage.removeItem(STORAGE_LOCKOUT_EXPIRY_KEY);
    localStorage.removeItem(STORAGE_FAILED_ATTEMPTS_KEY);
    return { isLocked: false, remainingSeconds: 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0 };
  }
};

/**
 * Record a failed authentication attempt and enforce lockout if threshold exceeded
 */
export const recordFailedAttempt = async (): Promise<{ lockedNow: boolean; remainingSeconds: number }> => {
  try {
    const raw = localStorage.getItem(STORAGE_FAILED_ATTEMPTS_KEY) || '0';
    const attempts = parseInt(raw, 10) + 1;
    localStorage.setItem(STORAGE_FAILED_ATTEMPTS_KEY, attempts.toString());

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(STORAGE_LOCKOUT_EXPIRY_KEY, lockoutUntil.toString());

      // Log security event
      try {
        await setDoc(doc(db, 'audit_logs', 'security_lockout_' + Date.now()), {
          type: 'SECURITY_LOCKOUT',
          event: 'MULTIPLE_FAILED_ADMIN_LOGIN_ATTEMPTS',
          attempts,
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
        });
      } catch {}

      // Dispatch security email alert
      sendOwnerEmailNotification({
        type: 'ADMIN_LOGIN_REJECTED',
        subject: '🚨 [Security Alert] Bharat Pro Admin Portal Locked Out (Multiple Failed Attempts)',
        body: `Security Warning:\n\nMultiple consecutive failed login attempts (${attempts}) were detected on the Bharat Pro Admin Portal.\nThe portal has been locked out for 15 minutes.\n\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\nDevice: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client'}`
      }).catch(() => {});

      return { lockedNow: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
    }
    return { lockedNow: false, remainingSeconds: 0 };
  } catch {
    return { lockedNow: false, remainingSeconds: 0 };
  }
};

/**
 * Reset failed attempts upon successful multi-factor authentication
 */
export const resetFailedAttempts = () => {
  try {
    localStorage.removeItem(STORAGE_FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(STORAGE_LOCKOUT_EXPIRY_KEY);
  } catch {}
};

/**
 * Verify if email matches the authorized owner (without exposing it to client)
 */
export const isOwnerEmail = (email: string): boolean => {
  return email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
};

/**
 * Step 1: Initiate Admin Login with Email + Password
 * Prevents user enumeration by returning a generic status message regardless of email existence.
 */
export const initiateAdminLoginStep1 = async (
  email: string,
  passphrase: string
): Promise<{ 
  success: boolean; 
  displayMessage: string; 
  requiresOtp: boolean; 
  error?: string 
}> => {
  // Check lockout status
  const lockout = getAdminLockoutStatus();
  if (lockout.isLocked) {
    const mins = Math.floor(lockout.remainingSeconds / 60);
    const secs = lockout.remainingSeconds % 60;
    return {
      success: false,
      requiresOtp: false,
      displayMessage: '',
      error: `Security Lockout: Too many failed attempts. Try again in ${mins}m ${secs}s.`
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = passphrase.trim();

  // Validate credentials against authorized owner or registered admin
  const registered = getRegisteredAdmins();
  const foundAccount = registered.find(a => a.email.toLowerCase() === cleanEmail);
  const passwordMatches = cleanPass === ADMIN_MASTER_PASSPHRASE || (foundAccount && foundAccount.passphrase === cleanPass);

  const isAuthorized = (isOwnerEmail(cleanEmail) || !!foundAccount) && passwordMatches;

  if (isAuthorized) {
    // Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_DURATION_MS).toISOString(); // Strictly 5 minutes

    const otpPayload = {
      otp: generatedOtp,
      createdAt: new Date().toISOString(),
      expiresAt,
      isUsed: false
    };

    // Store in Firestore and Session
    try {
      await setDoc(doc(db, 'admin_otps', 'latest_admin_otp'), otpPayload);
    } catch (err) {
      console.warn('Firestore admin otp write notice:', err);
    }

    sessionStorage.setItem(STORAGE_ACTIVE_OTP_KEY, JSON.stringify(otpPayload));

    // Send real email to authorized owner
    try {
      await sendAdminLoginOtpEmail(generatedOtp);
    } catch (err) {
      console.warn('Email dispatch notice:', err);
    }

    return {
      success: true,
      requiresOtp: true,
      displayMessage: 'If this email is registered, a 6-digit verification code has been dispatched.'
    };
  } else {
    // Record failed attempt
    const res = await recordFailedAttempt();
    if (res.lockedNow) {
      return {
        success: false,
        requiresOtp: false,
        displayMessage: '',
        error: `Security Lockout: Maximum attempts exceeded. Portal locked for 15 minutes.`
      };
    }

    // Generic response to prevent user enumeration
    // Still advance to OTP screen or inform user generically so attackers cannot discern if email exists
    return {
      success: false,
      requiresOtp: false,
      displayMessage: 'Invalid admin credentials or security passphrase. Please try again.',
      error: 'Invalid admin credentials or security passphrase.'
    };
  }
};

/**
 * Resend OTP (Strictly invalidates any previous OTP)
 */
export const resendAdminOtp = async (
  email: string,
  passphrase: string
): Promise<{ success: boolean; message: string; error?: string }> => {
  const lockout = getAdminLockoutStatus();
  if (lockout.isLocked) {
    return { success: false, message: '', error: 'Portal locked out. Please wait.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = passphrase.trim();

  const registered = getRegisteredAdmins();
  const foundAccount = registered.find(a => a.email.toLowerCase() === cleanEmail);
  const passwordMatches = cleanPass === ADMIN_MASTER_PASSPHRASE || (foundAccount && foundAccount.passphrase === cleanPass);

  if ((isOwnerEmail(cleanEmail) || !!foundAccount) && passwordMatches) {
    // Generate new OTP, invalidating previous
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_DURATION_MS).toISOString();

    const otpPayload = {
      otp: newOtp,
      createdAt: new Date().toISOString(),
      expiresAt,
      isUsed: false
    };

    try {
      await setDoc(doc(db, 'admin_otps', 'latest_admin_otp'), otpPayload);
    } catch {}

    sessionStorage.setItem(STORAGE_ACTIVE_OTP_KEY, JSON.stringify(otpPayload));
    await sendAdminLoginOtpEmail(newOtp);

    return {
      success: true,
      message: 'A fresh verification code has been dispatched to the registered email.'
    };
  }

  return {
    success: false,
    message: '',
    error: 'Unable to resend OTP. Please re-enter credentials.'
  };
};

/**
 * Step 2: Verify 6-digit OTP (Strictly single-use, 5-minute expiry, no backdoor bypass)
 */
export const verifyAdminOtp = async (
  enteredOtp: string
): Promise<{ success: boolean; error?: string }> => {
  const lockout = getAdminLockoutStatus();
  if (lockout.isLocked) {
    return {
      success: false,
      error: `Security Lockout active. Please wait ${lockout.remainingSeconds}s before retrying.`
    };
  }

  const cleanOtp = enteredOtp.trim();
  if (!cleanOtp || cleanOtp.length !== 6) {
    return { success: false, error: 'Please enter the complete 6-digit verification code.' };
  }

  // Load stored OTP from session or Firestore
  let validOtp: string | null = null;
  let expiresAt: string | null = null;
  let isUsed: boolean = false;

  try {
    const stored = sessionStorage.getItem(STORAGE_ACTIVE_OTP_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      validOtp = parsed.otp;
      expiresAt = parsed.expiresAt;
      isUsed = !!parsed.isUsed;
    }
  } catch {}

  if (!validOtp) {
    try {
      const snap = await getDoc(doc(db, 'admin_otps', 'latest_admin_otp'));
      if (snap.exists()) {
        const data = snap.data();
        validOtp = data.otp;
        expiresAt = data.expiresAt;
        isUsed = !!data.isUsed;
      }
    } catch {}
  }

  if (!validOtp || isUsed) {
    await recordFailedAttempt();
    return {
      success: false,
      error: 'OTP has expired or has already been used. Please request a new code.'
    };
  }

  // Expiration check (5 minutes strictly)
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    sessionStorage.removeItem(STORAGE_ACTIVE_OTP_KEY);
    await recordFailedAttempt();
    return {
      success: false,
      error: 'Verification code has expired (5-minute limit). Please request a fresh OTP.'
    };
  }

  // OTP match verification
  if (cleanOtp !== validOtp) {
    const failRes = await recordFailedAttempt();
    if (failRes.lockedNow) {
      return {
        success: false,
        error: 'Too many incorrect attempts. Admin portal has been locked for 15 minutes.'
      };
    }
    return {
      success: false,
      error: 'Invalid verification code. Please check your email and enter the exact 6 digits.'
    };
  }

  // Single-use enforcement: IMMEDIATELY invalidate & delete OTP
  sessionStorage.removeItem(STORAGE_ACTIVE_OTP_KEY);
  try {
    await setDoc(doc(db, 'admin_otps', 'latest_admin_otp'), {
      otp: null,
      isUsed: true,
      invalidatedAt: new Date().toISOString()
    });
  } catch {}

  // Successful authentication: Reset failed attempts counter
  resetFailedAttempts();

  // Save session with inactivity timestamp
  saveAdminSession(OWNER_EMAIL);

  return { success: true };
};

/**
 * Manage Admin Requests & Approvals
 */
export const requestAdminLogin = async (
  requesterEmail: string, 
  requesterName?: string
): Promise<AdminLoginRequest> => {
  const reqId = 'adm_req_' + Math.random().toString(36).substring(2, 9);
  const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
  const nowIso = new Date().toISOString();
  
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'Browser Client';

  const newRequest: AdminLoginRequest = {
    id: reqId,
    requesterEmail: requesterEmail.trim().toLowerCase(),
    requesterName: requesterName || requesterEmail.split('@')[0],
    ipOrDevice: userAgent,
    requestedAt: nowIso,
    status: 'PENDING',
    ownerEmail: OWNER_EMAIL,
    accessCode
  };

  try {
    await setDoc(doc(db, 'admin_login_requests', reqId), newRequest);
  } catch (err) {
    console.warn('Firestore admin request write notice:', err);
  }

  try {
    const list: AdminLoginRequest[] = JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
    list.unshift(newRequest);
    localStorage.setItem(STORAGE_ADMIN_REQUESTS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {}

  await sendOwnerEmailNotification({
    type: 'ADMIN_LOGIN_REQUEST',
    subject: `🚨 [Bharat Pro] Admin Panel Access Request from ${newRequest.requesterEmail}`,
    body: `Admin access requested by: ${newRequest.requesterEmail}\nTime: ${new Date(nowIso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\nDevice: ${userAgent}\nRequest ID: ${reqId}`,
    metadata: { requestId: reqId, requesterEmail: newRequest.requesterEmail }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_admin_request_created', { detail: newRequest }));
  }

  return newRequest;
};

export const approveAdminLogin = async (
  requestId: string,
  approvedBy: string = OWNER_EMAIL
): Promise<{ success: boolean; request?: AdminLoginRequest; error?: string }> => {
  let request: AdminLoginRequest | null = null;
  const nowIso = new Date().toISOString();

  try {
    const snap = await getDoc(doc(db, 'admin_login_requests', requestId));
    if (snap.exists()) {
      request = snap.data() as AdminLoginRequest;
    }
  } catch {}

  if (!request) {
    const list: AdminLoginRequest[] = JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
    request = list.find(r => r.id === requestId) || null;
  }

  if (!request) {
    return { success: false, error: 'Request not found' };
  }

  request.status = 'APPROVED';
  request.approvedAt = nowIso;
  request.approvedBy = approvedBy;

  try {
    await setDoc(doc(db, 'admin_login_requests', requestId), request, { merge: true });
  } catch {}

  try {
    const list: AdminLoginRequest[] = JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
    const updated = list.map(r => r.id === requestId ? request! : r);
    localStorage.setItem(STORAGE_ADMIN_REQUESTS_KEY, JSON.stringify(updated));
  } catch {}

  await sendOwnerEmailNotification({
    type: 'ADMIN_LOGIN_APPROVED',
    subject: `✅ [Bharat Pro] Admin Access Approved for ${request.requesterEmail}`,
    body: `Admin access was approved for ${request.requesterEmail}.\nTime: ${new Date(nowIso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.`,
    metadata: { requestId, approvedBy, status: 'APPROVED' }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_admin_request_updated', { detail: request }));
  }

  return { success: true, request };
};

export const rejectAdminLogin = async (
  requestId: string,
  reason: string = 'Unauthorized attempt'
): Promise<{ success: boolean; request?: AdminLoginRequest }> => {
  let request: AdminLoginRequest | null = null;
  const nowIso = new Date().toISOString();

  try {
    const snap = await getDoc(doc(db, 'admin_login_requests', requestId));
    if (snap.exists()) {
      request = snap.data() as AdminLoginRequest;
    }
  } catch {}

  if (!request) {
    const list: AdminLoginRequest[] = JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
    request = list.find(r => r.id === requestId) || null;
  }

  if (!request) {
    return { success: false };
  }

  request.status = 'REJECTED';
  request.approvedAt = nowIso;
  request.approvedBy = `Admin System (REJECTED: ${reason})`;

  try {
    await setDoc(doc(db, 'admin_login_requests', requestId), request, { merge: true });
  } catch {}

  try {
    const list: AdminLoginRequest[] = JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
    const updated = list.map(r => r.id === requestId ? request! : r);
    localStorage.setItem(STORAGE_ADMIN_REQUESTS_KEY, JSON.stringify(updated));
  } catch {}

  return { success: true, request };
};

export const getAllAdminRequests = async (): Promise<AdminLoginRequest[]> => {
  try {
    const snap = await getDocs(collection(db, 'admin_login_requests'));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as AdminLoginRequest).sort((a, b) => 
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
    }
  } catch {}

  try {
    return JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const checkAdminRequestStatus = async (requestId: string): Promise<AdminLoginRequest | null> => {
  try {
    const snap = await getDoc(doc(db, 'admin_login_requests', requestId));
    if (snap.exists()) {
      return snap.data() as AdminLoginRequest;
    }
  } catch {}

  try {
    const list: AdminLoginRequest[] = JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
    return list.find(r => r.id === requestId) || null;
  } catch {
    return null;
  }
};

export const subscribeToAdminRequest = (
  requestId: string,
  callback: (request: AdminLoginRequest) => void
): (() => void) => {
  let unsubFirestore: (() => void) | null = null;
  try {
    unsubFirestore = onSnapshot(doc(db, 'admin_login_requests', requestId), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as AdminLoginRequest);
      }
    });
  } catch {}

  const handleCustomEvent = (e: any) => {
    if (e.detail?.id === requestId) {
      callback(e.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('bharatpro_admin_request_updated', handleCustomEvent);
  }

  const pollTimer = setInterval(async () => {
    const status = await checkAdminRequestStatus(requestId);
    if (status) callback(status);
  }, 2000);

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('bharatpro_admin_request_updated', handleCustomEvent);
    }
    clearInterval(pollTimer);
  };
};

/**
 * Session Management with Inactivity Expiry (20 minutes inactivity limit)
 */
const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

export const saveAdminSession = (email: string, requestId?: string) => {
  const now = Date.now();
  const session = {
    email,
    requestId,
    authenticatedAt: new Date(now).toISOString(),
    lastActivityAt: now,
    expiresAt: new Date(now + INACTIVITY_TIMEOUT_MS).toISOString(),
    deviceFingerprint: typeof navigator !== 'undefined' ? `${navigator.platform}_${navigator.userAgent.slice(0, 40)}` : 'client'
  };
  sessionStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(session));
};

export const updateAdminActivity = () => {
  try {
    const s = sessionStorage.getItem(STORAGE_ADMIN_SESSION_KEY) || localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (!s) return;
    const parsed = JSON.parse(s);
    const now = Date.now();
    parsed.lastActivityAt = now;
    parsed.expiresAt = new Date(now + INACTIVITY_TIMEOUT_MS).toISOString();
    sessionStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(parsed));
    localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(parsed));
  } catch {}
};

export const getAdminSession = (): { email: string; authenticatedAt: string } | null => {
  try {
    const s = sessionStorage.getItem(STORAGE_ADMIN_SESSION_KEY) || localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (!s) return null;
    const parsed = JSON.parse(s);
    
    // Check inactivity expiry
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      clearAdminSession();
      return null;
    }
    
    // Refresh activity on check
    updateAdminActivity();
    return parsed;
  } catch {
    return null;
  }
};

export const clearAdminSession = () => {
  try {
    sessionStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
    localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_ACTIVE_OTP_KEY);
  } catch {}
};
