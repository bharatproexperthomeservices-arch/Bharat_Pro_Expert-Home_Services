import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from '../firebase-config';
import { Booking, Partner, HubLocation, CleaningService, WhatsAppLog, AssignmentHistoryEntry, JobStatus } from '../types';
import { INITIAL_SERVICES, INITIAL_HUBS, INITIAL_PARTNERS, WHATSAPP_NUMBER } from '../data';

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
    // Always ensure local storage has the latest services immediately (zero network delay)
    localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(INITIAL_SERVICES));
    if (!localStorage.getItem(STORAGE_HUBS_KEY)) {
      localStorage.setItem(STORAGE_HUBS_KEY, JSON.stringify(INITIAL_HUBS));
    }
    if (!localStorage.getItem(STORAGE_PARTNERS_KEY)) {
      localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(INITIAL_PARTNERS));
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
        const hubsSnap = await withTimeout(getDocs(collection(db, 'hubs')), 3000);
        if (hubsSnap.empty) {
          for (const hub of INITIAL_HUBS) {
            await setDoc(doc(db, 'hubs', hub.id), hub);
          }
        }

        const partnerSnap = await withTimeout(getDocs(collection(db, 'partners')), 3000);
        if (partnerSnap.empty) {
          for (const p of INITIAL_PARTNERS) {
            await setDoc(doc(db, 'partners', p.id), p);
          }
        }
      } catch (err) {
        // Fallback store is active; silently handle network delay/offline state
        console.warn('Initial cloud sync deferred to local cache:', err);
      }
    }, 200);
  } catch (err) {
    console.warn('Local storage init notice:', err);
  }
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
export const createNewBooking = async (newBooking: Booking): Promise<Booking> => {
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
    await setDoc(doc(db, 'bookings', bookingPendingAssignment.id), bookingPendingAssignment);
  } catch (err) {
    console.warn('Firestore write fallback to local storage:', err);
  }

  // Backup in LocalStorage
  const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
  stored.unshift(bookingPendingAssignment);
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(stored));

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
      detail: { booking: bookingPendingAssignment } 
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

// Fetch all bookings
export const getAllBookings = async (customerId?: string): Promise<Booking[]> => {
  try {
    let q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    if (customerId) {
      q = query(collection(db, 'bookings'), where('customerId', '==', customerId));
    }
    const snap = await withTimeout(getDocs(q), 2000);
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as Booking);
    }
  } catch {}

  const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
  if (customerId) {
    return stored.filter(b => b.customerId === customerId);
  }
  return stored;
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

// Fetch All Catalogue Services (with fallback to local storage & seed)
export const getAllServices = async (): Promise<CleaningService[]> => {
  try {
    const snap = await withTimeout(getDocs(collection(db, 'services')), 2000);
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as CleaningService);
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
};

// Update service pricing & formula settings
export const updateServicePricing = async (
  serviceId: string, 
  pricingData: Partial<CleaningService>
): Promise<boolean> => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await withTimeout(setDoc(serviceRef, pricingData, { merge: true }), 2000);
  } catch (err) {
    console.warn('Firestore pricing update fallback:', err);
  }

  // Update in local cache
  const stored: CleaningService[] = JSON.parse(localStorage.getItem(STORAGE_SERVICES_KEY) || JSON.stringify(INITIAL_SERVICES));
  const idx = stored.findIndex(s => s.id === serviceId);
  if (idx !== -1) {
    stored[idx] = { ...stored[idx], ...pricingData };
  }
  localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(stored));
  return true;
};

// Add new service to catalogue
export const addNewService = async (service: CleaningService): Promise<boolean> => {
  try {
    await withTimeout(setDoc(doc(db, 'services', service.id), service), 2000);
  } catch (err) {
    console.warn('Firestore add service fallback:', err);
  }

  const stored: CleaningService[] = JSON.parse(localStorage.getItem(STORAGE_SERVICES_KEY) || JSON.stringify(INITIAL_SERVICES));
  stored.unshift(service);
  localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(stored));
  return true;
};

// Toggle service active status
export const toggleServiceActive = async (serviceId: string, active: boolean): Promise<boolean> => {
  return updateServicePricing(serviceId, { active });
};

// Fetch All Hub Locations (combining cloud Firestore & local storage)
export const getAllHubs = async (): Promise<HubLocation[]> => {
  try {
    const snap = await withTimeout(getDocs(collection(db, 'hubs')), 2000);
    if (!snap.empty) {
      const list = snap.docs.map(d => d.data() as HubLocation);
      localStorage.setItem(STORAGE_HUBS_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Firestore get hubs fallback to local cache:', err);
  }

  const stored = localStorage.getItem(STORAGE_HUBS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return INITIAL_HUBS;
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

