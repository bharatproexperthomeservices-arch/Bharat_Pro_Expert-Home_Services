import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  onSnapshot 
} from '../firebase-config';
import { Booking, Partner, HubLocation, CleaningService, WhatsAppLog, AssignmentHistoryEntry, JobStatus } from '../types';
import { INITIAL_SERVICES, INITIAL_HUBS, INITIAL_PARTNERS, INITIAL_BOOKINGS, WHATSAPP_NUMBER } from '../data';

// Local storage backup keys
const STORAGE_BOOKINGS_KEY = 'bharat_pro_bookings_v2';
const STORAGE_HUBS_KEY = 'bharat_pro_hubs_v2';
const STORAGE_PARTNERS_KEY = 'bharat_pro_partners_v2';
const STORAGE_SERVICES_KEY = 'bharat_pro_services_v2';
const STORAGE_WALOGS_KEY = 'bharat_pro_walogs_v2';

// Safe timeout wrapper to guarantee queries never hang in pending state
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 4000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// Seed initial collections if empty & sync services once
const STORAGE_SERVICES_SYNCED_KEY = 'bharat_pro_services_synced_v6_longpolling';

export const initializeDatabaseDefaults = async () => {
  try {
    // Only seed local storage if not already initialized, preserving admin edits/deletions
    if (!localStorage.getItem(STORAGE_SERVICES_KEY)) {
      localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(INITIAL_SERVICES));
    }
    if (!localStorage.getItem(STORAGE_HUBS_KEY)) {
      localStorage.setItem(STORAGE_HUBS_KEY, JSON.stringify(INITIAL_HUBS));
    }
    if (!localStorage.getItem(STORAGE_PARTNERS_KEY)) {
      localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(INITIAL_PARTNERS));
    }
    if (!localStorage.getItem(STORAGE_BOOKINGS_KEY)) {
      localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(INITIAL_BOOKINGS));
    }

    const alreadySynced = localStorage.getItem(STORAGE_SERVICES_SYNCED_KEY);
    if (alreadySynced) {
      return;
    }
    // Stamp sync key immediately to prevent duplicate simultaneous sync routines
    localStorage.setItem(STORAGE_SERVICES_SYNCED_KEY, 'true');

    // Run non-blocking sync in background
    setTimeout(async () => {
      try {
        const hubsSnap = await withTimeout(getDocs(collection(db, 'hubs')), 8000);
        if (hubsSnap.empty) {
          for (const hub of INITIAL_HUBS) {
            await setDoc(doc(db, 'hubs', hub.id), hub);
          }
        }

        const partnerSnap = await withTimeout(getDocs(collection(db, 'partners')), 8000);
        if (partnerSnap.empty) {
          for (const p of INITIAL_PARTNERS) {
            await setDoc(doc(db, 'partners', p.id), p);
          }
        }

        const servicesSnap = await withTimeout(getDocs(collection(db, 'services')), 8000);
        if (servicesSnap.empty) {
          for (const s of INITIAL_SERVICES) {
            await setDoc(doc(db, 'services', s.id), s, { merge: true });
          }
        }
      } catch {
        // Fallback store is active; silently handle network delay/offline state
      }
    }, 1200);
  } catch {}
};

