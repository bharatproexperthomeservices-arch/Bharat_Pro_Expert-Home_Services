import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc 
} from '../firebase-config';
import { Partner } from '../types';
import { INITIAL_PARTNERS } from '../data';
import { sendOwnerEmailNotification, OWNER_EMAIL } from './emailService';

const STORAGE_PARTNERS_KEY = 'bharat_pro_partners_v2';
const STORAGE_PARTNER_SESSION_KEY = 'bharat_pro_partner_session_v1';

// Initialize default partners with login credentials if missing
export const getOrSeedPartners = async (): Promise<Partner[]> => {
  let list: Partner[] = [];
  try {
    const snap = await getDocs(collection(db, 'partners'));
    if (!snap.empty) {
      list = snap.docs.map(d => d.data() as Partner);
    }
  } catch {}

  if (list.length === 0) {
    try {
      const stored = localStorage.getItem(STORAGE_PARTNERS_KEY);
      if (stored) {
        list = JSON.parse(stored);
      }
    } catch {}
  }

  if (list.length === 0) {
    // Seed with INITIAL_PARTNERS plus default login IDs and passwords
    list = INITIAL_PARTNERS.map((p, idx) => ({
      ...p,
      status: (p.status === 'active' || p.status === 'pending' || p.status === 'inactive' ? p.status : 'active') as 'active' | 'pending' | 'inactive',
      loginUserId: `BPE-PRO-${101 + idx}`,
      loginPassword: `Clean@${101 + idx}`,
      onboardingStatus: 'approved' as const,
      approvedAt: new Date().toISOString(),
      approvedBy: OWNER_EMAIL,
      emailNotificationSent: true
    }));

    // Cache locally
    localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(list));

    // Async save to firestore
    setTimeout(async () => {
      try {
        for (const prt of list) {
          await setDoc(doc(db, 'partners', prt.id), prt);
        }
      } catch {}
    }, 500);
  } else {
    // Ensure every existing partner has a valid loginUserId & loginPassword
    let modified = false;
    list = list.map((p, idx) => {
      if (!p.loginUserId || !p.loginPassword) {
        modified = true;
        return {
          ...p,
          loginUserId: p.loginUserId || `BPE-PRO-${101 + idx}`,
          loginPassword: p.loginPassword || `Clean@${101 + idx}`,
          onboardingStatus: p.onboardingStatus || (p.status === 'active' ? 'approved' : 'pending_approval'),
          approvedAt: p.approvedAt || new Date().toISOString(),
          approvedBy: p.approvedBy || OWNER_EMAIL
        };
      }
      return p;
    });

    if (modified) {
      localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(list));
    }
  }

  return list;
};

// PARTNER LOGIN VALIDATION
// Strict verification: User ID and Password MUST match! If wrong details filled, login rejected.
export const verifyPartnerLogin = async (
  loginUserId: string, 
  loginPassword: string
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const cleanId = loginUserId.trim().toUpperCase();
  const cleanPass = loginPassword.trim();

  if (!cleanId || !cleanPass) {
    return {
      success: false,
      error: 'कृपया User ID और Password दोनों दर्ज करें।'
    };
  }

  const partners = await getOrSeedPartners();

  // Find partner by loginUserId or phone number or id
  const partner = partners.find(p => 
    p.loginUserId?.toUpperCase() === cleanId || 
    p.id.toUpperCase() === cleanId ||
    p.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')
  );

  if (!partner) {
    return {
      success: false,
      error: 'गलत User ID! यह ID सिस्टम में नहीं मिली। Admin द्वारा दी गई User ID ही दर्ज करें।'
    };
  }

  // Strict Password Verification
  if (partner.loginPassword !== cleanPass) {
    return {
      success: false,
      error: 'गलत Password! Admin द्वारा दिया गया सही Password ही दर्ज करें।'
    };
  }

  // Check Onboarding & Live Approval Status
  if (partner.onboardingStatus === 'pending_approval') {
    return {
      success: false,
      error: `आपकी Partner ID अभी Approval के लिए Pending है। Owner (${OWNER_EMAIL}) द्वारा Approve होने के बाद ही ID Live होगी।`
    };
  }

  if (partner.status === 'inactive') {
    return {
      success: false,
      error: 'यह Partner Account वर्तमान में Inactive है। कृपया Admin सपोर्ट से संपर्क करें।'
    };
  }

  // Authentication Succeeded: Save Session
  savePartnerSession(partner);

  return {
    success: true,
    partner
  };
};

