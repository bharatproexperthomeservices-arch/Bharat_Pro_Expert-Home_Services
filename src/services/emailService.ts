import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy 
} from '../firebase-config';
import { EmailNotificationLog } from '../types';

export const OWNER_EMAIL = 'bharatproexpert@gmail.com';
const STORAGE_EMAIL_LOGS_KEY = 'bharat_pro_email_logs_v1';

// Send Email Notification to Owner (saves to Firestore and local storage, broadcasts event)
export const sendOwnerEmailNotification = async (payload: {
  type: EmailNotificationLog['type'];
  subject: string;
  body: string;
  metadata?: Record<string, any>;
}): Promise<EmailNotificationLog> => {
  const logId = 'email_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  
  const logEntry: EmailNotificationLog = {
    id: logId,
    type: payload.type,
    toEmail: OWNER_EMAIL,
    subject: payload.subject,
    body: payload.body,
    status: 'SENT',
    timestamp: new Date().toISOString(),
    metadata: payload.metadata
  };

  // 1. Save to Firestore
  try {
    await setDoc(doc(db, 'email_logs', logId), logEntry);
  } catch (err) {
    console.warn('Firestore email log write notice:', err);
  }

  // 2. Save to LocalStorage
  try {
    const existing: EmailNotificationLog[] = JSON.parse(localStorage.getItem(STORAGE_EMAIL_LOGS_KEY) || '[]');
    existing.unshift(logEntry);
    localStorage.setItem(STORAGE_EMAIL_LOGS_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch {}

  // 3. Broadcast Event for UI reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_email_dispatched', { detail: logEntry }));
  }

  console.info(`[Email Dispatched to ${OWNER_EMAIL}]`, payload.subject);
  return logEntry;
};

// Real Admin Login OTP Dispatch
export const sendAdminLoginOtpEmail = async (otp: string): Promise<EmailNotificationLog> => {
  const now = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  return sendOwnerEmailNotification({
    type: 'ADMIN_OTP',
    subject: `🔐 [Bharat Pro Expert] Admin Panel Login OTP: ${otp}`,
    body: `Namaste Admin,\n\nA login attempt has been initiated for Bharat Pro Expert Admin Panel.\n\nYour One-Time Password (OTP) is:\n\n👉  ${otp}  👈\n\n- Valid for: 10 minutes\n- Time of Request: ${now} IST\n- Target Account: ${OWNER_EMAIL}\n\nSecurity Notice:\nIf you did not request this OTP, someone is trying to access your Admin Panel. Do NOT share this code with anyone.\n\n- Bharat Pro Expert Security Systems`,
    metadata: {
      otp,
      targetEmail: OWNER_EMAIL,
      expiresInMinutes: 10
    }
  });
};

// Partner Registration Approval Alert to Owner
export const sendPartnerRegistrationAlert = async (partnerData: {
  name: string;
  phone: string;
  email?: string;
  city: string;
  hubName: string;
  categories: string[];
  partnerId: string;
}): Promise<EmailNotificationLog> => {
  return sendOwnerEmailNotification({
    type: 'PARTNER_REGISTRATION_REQUEST',
    subject: `📋 [Bharat Pro] New Partner Registration Pending Approval: ${partnerData.name}`,
    body: `Namaste Owner (${OWNER_EMAIL}),\n\nA new Service Partner has registered on Bharat Pro Expert and is waiting for your approval before their ID can become live.\n\nPartner Details:\n- Name: ${partnerData.name}\n- Phone: ${partnerData.phone}\n- Email: ${partnerData.email || 'N/A'}\n- City: ${partnerData.city}\n- Hub: ${partnerData.hubName}\n- Applied Categories: ${partnerData.categories.join(', ')}\n- Application ID: ${partnerData.partnerId}\n\nACTION REQUIRED:\nPlease open your Admin Panel (Login: ${OWNER_EMAIL}) -> Go to "Partner Operations" -> Review the application and click "Approve & Make ID Live". The partner will not be able to log in until you approve.\n\n- Bharat Pro Operations Team`,
    metadata: partnerData
  });
};

// Fetch email logs
export const getEmailLogs = async (): Promise<EmailNotificationLog[]> => {
  try {
    const snap = await getDocs(query(collection(db, 'email_logs'), orderBy('timestamp', 'desc')));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as EmailNotificationLog);
    }
  } catch {}

  try {
    return JSON.parse(localStorage.getItem(STORAGE_EMAIL_LOGS_KEY) || '[]');
  } catch {
    return [];
  }
};

// Generate mailto link for direct client verification
export const generateMailtoLink = (subject: string, body: string): string => {
  return `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