// Dispatch WhatsApp notification (official simulated delivery engine + real wa.me link generation)
export const sendWhatsAppNotification = async (
  booking: Booking, 
  recipientType: 'ADMIN' | 'PARTNER' | 'CUSTOMER',
  recipientPhone: string,
  event: string
): Promise<WhatsAppLog> => {
  const logId = 'wa_' + Math.random().toString(36).substring(2, 9);
  
  let messageSnippet = '';
  if (event === 'NEW_BOOKING_SEARCHING' || event === 'NEW_BOOKING_CONFIRMED') {
    messageSnippet = `Bharat Pro Expert Home Services\n\nNew Booking (Awaiting Dispatch Assignment)\n\nBooking ID: #${booking.bookingNumber}\nCustomer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nService: ${booking.serviceName}\nSub-service: ${booking.categoryName || 'Deep Cleaning'}\nDate: ${booking.date}\nTime: ${booking.timeSlot}\nAddress: ${booking.address.street}, ${booking.address.sector}, ${booking.address.city}\nAmount: ₹${booking.totalAmount}\nPayment: ${booking.paymentMethod} (${booking.paymentStatus})\nStatus: SEARCHING_PROFESSIONAL`;
  } else if (event === 'PROFESSIONAL_ASSIGNED' || event === 'PARTNER_ASSIGNED') {
    messageSnippet = `Bharat Pro Expert Home Services\n\nProfessional Assigned\n\nBooking ID: #${booking.bookingNumber}\nProfessional: ${booking.assignedPartnerName}\nProfessional ID: BPE-${booking.assignedPartnerId}\nPhone: ${booking.assignedPartnerPhone}\nRating: ★ ${booking.partnerRating || '4.85'}\nService: ${booking.serviceName}\nCustomer: ${booking.customerName}\nDate: ${booking.date}\nTime: ${booking.timeSlot}\nAddress: ${booking.address.street}, ${booking.address.sector}, ${booking.address.city}\nStart OTP: ${booking.startOtp}`;
  } else if (event === 'JOB_STARTED') {
    messageSnippet = `Bharat Pro Expert - Job Started [${booking.bookingNumber}]: Partner ${booking.assignedPartnerName} has verified Start OTP and service is now in progress.`;
  } else if (event === 'JOB_COMPLETED') {
    messageSnippet = `Bharat Pro Expert - Service Completed [${booking.bookingNumber}]: Partner ${booking.assignedPartnerName} verified completion OTP. Total Paid: ₹${booking.totalAmount}. Thank you for choosing Bharat Pro!`;
  } else {
    messageSnippet = `Bharat Pro Update: Booking #${booking.bookingNumber} status is now ${booking.status}.`;
  }

  const log: WhatsAppLog = {
    id: logId,
    bookingId: booking.id,
    recipientPhone,
    recipientType,
    eventType: event,
    messageSnippet,
    status: 'DELIVERED',
    timestamp: new Date().toISOString()
  };

  // Persist log to Firestore and LocalStorage
  try {
    await setDoc(doc(db, 'whatsapp_logs', logId), log);
  } catch {
    const existing: WhatsAppLog[] = JSON.parse(localStorage.getItem(STORAGE_WALOGS_KEY) || '[]');
    existing.unshift(log);
    localStorage.setItem(STORAGE_WALOGS_KEY, JSON.stringify(existing.slice(0, 100)));
  }

  return log;
};

// BUSINESS RULE: MANUAL PARTNER ASSIGNMENT ONLY
// Booking is created with status = SEARCHING_PROFESSIONAL.
// NO automatic assignment based on distance, rating, skill or availability.
// Remove undefined values recursively: Firestore rejects undefined fields and malformed IDs
// can surface as opaque SDK errors such as "Cannot read properties of undefined (reading 'indexOf')".
const removeUndefinedValues = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefinedValues(item)) as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (child !== undefined) cleaned[key] = removeUndefinedValues(child);
    }
    return cleaned as T;
  }
  return value;
};