// ADMIN APPROVES PARTNER ONBOARDING & SETS LIVE USER ID / PASSWORD
export const approvePartnerAndMakeIdLive = async (
  partnerId: string, 
  customCredentials?: {
    loginUserId?: string;
    loginPassword?: string;
    approvedBy?: string;
  }
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const partners = await getOrSeedPartners();
  const index = partners.findIndex(p => p.id === partnerId);
  
  if (index === -1) {
    return { success: false, error: 'Partner not found' };
  }

  const partner = { ...partners[index] };
  const nowIso = new Date().toISOString();

  // Assign or keep User ID & Password
  const finalUserId = customCredentials?.loginUserId?.trim().toUpperCase() || 
                      partner.loginUserId || 
                      `BPE-PRO-${Math.floor(100 + Math.random() * 900)}`;

  const finalPassword = customCredentials?.loginPassword?.trim() || 
                        partner.loginPassword || 
                        `Clean@${Math.floor(1000 + Math.random() * 9000)}`;

  const approvedBy = customCredentials?.approvedBy || OWNER_EMAIL;

  partner.loginUserId = finalUserId;
  partner.loginPassword = finalPassword;
  partner.status = 'active';
  partner.onboardingStatus = 'approved';
  partner.approvedAt = nowIso;
  partner.approvedBy = approvedBy;
  partner.emailNotificationSent = true;
  partner.isOnline = true;
  partner.kycVerified = true;

  partners[index] = partner;

  // 1. Update in LocalStorage
  localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(partners));

  // 2. Update in Firestore
  try {
    await setDoc(doc(db, 'partners', partner.id), partner, { merge: true });
  } catch (err) {
    console.warn('Firestore partner update notice:', err);
  }

  // 3. SEND EMAIL UPDATE TO OWNER'S EMAIL (bharatproexpert@gmail.com)
  await sendOwnerEmailNotification({
    type: 'PARTNER_ID_LIVE',
    subject: `⚡ [Bharat Pro] Partner ID LIVE Alert: ${partner.name} (${finalUserId}) is Approved!`,
    body: `Namaste Admin / Owner,\n\nPartner Onboarding has been APPROVED and the ID is now LIVE on the platform!\n\nPartner Details:\n- Name: ${partner.name}\n- Mobile: ${partner.phone}\n- Email: ${partner.email || 'N/A'}\n- Hub: ${partner.assignedHubName || partner.assignedHubId}\n\nLOGIN CREDENTIALS ASSIGNED:\n- User ID: ${finalUserId}\n- Password: ${finalPassword}\n- Status: LIVE & ACTIVE\n- Approved At: ${new Date(nowIso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n- Approved By: ${approvedBy}\n\nThe partner can now log in strictly using this User ID and Password at the Partner Portal.\n\n- Bharat Pro Expert Admin System`,
    metadata: {
      partnerId: partner.id,
      loginUserId: finalUserId,
      partnerName: partner.name,
      partnerPhone: partner.phone
    }
  });

  // 4. Broadcast window event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_partners_updated', { detail: partners }));
  }

  return {
    success: true,
    partner
  };
};

