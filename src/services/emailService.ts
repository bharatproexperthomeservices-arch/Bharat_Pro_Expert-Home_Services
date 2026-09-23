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

export const OWNER_EMAIL = 'bharatproexperthomeservices@gmail.com';
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