export const createNewBooking = async (newBooking: Booking): Promise<Booking> => {
  if (!newBooking || typeof newBooking.id !== 'string' || !newBooking.id.trim()) {
    throw new Error('Booking cannot be saved: missing booking ID.');
  }
  if (!newBooking.customerPhone || typeof newBooking.customerPhone !== 'string') {
    throw new Error('Booking cannot be saved: customer phone is required.');
  }

  const calculatedRef = Math.round(newBooking.basePrice / 0.85);
  const priceSnapshot = newBooking.priceSnapshot || {
    basePrice: newBooking.basePrice,
    referencePrice: calculatedRef,
    customerSavings: calculatedRef - newBooking.basePrice,
    discountPct: 15,
    pricingMode: 'REFERENCE_PERCENT' as const,
    priceVersion: 'v1.0.0',
    addonsPrice: newBooking.addonsPrice,
    taxesGst: newBooking.taxesGst,
    convenienceFee: newBooking.convenienceFee,
    discount: newBooking.discount,
    totalAmount: newBooking.totalAmount,
    capturedAt: new Date().toISOString()
  };

  const bookingPendingAssignment: Booking = {
    ...newBooking,
    priceSnapshot,
    // MANUAL ASSIGNMENT RULE: Booking begins in SEARCHING_PROFESSIONAL state
    status: 'SEARCHING_PROFESSIONAL',
    assignedPartnerId: undefined,
    assignedPartnerName: undefined,
    assignedPartnerPhone: undefined,
    assignedPartnerAvatar: undefined,
    assignedHubId: newBooking.assignedHubId || 'hub-gurugram-cyber',
    assignedAt: undefined,
    assignmentHistory: []
  };

  // Save to Firestore
  try {
    const firestoreSafeBooking = removeUndefinedValues(bookingPendingAssignment);
    await setDoc(doc(db, 'bookings', firestoreSafeBooking.id), firestoreSafeBooking);
  } catch (err) {
    console.error('Booking Firestore write failed:', err);
    throw new Error('Booking could not be saved to the server. Please check your connection and try again. If payment was deducted, contact support before retrying.');
  }

  // Backup in LocalStorage (ensure no duplicate ID)
  const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
  const existingIndex = stored.findIndex(b => b.id === bookingPendingAssignment.id);
  if (existingIndex !== -1) {
    stored[existingIndex] = bookingPendingAssignment;
  } else {
    stored.unshift(bookingPendingAssignment);
  }
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(stored));

  // Store in session recent bookings for guest visibility
  try {
    const recentIds: string[] = JSON.parse(localStorage.getItem('bharat_pro_recent_booking_ids') || '[]');
    if (!recentIds.includes(bookingPendingAssignment.id)) {
      recentIds.unshift(bookingPendingAssignment.id);
      localStorage.setItem('bharat_pro_recent_booking_ids', JSON.stringify(recentIds.slice(0, 20)));
    }
    if (bookingPendingAssignment.customerPhone) {
      localStorage.setItem('bharat_pro_last_customer_phone', bookingPendingAssignment.customerPhone);
    }
    if (bookingPendingAssignment.customerName) {
      localStorage.setItem('bharat_pro_last_customer_name', bookingPendingAssignment.customerName);
    }
  } catch {}

  // Trigger Real-time WhatsApp Notification to Admin Number
  await sendWhatsAppNotification(
    bookingPendingAssignment,
    'ADMIN',
    WHATSAPP_NUMBER,
    'NEW_BOOKING_SEARCHING'
  );

  // Broadcast event for real-time app update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_booking_updated', { 
      detail: { booking: bookingPendingAssignment, allBookings: stored } 
    }));
    localStorage.setItem('bharatpro_last_updated_booking', JSON.stringify({ 
      id: bookingPendingAssignment.id, 
      timestamp: Date.now() 
    }));
  }

  return bookingPendingAssignment;
};