// REGISTER NEW PARTNER APPLICATION (Awaiting Onboarding Approval)
export const submitPartnerApplication = async (data: {
  name: string;
  phone: string;
  email?: string;
  city: string;
  hubId: string;
  hubName: string;
  categories: string[];
  experienceYears?: number;
}): Promise<Partner> => {
  const partners = await getOrSeedPartners();
  const newId = 'prt_' + Math.random().toString(36).substring(2, 9);
  const tempUserId = `BPE-PRO-${Math.floor(100 + Math.random() * 900)}`;
  const defaultPass = `Clean@${Math.floor(1000 + Math.random() * 9000)}`;

  const newPartner: Partner = {
    id: newId,
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email?.trim() || `${data.name.toLowerCase().replace(/\s+/g, '')}@partner.bharatpro.in`,
    avatarUrl: `https://images.unsplash.com/photo-${1500648767791 + Math.floor(Math.random()*1000)}?auto=format&fit=crop&w=200&q=80`,
    status: 'pending',
    onboardingStatus: 'pending_approval',
    isOnline: false,
    assignedHubId: data.hubId,
    assignedHubName: data.hubName,
    city: data.city,
    approvedCategories: data.categories.length > 0 ? data.categories : ['bathroom-cleaning', 'full-home-cleaning'],
    rating: 5.0,
    totalJobs: 0,
    totalEarnings: 0,
    kycVerified: false,
    loginUserId: tempUserId,
    loginPassword: defaultPass,
    emailNotificationSent: false
  };

  partners.unshift(newPartner);
  localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(partners));

  try {
    await setDoc(doc(db, 'partners', newId), newPartner);
  } catch {}

  // Alert Owner of New Partner Application to bharatproexpert@gmail.com
  await sendOwnerEmailNotification({
    type: 'PARTNER_REGISTRATION_REQUEST',
    subject: `📋 [Bharat Pro] New Partner Registration Pending Approval: ${newPartner.name}`,
    body: `New Partner Application Received:\n- Name: ${newPartner.name}\n- Phone: ${newPartner.phone}\n- Email: ${newPartner.email || 'N/A'}\n- City: ${newPartner.city}\n- Hub: ${newPartner.assignedHubName}\n- Temporary ID: ${tempUserId}\n\nStatus: PENDING APPROVAL\nPlease open the Admin Dashboard (bharatproexpert@gmail.com) to review KYC and click "Approve & Make ID Live". The partner cannot login until you approve.`,
    metadata: { partnerId: newId, name: newPartner.name, phone: newPartner.phone }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_partners_updated', { detail: partners }));
  }

  return newPartner;
};

// REJECT PARTNER APPLICATION
export const rejectPartnerApplication = async (
  partnerId: string,
  reason: string = 'Incomplete documentation or unverified credentials'
): Promise<{ success: boolean; error?: string }> => {
  const partners = await getOrSeedPartners();
  const index = partners.findIndex(p => p.id === partnerId);
  if (index === -1) return { success: false, error: 'Partner not found' };

  const partner = { ...partners[index] };
  partner.status = 'inactive';
  partner.onboardingStatus = 'rejected' as any;
  partner.approvedBy = `${OWNER_EMAIL} (REJECTED: ${reason})`;
  partners[index] = partner;

  localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(partners));
  try {
    await setDoc(doc(db, 'partners', partnerId), partner, { merge: true });
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_partners_updated', { detail: partners }));
  }

  return { success: true };
};

// GET PENDING PARTNER APPLICATIONS
export const getPendingPartners = async (): Promise<Partner[]> => {
  const all = await getOrSeedPartners();
  return all.filter(p => p.onboardingStatus === 'pending_approval');
};

// Session Management
export const savePartnerSession = (partner: Partner) => {
  sessionStorage.setItem(STORAGE_PARTNER_SESSION_KEY, JSON.stringify(partner));
  localStorage.setItem(STORAGE_PARTNER_SESSION_KEY, JSON.stringify(partner));
};

export const getPartnerSession = (): Partner | null => {
  try {
    const s = sessionStorage.getItem(STORAGE_PARTNER_SESSION_KEY) || localStorage.getItem(STORAGE_PARTNER_SESSION_KEY);
    if (!s) return null;
    return JSON.parse(s);
  } catch {
    return null;
  }
};

export const clearPartnerSession = () => {
  sessionStorage.removeItem(STORAGE_PARTNER_SESSION_KEY);
  localStorage.removeItem(STORAGE_PARTNER_SESSION_KEY);
};
