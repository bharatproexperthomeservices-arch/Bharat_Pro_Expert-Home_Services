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
import { sendOwnerEmailNotification, OWNER_EMAIL } from './emailService';

const STORAGE_ADMIN_REQUESTS_KEY = 'bharat_pro_admin_requests_v1';
const STORAGE_ADMIN_SESSION_KEY = 'bharat_pro_admin_session_v1';

// Master passkey for owner emergency access or direct authorization
export const OWNER_MASTER_PIN = '892025';

// Request Admin Panel Login Access (triggers approval request to owner)
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

  // 1. Save to Firestore
  try {
    await setDoc(doc(db, 'admin_login_requests', reqId), newRequest);
  } catch (err) {
    console.warn('Firestore admin request write notice:', err);
  }

  // 2. Save to local storage
  try {
    const list: AdminLoginRequest[] = JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
    list.unshift(newRequest);
    localStorage.setItem(STORAGE_ADMIN_REQUESTS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {}

  // 3. Dispatch Email Alert to Owner
  await sendOwnerEmailNotification({
    type: 'ADMIN_LOGIN_REQUEST',
    subject: `🚨 [Bharat Pro] Admin Panel Login Approval Request from ${newRequest.requesterEmail}`,
    body: `Hello Admin / Owner,\n\nA user is requesting to login to the Bharat Pro Expert Admin Panel.\n\nDetails:\n- Requester Email: ${newRequest.requesterEmail}\n- Name: ${newRequest.requesterName}\n- Device: ${newRequest.ipOrDevice}\n- Time: ${new Date(nowIso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n- Request ID: ${reqId}\n- One-Time Authorization PIN: ${accessCode}\n\nACTION REQUIRED:\nIf you approve this login, click "Approve" in your Admin Security Center or share the Authorization PIN (${accessCode}).\nIf you do NOT recognize this user, reject the request immediately.\n\n- Bharat Pro Expert Security System`,
    metadata: { requestId: reqId, requesterEmail: newRequest.requesterEmail, accessCode }
  });

  // Broadcast event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_admin_request_created', { detail: newRequest }));
  }

  return newRequest;
};

// Owner approves admin login
export const approveAdminLogin = async (
  requestId: string,
  approvedBy: string = OWNER_EMAIL
): Promise<{ success: boolean; request?: AdminLoginRequest; error?: string }> => {
  let request: AdminLoginRequest | null = null;
  const nowIso = new Date().toISOString();

  // Try fetching from Firestore
  try {
    const snap = await getDoc(doc(db, 'admin_login_requests', requestId));
    if (snap.exists()) {
      request = snap.data() as AdminLoginRequest;
    }
  } catch {}

  // Fallback to local storage
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

  // Save to Firestore
  try {
    await setDoc(doc(db, 'admin_login_requests', requestId), request, { merge: true });
  } catch {}

  // Save to local storage
  try {
    const list: AdminLoginRequest[] = JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
    const updated = list.map(r => r.id === requestId ? request! : r);
    localStorage.setItem(STORAGE_ADMIN_REQUESTS_KEY, JSON.stringify(updated));
  } catch {}

  // Send confirmation email
  await sendOwnerEmailNotification({
    type: 'ADMIN_LOGIN_APPROVED',
    subject: `✅ [Bharat Pro] Admin Panel Access Granted to ${request.requesterEmail}`,
    body: `Admin access was APPROVED for ${request.requesterEmail} at ${new Date(nowIso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.\nApproved By: ${approvedBy}.\nRequest ID: ${requestId}.`,
    metadata: { requestId, approvedBy, status: 'APPROVED' }
  });

  // Broadcast event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_admin_request_updated', { detail: request }));
  }

  return { success: true, request };
};

// Owner rejects admin login
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
  request.approvedBy = `${OWNER_EMAIL} (REJECTED: ${reason})`;

  try {
    await setDoc(doc(db, 'admin_login_requests', requestId), request, { merge: true });
  } catch {}

  try {
    const list: AdminLoginRequest[] = JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
    const updated = list.map(r => r.id === requestId ? request! : r);
    localStorage.setItem(STORAGE_ADMIN_REQUESTS_KEY, JSON.stringify(updated));
  } catch {}

  await sendOwnerEmailNotification({
    type: 'ADMIN_LOGIN_REJECTED',
    subject: `🚫 [Bharat Pro] Admin Login REJECTED for ${request.requesterEmail}`,
    body: `Admin login request was REJECTED for ${request.requesterEmail}.\nReason: ${reason}.\nTime: ${new Date(nowIso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.`,
    metadata: { requestId, reason, status: 'REJECTED' }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_admin_request_updated', { detail: request }));
  }

  return { success: true, request };
};

// Check request status
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

// Fetch all requests
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

// Real-time listener for a specific admin request
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

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_ADMIN_REQUESTS_KEY) {
      const list: AdminLoginRequest[] = JSON.parse(localStorage.getItem(STORAGE_ADMIN_REQUESTS_KEY) || '[]');
      const found = list.find(r => r.id === requestId);
      if (found) callback(found);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('bharatpro_admin_request_updated', handleCustomEvent);
    window.addEventListener('storage', handleStorageChange);
  }

  // Active polling fallback (1.5s) to guarantee fast updates
  const pollTimer = setInterval(async () => {
    const status = await checkAdminRequestStatus(requestId);
    if (status) callback(status);
  }, 1500);

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('bharatpro_admin_request_updated', handleCustomEvent);
      window.removeEventListener('storage', handleStorageChange);
    }
    clearInterval(pollTimer);
  };
};

// Store and check authenticated admin session
export const saveAdminSession = (email: string, requestId?: string) => {
  const session = {
    email,
    requestId,
    authenticatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString() // 12 hours
  };
  sessionStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(session));
};

export const getAdminSession = (): { email: string; authenticatedAt: string } | null => {
  try {
    const s = sessionStorage.getItem(STORAGE_ADMIN_SESSION_KEY) || localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (!s) return null;
    const parsed = JSON.parse(s);
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      clearAdminSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearAdminSession = () => {
  sessionStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
  localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
};