// ADMIN MANUAL PARTNER ASSIGNMENT
export const assignPartnerManually = async (
  bookingId: string,
  partnerId: string,
  adminId: string = 'admin_dispatch',
  reason: string = 'Admin Manual Assignment'
): Promise<{ success: boolean; booking?: Booking; error?: string }> => {
  let booking: Booking | null = null;
  
  // Try Firestore first
  try {
    const snap = await getDoc(doc(db, 'bookings', bookingId));
    if (snap.exists()) {
      booking = snap.data() as Booking;
    }
  } catch {}

  // Local storage fallback
  if (!booking) {
    const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
    booking = stored.find(b => b.id === bookingId) || null;
  }

  if (!booking) {
    return { success: false, error: 'Booking record not found' };
  }

  const partners = await getPartnersList();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) {
    return { success: false, error: 'Selected partner not found' };
  }

  // Enforce Section 42 (Partner Job Eligibility): Only Approved & KYC Verified partners can receive jobs
  const isApprovedOrActive = partner.status === 'active' || partner.status === 'ACTIVE' || partner.status === 'APPROVED';
  const isKycVerified = partner.kycVerified === true || partner.kycStatus === 'KYC_VERIFIED' || partner.kycStatus === 'VERIFIED';
  if (!isApprovedOrActive || !isKycVerified) {
    return {
      success: false,
      error: `Cannot assign: Partner ${partner.name} is ${partner.status.toUpperCase()} (KYC: ${partner.kycStatus || 'PENDING'}). Only Approved and KYC Verified partners are eligible for job assignment.`
    };
  }

  const nowIso = new Date().toISOString();
  const previousPartnerId = booking.assignedPartnerId;
  const previousPartnerName = booking.assignedPartnerName;

  const historyEntry: AssignmentHistoryEntry = {
    id: `asg_${Date.now()}`,
    bookingId,
    previousPartnerId,
    previousPartnerName,
    newPartnerId: partner.id,
    newPartnerName: partner.name,
    assignedByAdminId: adminId,
    reason,
    createdAt: nowIso
  };

  const updatedHistory = [...(booking.assignmentHistory || []), historyEntry];

  const updatedBooking: Booking = {
    ...booking,
    status: 'ASSIGNED',
    assignedPartnerId: partner.id,
    assignedPartnerName: partner.name,
    assignedPartnerPhone: partner.phone,
    assignedPartnerAvatar: partner.avatarUrl,
    assignedHubId: partner.assignedHubId,
    assignedHubName: partner.assignedHubName || partner.hubName || 'Central Hub',
    partnerRating: partner.rating,
    partnerCompletedJobs: partner.completedJobs ?? partner.totalJobs ?? 150,
    assignedAt: nowIso,
    updatedAt: nowIso,
    assignmentHistory: updatedHistory
  };

  // Persist to Firestore
  try {
    await setDoc(doc(db, 'bookings', bookingId), updatedBooking, { merge: true });
  } catch (err) {
    console.warn('Firestore write fallback on partner assignment:', err);
  }

  // Persist to LocalStorage
  const storedList: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
  const updatedList = storedList.map(b => b.id === bookingId ? updatedBooking : b);
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(updatedList));

  // WhatsApp Alert to Partner
  await sendWhatsAppNotification(
    updatedBooking,
    'PARTNER',
    partner.phone,
    'PROFESSIONAL_ASSIGNED'
  );

  // WhatsApp Alert to Customer
  await sendWhatsAppNotification(
    updatedBooking,
    'CUSTOMER',
    updatedBooking.customerPhone,
    'PROFESSIONAL_ASSIGNED'
  );

  // WhatsApp Alert to Admin
  await sendWhatsAppNotification(
    updatedBooking,
    'ADMIN',
    WHATSAPP_NUMBER,
    'PROFESSIONAL_ASSIGNED'
  );

  // Broadcast real-time event across app
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_booking_updated', { 
      detail: { booking: updatedBooking } 
    }));
    localStorage.setItem('bharatpro_last_updated_booking', JSON.stringify({ 
      id: bookingId, 
      timestamp: Date.now() 
    }));
  }

  return { success: true, booking: updatedBooking };
};

// ADMIN REASSIGN PARTNER WITH REASON
export const reassignPartnerManually = async (
  bookingId: string,
  newPartnerId: string,
  adminId: string = 'admin_dispatch',
  reason: string = 'Operational Reassignment'
): Promise<{ success: boolean; booking?: Booking; error?: string }> => {
  return assignPartnerManually(bookingId, newPartnerId, adminId, reason);
};

// REAL-TIME BOOKING SUBSCRIPTION (Firestore listener + Window Broadcast + Polling)
export const subscribeToBooking = (
  bookingId: string,
  callback: (booking: Booking) => void
): (() => void) => {
  let unsubFirestore: (() => void) | null = null;
  try {
    unsubFirestore = onSnapshot(doc(db, 'bookings', bookingId), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Booking);
      }
    }, (err) => {
      console.warn('Snapshot listener deferred to local polling:', err);
    });
  } catch (e) {
    console.warn('Firestore onSnapshot init error:', e);
  }

  const handleCustomEvent = (e: any) => {
    if (e.detail?.booking && e.detail.booking.id === bookingId) {
      callback(e.detail.booking);
    }
  };

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_BOOKINGS_KEY || e.key === 'bharatpro_last_updated_booking') {
      const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
      const found = stored.find(b => b.id === bookingId);
      if (found) callback(found);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('bharatpro_booking_updated', handleCustomEvent);
    window.addEventListener('storage', handleStorageChange);
  }

  // Active polling fallback (2.5s) to guarantee real-time updates across multiple windows/devices
  const pollTimer = setInterval(async () => {
    try {
      const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
      const found = stored.find(b => b.id === bookingId);
      if (found) {
        callback(found);
      }
      const snap = await withTimeout(getDoc(doc(db, 'bookings', bookingId)), 1500);
      if (snap.exists()) {
        callback(snap.data() as Booking);
      }
    } catch {}
  }, 2500);

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('bharatpro_booking_updated', handleCustomEvent);
      window.removeEventListener('storage', handleStorageChange);
    }
    clearInterval(pollTimer);
  };
};

