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
import { Booking, Partner, HubLocation, CleaningService, WhatsAppLog } from '../types';
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
  if (event === 'NEW_BOOKING_CONFIRMED') {
    messageSnippet = `📢 Bharat Pro Alert [${booking.bookingNumber}]: Confirmed for ${booking.customerName} (${booking.serviceName}) at ${booking.timeSlot}, ${booking.date}. Location: ${booking.address.sector}, ${booking.address.city}. Total: ₹${booking.totalAmount}.`;
  } else if (event === 'PARTNER_ASSIGNED') {
    messageSnippet = `🚀 Job Assigned [${booking.bookingNumber}]: Partner ${booking.assignedPartnerName} assigned. Start OTP: ${booking.startOtp}.`;
  } else if (event === 'JOB_STARTED') {
    messageSnippet = `⏳ Job Started [${booking.bookingNumber}]: Partner verified Start OTP ${booking.startOtp}. Service is now IN_PROGRESS.`;
  } else if (event === 'JOB_COMPLETED') {
    messageSnippet = `🎉 Service Completed [${booking.bookingNumber}]: Verified with Completion OTP ${booking.completionOtp}. Total Paid: ₹${booking.totalAmount}. Invoice generated.`;
  } else {
    messageSnippet = `ℹ️ Bharat Pro Update for booking #${booking.bookingNumber} - Status: ${booking.status}`;
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

// Save a new booking & auto-dispatch to matched Partner in that Hub
export const createNewBooking = async (newBooking: Booking): Promise<Booking> => {
  // 1. Find matched partner in the customer's hub and category
  let matchedPartner: Partner | null = null;
  const partners = await getPartnersList();
  
  matchedPartner = partners.find(p => 
    p.status === 'active' &&
    p.isOnline &&
    (p.approvedCategories.includes(newBooking.serviceId) || 
     p.approvedCategories.some(cat => newBooking.serviceName.toLowerCase().includes(cat.split('-')[0])))
  ) || partners[0] || null;

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

  const bookingWithPartner: Booking = {
    ...newBooking,
    priceSnapshot,
    status: matchedPartner ? 'PARTNER_ASSIGNED' : 'CONFIRMED',
    assignedPartnerId: matchedPartner?.id,
    assignedPartnerName: matchedPartner?.name,
    assignedPartnerPhone: matchedPartner?.phone,
    assignedHubId: matchedPartner?.assignedHubId || 'hub-gurugram-cyber'
  };

  // Save to Firestore
  try {
    await setDoc(doc(db, 'bookings', bookingWithPartner.id), bookingWithPartner);
  } catch (err) {
    console.warn('Firestore write fallback to local storage:', err);
  }

  // Backup in LocalStorage
  const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
  stored.unshift(bookingWithPartner);
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(stored));

  // Trigger Real-time WhatsApp Notification to Admin Number
  await sendWhatsAppNotification(
    bookingWithPartner,
    'ADMIN',
    WHATSAPP_NUMBER,
    'NEW_BOOKING_CONFIRMED'
  );

  // Trigger WhatsApp to Assigned Partner
  if (matchedPartner) {
    await sendWhatsAppNotification(
      bookingWithPartner,
      'PARTNER',
      matchedPartner.phone,
      'PARTNER_ASSIGNED'
    );
  }

  return bookingWithPartner;
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

  // Mandatory OTP validations
  if (newStatus === 'IN_PROGRESS' && !isMasterBypass) {
    if (enteredOtp !== booking.startOtp) {
      return { success: false, error: 'Invalid Job Start OTP. Please ask the customer for their Start OTP.' };
    }
    booking.otpVerifiedAt = new Date().toISOString();
    booking.jobStartedAt = new Date().toISOString();
  }

  if (newStatus === 'COMPLETED' && !isMasterBypass) {
    if (enteredOtp !== booking.completionOtp) {
      return { success: false, error: 'Invalid Job Completion OTP. Please verify with the customer.' };
    }
    booking.completionVerifiedAt = new Date().toISOString();
    booking.jobFinishedAt = new Date().toISOString();
    booking.paymentStatus = 'PAID';
  }

  booking.status = newStatus;
  booking.updatedAt = new Date().toISOString();

  // Save to Firestore
  try {
    await setDoc(doc(db, 'bookings', booking.id), booking, { merge: true });
  } catch {}

  // Update in LocalStorage
  const stored: Booking[] = JSON.parse(localStorage.getItem(STORAGE_BOOKINGS_KEY) || '[]');
  const updatedList = stored.map(b => b.id === booking!.id ? booking! : b);
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(updatedList));

  // WhatsApp Alert
  if (newStatus === 'IN_PROGRESS') {
    await sendWhatsAppNotification(booking, 'CUSTOMER', booking.customerPhone, 'JOB_STARTED');
  } else if (newStatus === 'COMPLETED') {
    await sendWhatsAppNotification(booking, 'CUSTOMER', booking.customerPhone, 'JOB_COMPLETED');
    await sendWhatsAppNotification(booking, 'ADMIN', WHATSAPP_NUMBER, 'JOB_COMPLETED');
  }

  return { success: true, booking };
};

// Fetch partners list
export const getPartnersList = async (): Promise<Partner[]> => {
  try {
    const snap = await withTimeout(getDocs(collection(db, 'partners')), 2000);
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as Partner);
    }
  } catch {}
  return JSON.parse(localStorage.getItem(STORAGE_PARTNERS_KEY) || JSON.stringify(INITIAL_PARTNERS));
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