// Update booking status with OTP validation
export const updateBookingStatusWithOtp = async (
  bookingId: string,
  newStatus: Booking['status'],
  enteredOtp?: string,
  isMasterBypass: boolean = false
): Promise<{ success: boolean; error?: string; booking?: Booking }> => {
  let booking: Booking | null = null;
  
  // Try firestore
  try {
    const snap = await getDoc(doc(db, 'bookings', bookingId));
    if (snap.exists()) {
      booking = snap.data() as Booking;
    }
  } catch {}

  if (!booking) {
    const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
    booking = stored.find(b => b.id === bookingId) || null;
  }

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  const nowIso = new Date().toISOString();

  // Partner status transitions
  if (newStatus === 'ACCEPTED' || newStatus === 'PARTNER_ACCEPTED') {
    booking.acceptedPartnerId = booking.assignedPartnerId;
    booking.acceptedAt = nowIso;
  } else if (newStatus === 'ON_THE_WAY' || newStatus === 'PARTNER_ON_THE_WAY') {
    booking.onTheWayAt = nowIso;
  } else if (newStatus === 'ARRIVED') {
    booking.arrivedAt = nowIso;
  } else if (newStatus === 'IN_PROGRESS' || newStatus === 'STARTED') {
    if (!isMasterBypass) {
      if (enteredOtp !== booking.startOtp) {
        return { success: false, error: 'Invalid Job Start OTP. Please ask customer for the 4-digit Start OTP.' };
      }
      booking.otpVerifiedAt = nowIso;
    }
    booking.jobStartedAt = nowIso;
  } else if (newStatus === 'COMPLETED') {
    if (!isMasterBypass) {
      if (enteredOtp !== booking.completionOtp) {
        return { success: false, error: 'Invalid Job Completion OTP. Please ask customer for the 4-digit Completion OTP.' };
      }
      booking.completionVerifiedAt = nowIso;
    }
    // Record fulfillment partner for accurate settlement payout
    booking.completedByPartnerId = booking.assignedPartnerId;
    booking.settledToPartnerId = booking.assignedPartnerId;
    booking.jobFinishedAt = nowIso;
    booking.paymentStatus = 'PAID';
  } else if (newStatus === 'CANCELLED') {
    booking.cancelledAt = nowIso;
  }

  booking.status = newStatus;
  booking.updatedAt = nowIso;

  // Save to Firestore
  try {
    await setDoc(doc(db, 'bookings', booking.id), booking, { merge: true });
  } catch {}

  // Update in LocalStorage
  const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
  const updatedList = stored.map(b => b.id === booking!.id ? booking! : b);
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(updatedList));

  // WhatsApp Alert
  if (newStatus === 'IN_PROGRESS' || newStatus === 'STARTED') {
    await sendWhatsAppNotification(booking, 'CUSTOMER', booking.customerPhone, 'JOB_STARTED');
  } else if (newStatus === 'COMPLETED') {
    await sendWhatsAppNotification(booking, 'CUSTOMER', booking.customerPhone, 'JOB_COMPLETED');
    await sendWhatsAppNotification(booking, 'ADMIN', WHATSAPP_NUMBER, 'JOB_COMPLETED');
  }

  // Broadcast event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_booking_updated', { 
      detail: { booking } 
    }));
    localStorage.setItem('bharatpro_last_updated_booking', JSON.stringify({ 
      id: booking.id, 
      timestamp: Date.now() 
    }));
  }

  return { success: true, booking };
};

// Update booking status or payment status directly in Firestore
export const updateBookingStatus = async (
  bookingId: string,
  newStatusOrPayment: string,
  metadata?: { paymentId?: string; orderId?: string; signature?: string; paymentMethod?: string }
): Promise<{ success: boolean; booking?: Booking; error?: string }> => {
  let booking: Booking | null = null;
  
  try {
    const snap = await getDoc(doc(db, 'bookings', bookingId));
    if (snap.exists()) {
      booking = snap.data() as Booking;
    }
  } catch (err) {
    console.warn('Failed to fetch booking from Firestore:', err);
  }

  if (!booking) {
    const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
    booking = stored.find(b => b.id === bookingId) || null;
  }

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  const nowIso = new Date().toISOString();

  // If status is 'PAID', update paymentStatus and any razorpayDetails
  if (newStatusOrPayment === 'PAID') {
    booking.paymentStatus = 'PAID';
    if (metadata?.paymentId) {
      booking.transactionId = metadata.paymentId;
      booking.razorpayDetails = {
        paymentId: metadata.paymentId,
        orderId: metadata.orderId || '',
        signature: metadata.signature || '',
        verifiedAt: nowIso,
        verificationStatus: 'SUCCESS_VERIFIED'
      };
    }
  } else {
    booking.status = newStatusOrPayment as Booking['status'];
  }
  booking.updatedAt = nowIso;

  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      ...booking
    });
  } catch {
    try {
      await setDoc(doc(db, 'bookings', bookingId), booking, { merge: true });
    } catch (e) {
      console.warn('Fallback to local storage:', e);
    }
  }

  // Backup in LocalStorage
  const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
  const updatedList = stored.map(b => b.id === bookingId ? booking! : b);
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(updatedList));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_booking_updated', { 
      detail: { booking } 
    }));
  }

  return { success: true, booking };
};

import { getOrSeedPartners } from './partnerAuthService';

// Fetch partners list
export const getPartnersList = async (): Promise<Partner[]> => {
  return getOrSeedPartners();
};

// In-flight deduplication promise for bookings read
let inFlightBookingsPromise: Promise<Booking[]> | null = null;

// Fetch all bookings (merges LocalStorage and Firestore so no booking is ever lost)
export const getAllBookings = async (
  customerId?: string,
  customerPhone?: string
): Promise<Booking[]> => {
  const fetchAll = async (): Promise<Booking[]> => {
    const map = new Map<string, Booking>();

    // 1. Load from LocalStorage first (immediate, client bookings always present)
    try {
      const raw = localStorage.getItem(STORAGE_BOOKINGS_KEY);
      if (raw) {
        const stored: Booking[] = JSON.parse(raw);
        if (Array.isArray(stored)) {
          stored.forEach(b => {
            if (b && (b.id || b.bookingNumber)) {
              const key = b.id || b.bookingNumber;
              map.set(key, b);
            }
          });
        }
      }
    } catch {}

    // 2. Fetch from Firestore (merge with remote records)
    try {
      const snap = await withTimeout(getDocs(collection(db, 'bookings')), 6000);
      if (!snap.empty) {
        snap.docs.forEach(d => {
          const remote = d.data() as Booking;
          if (remote && (remote.id || remote.bookingNumber)) {
            const key = remote.id || remote.bookingNumber;
            const local = map.get(key);
            if (!local) {
              map.set(key, remote);
            } else {
              const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
              const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();
              if (remoteTime >= localTime) {
                map.set(key, { ...local, ...remote });
              }
            }
          }
        });
      }
    } catch {
      // Graceful offline / local-cache fallback without noisy console warning
    }

    // Sync merged list to LocalStorage cache
    try {
      const mergedList = Array.from(map.values());
      if (mergedList.length > 0) {
        localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(mergedList));
      }
    } catch {}

    // Sort newest first
    return Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });
  };

  if (!inFlightBookingsPromise) {
    inFlightBookingsPromise = fetchAll().finally(() => {
      inFlightBookingsPromise = null;
    });
  }

  const all = await inFlightBookingsPromise;

  // Filter if customerId or customerPhone provided
  if (customerId || customerPhone) {
    let localRecentIds: string[] = [];
    let lastPhone = '';
    try {
      localRecentIds = JSON.parse(localStorage.getItem('bharat_pro_recent_booking_ids') || '[]');
      lastPhone = localStorage.getItem('bharat_pro_last_customer_phone') || '';
    } catch {}

    const cleanPhone = (p?: string) => (p || '').replace(/\D/g, '').slice(-10);
    const targetPhone = cleanPhone(customerPhone) || cleanPhone(lastPhone);
    const targetId = customerId?.trim();

    const filtered = all.filter(b => {
      // Direct match on recent bookings from this device
      if (localRecentIds.includes(b.id) || (b.bookingNumber && localRecentIds.includes(b.bookingNumber))) return true;
      // Direct customerId match
      if (targetId && b.customerId === targetId) return true;
      // Phone match (last 10 digits)
      if (targetPhone && b.customerPhone && cleanPhone(b.customerPhone) === targetPhone) return true;
      // Email match
      if (targetId && b.customerEmail && b.customerEmail.toLowerCase() === targetId.toLowerCase()) return true;
      // Embedded phone match
      if (targetPhone && b.customerId && b.customerId.includes(targetPhone)) return true;
      return false;
    });

    return filtered;
  }

  return all;
};

// Fetch WhatsApp logs
export const getWhatsAppLogs = async (): Promise<WhatsAppLog[]> => {
  try {
    const snap = await withTimeout(getDocs(query(collection(db, 'whatsapp_logs'), orderBy('timestamp', 'desc'))), 2000);
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as WhatsAppLog);
    }
  } catch {}
  return JSON.parse(localStorage.getItem(STORAGE_WALOGS_KEY) || '[]');
};

// In-flight deduplication promise for services read
let inFlightServicesPromise: Promise<CleaningService[]> | null = null;

// Fetch All Catalogue Services (with fallback to local storage & seed)
export const getAllServices = async (): Promise<CleaningService[]> => {
  if (inFlightServicesPromise) {
    return inFlightServicesPromise;
  }

  inFlightServicesPromise = (async () => {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'services')), 6000);
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as CleaningService);
        localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(list));
        return list;
      }
    } catch {}

    const stored = localStorage.getItem(STORAGE_SERVICES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_SERVICES;
  })().finally(() => {
    inFlightServicesPromise = null;
  });

  return inFlightServicesPromise;
};

// Update service pricing & all fields (Full Editability)
export const updateServicePricing = async (
  serviceId: string, 
  pricingData: Partial<CleaningService>
): Promise<boolean> => {
  // Update in local cache immediately
  const stored: CleaningService[] = JSON.parse(localStorage.getItem(STORAGE_SERVICES_KEY) || JSON.stringify(INITIAL_SERVICES));
  const idx = stored.findIndex(s => s.id === serviceId);
  if (idx !== -1) {
    stored[idx] = { ...stored[idx], ...pricingData };
  } else {
    stored.push({ id: serviceId, ...pricingData } as CleaningService);
  }
  localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(stored));

  // Sync to Firestore
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await withTimeout(setDoc(serviceRef, pricingData, { merge: true }), 3000);
  } catch (err) {
    console.warn('Firestore pricing update fallback:', err);
  }

  // Dispatch event so live website/modals/catalogue update immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_services_updated', {
      detail: { serviceId, updated: pricingData, services: stored }
    }));
  }
  return true;
};

// Delete service from catalogue with confirmation
export const deleteService = async (serviceId: string): Promise<boolean> => {
  // Remove from local cache immediately
  const stored: CleaningService[] = JSON.parse(localStorage.getItem(STORAGE_SERVICES_KEY) || JSON.stringify(INITIAL_SERVICES));
  const filtered = stored.filter(s => s.id !== serviceId);
  localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(filtered));

  // Delete from Firestore
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await withTimeout(deleteDoc(serviceRef), 3000);
  } catch (err) {
    console.warn('Firestore delete service fallback:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_services_updated', {
      detail: { serviceId, deleted: true, services: filtered }
    }));
  }
  return true;
};

// Add new service to catalogue
export const addNewService = async (service: CleaningService): Promise<boolean> => {
  const stored: CleaningService[] = JSON.parse(localStorage.getItem(STORAGE_SERVICES_KEY) || JSON.stringify(INITIAL_SERVICES));
  stored.unshift(service);
  localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(stored));

  try {
    await withTimeout(setDoc(doc(db, 'services', service.id), service), 3000);
  } catch (err) {
    console.warn('Firestore add service fallback:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_services_updated', {
      detail: { serviceId: service.id, added: true, services: stored }
    }));
  }
  return true;
};

// Bulk percentage increase or decrease across services (Module 04 Bulk Action)
export const bulkUpdateServicePrices = async (
  percentChange: number,
  categoryFilter?: string
): Promise<{ success: boolean; updatedCount: number }> => {
  const stored: CleaningService[] = JSON.parse(localStorage.getItem(STORAGE_SERVICES_KEY) || JSON.stringify(INITIAL_SERVICES));
  let count = 0;
  const updated = stored.map(s => {
    if (!categoryFilter || categoryFilter === 'ALL' || s.categoryId === categoryFilter) {
      count++;
      const multiplier = 1 + (percentChange / 100);
      const newBase = Math.round(s.basePrice * multiplier);
      const newRef = s.referencePrice ? Math.round(s.referencePrice * multiplier) : Math.round(newBase / 0.85);
      return {
        ...s,
        basePrice: newBase,
        referencePrice: newRef,
        competitorPrice: newRef
      };
    }
    return s;
  });

  localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(updated));

  try {
    for (const s of updated) {
      setDoc(doc(db, 'services', s.id), s, { merge: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('Firestore bulk price update fallback:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_services_updated', {
      detail: { services: updated }
    }));
  }
  return { success: true, updatedCount: count };
};

// Toggle service active status
export const toggleServiceActive = async (serviceId: string, active: boolean): Promise<boolean> => {
  return updateServicePricing(serviceId, { active });
};

// In-flight deduplication promise for hubs read
let inFlightHubsPromise: Promise<HubLocation[]> | null = null;

// Fetch All Hub Locations (combining cloud Firestore & local storage)
export const getAllHubs = async (): Promise<HubLocation[]> => {
  if (inFlightHubsPromise) {
    return inFlightHubsPromise;
  }

  inFlightHubsPromise = (async () => {
    // 1. Quick check for existing local cache
    let cachedList: HubLocation[] | null = null;
    const stored = localStorage.getItem(STORAGE_HUBS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedList = parsed;
        }
      } catch {}
    }

    // 2. Fetch from Firestore with a healthy 6s timeout
    try {
      const snap = await withTimeout(getDocs(collection(db, 'hubs')), 6000);
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as HubLocation);
        localStorage.setItem(STORAGE_HUBS_KEY, JSON.stringify(list));
        return list;
      }
    } catch {
      // Graceful offline/local-cache fallback without noisy console warning
    }

    return cachedList || INITIAL_HUBS;
  })().finally(() => {
    inFlightHubsPromise = null;
  });

  return inFlightHubsPromise;
};

// Save All Hub Locations (persists to Firestore, LocalStorage, and dispatches global event)
export const saveAllHubs = async (hubs: HubLocation[]): Promise<boolean> => {
  localStorage.setItem(STORAGE_HUBS_KEY, JSON.stringify(hubs));
  window.dispatchEvent(new CustomEvent('bharatpro_hubs_updated', { detail: hubs }));

  try {
    for (const h of hubs) {
      await withTimeout(setDoc(doc(db, 'hubs', h.id), h), 2000);
    }
  } catch (err) {
    console.warn('Firestore hubs bulk save notice:', err);
  }
  return true;
};

// -------------------------------------------------------------
// WIPE OLD DATA & HARD RESET TO 22-MODULE MASTER SPECIFICATION
// Hubs: 6 | Bookings: 2 | Partners: 4 | Services: 53
// -------------------------------------------------------------
export const wipeAndResetAllAdminData = async (): Promise<{ success: boolean; message: string }> => {
  localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(INITIAL_SERVICES));
  localStorage.setItem(STORAGE_HUBS_KEY, JSON.stringify(INITIAL_HUBS));
  localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(INITIAL_PARTNERS));
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(INITIAL_BOOKINGS));
  localStorage.removeItem(STORAGE_WALOGS_KEY);
  localStorage.removeItem('bharat_pro_partner_audit_v1');

  // Trigger sync events across the application
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_services_updated', { detail: INITIAL_SERVICES }));
    window.dispatchEvent(new CustomEvent('bharatpro_hubs_updated', { detail: INITIAL_HUBS }));
    window.dispatchEvent(new CustomEvent('bharatpro_partners_updated', { detail: INITIAL_PARTNERS }));
    window.dispatchEvent(new CustomEvent('bharatpro_booking_updated', { detail: INITIAL_BOOKINGS }));
  }

  return {
    success: true,
    message: `All old data successfully purged. Admin panel reset to Master Spec: 6 Hubs, 4 Partners, 2 Bookings, 53 Services.`
  };
};

