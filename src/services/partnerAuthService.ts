import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  deleteDoc 
} from '../firebase-config';
import { 
  Partner, 
  PartnerDocument, 
  PartnerBankDetails, 
  PartnerAuditLog, 
  RequiredDocumentConfig,
  DocumentType,
  DocumentVerificationStatus,
  BankVerificationStatus 
} from '../types';
import { sendOwnerEmailNotification, OWNER_EMAIL } from './emailService';
import { INITIAL_PARTNERS } from '../data';

export const STORAGE_PARTNERS_KEY = 'bharat_pro_partners_v2';
export const STORAGE_PARTNER_SESSION_KEY = 'bharat_pro_partner_session_v1';
export const STORAGE_DOC_CONFIG_KEY = 'bharat_pro_doc_config_v1';
export const STORAGE_PARTNER_AUDIT_KEY = 'bharat_pro_partner_audit_v1';

// Default Document Onboarding Configuration
export const DEFAULT_REQUIRED_DOCUMENTS: RequiredDocumentConfig[] = [
  {
    id: 'doc-aadhaar-front',
    documentType: 'AADHAAR_FRONT',
    documentName: 'Aadhaar Card (Front)',
    isMandatory: true,
    requiresVerification: true,
    requiresExpiry: false,
    isActive: true,
    description: 'Front side of Government-issued Aadhaar with name and photo visible.'
  },
  {
    id: 'doc-aadhaar-back',
    documentType: 'AADHAAR_BACK',
    documentName: 'Aadhaar Card (Back)',
    isMandatory: true,
    requiresVerification: true,
    requiresExpiry: false,
    isActive: true,
    description: 'Back side of Aadhaar showing residential address and QR code.'
  },
  {
    id: 'doc-pan',
    documentType: 'PAN_CARD',
    documentName: 'PAN Card',
    isMandatory: true,
    requiresVerification: true,
    requiresExpiry: false,
    isActive: true,
    description: 'Income Tax Department PAN card for tax compliance and payouts.'
  },
  {
    id: 'doc-address-proof',
    documentType: 'ADDRESS_PROOF_FRONT',
    documentName: 'Address Proof / Electricity Bill',
    isMandatory: true,
    requiresVerification: true,
    requiresExpiry: false,
    isActive: true,
    description: 'Utility bill, voter ID, or rent agreement for local service verification.'
  },
  {
    id: 'doc-bank-proof',
    documentType: 'BANK_PROOF',
    documentName: 'Cancelled Cheque / Passbook',
    isMandatory: true,
    requiresVerification: true,
    requiresExpiry: false,
    isActive: true,
    description: 'Bank passbook front page or cancelled cheque with printed IFSC and name.'
  },
  {
    id: 'doc-selfie',
    documentType: 'SELFIE',
    documentName: 'Verification Selfie Photo',
    isMandatory: true,
    requiresVerification: true,
    requiresExpiry: false,
    isActive: true,
    description: 'Live face verification photo taken from mobile camera in good lighting.'
  },
  {
    id: 'doc-police',
    documentType: 'POLICE_VERIFICATION',
    documentName: 'Police Background Verification',
    isMandatory: false,
    requiresVerification: true,
    requiresExpiry: true,
    isActive: true,
    description: 'Official police clearance certificate or third-party background report.'
  },
  {
    id: 'doc-skill',
    documentType: 'SKILL_CERTIFICATE',
    documentName: 'Cleaning Skill / Training Certificate',
    isMandatory: false,
    requiresVerification: true,
    requiresExpiry: false,
    isActive: true,
    description: 'Bharat Pro Academy training certificate or vocational deep cleaning badge.'
  },
  {
    id: 'doc-agreement',
    documentType: 'AGREEMENT',
    documentName: 'Signed Partner Service Agreement',
    isMandatory: true,
    requiresVerification: true,
    requiresExpiry: false,
    isActive: true,
    description: 'Signed digital or physical partner code of conduct and commission agreement.'
  }
];

// Helper: Calculate Onboarding Progress (0 - 100%)
export const calculateOnboardingProgress = (partner: Partner): number => {
  let score = 0;
  // 1. Profile photo: 10%
  if (partner.avatarUrl && !partner.avatarUrl.includes('unsplash.com') && !partner.avatarUrl.includes('placeholder')) {
    score += 10;
  }
  // 2. Personal info: 15%
  if (partner.name && partner.phone && partner.dob && partner.gender) {
    score += 15;
  } else if (partner.name && partner.phone) {
    score += 8;
  }
  // 3. Address: 15%
  if (partner.city && partner.pincode && partner.fullAddress) {
    score += 15;
  } else if (partner.city) {
    score += 7;
  }
  // 4. Professional & Categories: 15%
  if (partner.approvedCategories && partner.approvedCategories.length > 0 && partner.assignedHubId) {
    score += 15;
  }
  // 5. Identity Documents (Aadhaar & PAN): 25%
  const docs = partner.documents || [];
  const hasAadhaarFront = docs.some(d => d.documentType === 'AADHAAR_FRONT');
  const hasAadhaarBack = docs.some(d => d.documentType === 'AADHAAR_BACK');
  const hasPan = docs.some(d => d.documentType === 'PAN_CARD');
  if (hasAadhaarFront && hasAadhaarBack && hasPan) {
    score += 25;
  } else if ((hasAadhaarFront || hasAadhaarBack) && hasPan) {
    score += 15;
  } else if (hasAadhaarFront || hasPan) {
    score += 8;
  }
  // 6. Bank Details: 10%
  if (partner.bankDetails && partner.bankDetails.accountNumber && partner.bankDetails.ifsc) {
    score += 10;
  }
  // 7. Bank Proof or Agreement: 10%
  const hasBankProof = docs.some(d => d.documentType === 'BANK_PROOF');
  const hasAgreement = docs.some(d => d.documentType === 'AGREEMENT');
  if (hasBankProof || hasAgreement) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
};

// Helper: Mask sensitive numbers
export const maskAadhaar = (num?: string): string => {
  if (!num) return 'XXXX XXXX XXXX';
  const clean = num.replace(/\D/g, '');
  if (clean.length < 4) return 'XXXX XXXX XXXX';
  const last4 = clean.slice(-4);
  return `XXXX XXXX ${last4}`;
};

export const maskBankAccount = (num?: string): string => {
  if (!num) return 'XXXXXX0000';
  const clean = num.trim();
  if (clean.length < 4) return 'XXXXXX0000';
  const last4 = clean.slice(-4);
  return `XXXXXX${last4}`;
};

export const maskPan = (pan?: string): string => {
  if (!pan) return 'XXXXX0000X';
  const clean = pan.trim().toUpperCase();
  if (clean.length < 5) return 'XXXXX0000X';
  return `${clean.slice(0, 2)}XXX${clean.slice(5)}`;
};

// Helper: Image Compression (Client-side Canvas)
export const compressImage = (
  fileOrDataUrl: File | string, 
  maxWidth = 1200, 
  maxHeight = 1200, 
  quality = 0.85
): Promise<{ dataUrl: string; fileSize: number; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const processImage = (imgSrc: string) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: imgSrc, fileSize: imgSrc.length, mimeType: 'image/jpeg' });
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const head = 'data:image/jpeg;base64,';
        const fileSize = Math.round(((dataUrl.length - head.length) * 3) / 4);
        resolve({ dataUrl, fileSize, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = imgSrc;
    };

    if (typeof fileOrDataUrl === 'string') {
      processImage(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => processImage(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

// Audit Logging Service
export const logPartnerAudit = async (
  partnerId: string,
  action: string,
  adminId: string,
  details?: { fieldChanged?: string; oldValue?: string; newValue?: string; reason?: string }
): Promise<PartnerAuditLog> => {
  const audit: PartnerAuditLog = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    partnerId,
    adminId,
    action,
    fieldChanged: details?.fieldChanged,
    oldValue: details?.oldValue,
    newValue: details?.newValue,
    reason: details?.reason,
    timestamp: new Date().toISOString()
  };

  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_PARTNER_AUDIT_KEY) || '[]');
    existing.unshift(audit);
    localStorage.setItem(STORAGE_PARTNER_AUDIT_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch {}

  try {
    await setDoc(doc(db, 'partner_audit_logs', audit.id), audit);
  } catch {}

  return audit;
};

export const getPartnerAuditLogs = async (partnerId: string): Promise<PartnerAuditLog[]> => {
  try {
    const snap = await getDocs(collection(db, 'partner_audit_logs'));
    if (!snap.empty) {
      const list = snap.docs.map(d => d.data() as PartnerAuditLog);
      return list.filter(a => a.partnerId === partnerId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
  } catch {}

  const stored: PartnerAuditLog[] = JSON.parse(localStorage.getItem(STORAGE_PARTNER_AUDIT_KEY) || '[]');
  return stored.filter(a => a.partnerId === partnerId);
};

// Document Requirements Configuration
export const getDocumentRequirements = (): RequiredDocumentConfig[] => {
  try {
    const stored = localStorage.getItem(STORAGE_DOC_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_REQUIRED_DOCUMENTS;
};

export const saveDocumentRequirements = (configs: RequiredDocumentConfig[]): void => {
  localStorage.setItem(STORAGE_DOC_CONFIG_KEY, JSON.stringify(configs));
};

// -------------------------------------------------------------
// PURGE DEMO / AI PARTNERS (Section 2 of Master Prompt)
// -------------------------------------------------------------
export const purgeDemoPartners = async (): Promise<{ count: number; purgedIds: string[] }> => {
  const demoIds = ['partner-101', 'partner-102', 'partner-103', 'partner-104', 'partner-105'];
  let list: Partner[] = [];
  try {
    const stored = localStorage.getItem(STORAGE_PARTNERS_KEY);
    if (stored) list = JSON.parse(stored);
  } catch {}

  const purgedIds: string[] = [];
  const cleanList = list.filter(p => {
    const isDemoRecord = demoIds.includes(p.id) || 
      p.isDemo === true || 
      p.name.includes('Demo') || 
      p.name.includes('AI Partner') ||
      p.email?.includes('partner.bharatpro.in') ||
      p.avatarUrl?.includes('unsplash.com/photo-1540569014015') ||
      p.avatarUrl?.includes('unsplash.com/photo-1507003211169') ||
      p.avatarUrl?.includes('unsplash.com/photo-1500648767791') ||
      p.avatarUrl?.includes('unsplash.com/photo-1506794778202') ||
      p.avatarUrl?.includes('unsplash.com/photo-1519085360753');

    if (isDemoRecord) {
      purgedIds.push(p.id);
      return false;
    }
    return true;
  });

  localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(cleanList));

  // Purge from firestore as well
  for (const id of purgedIds) {
    try {
      await deleteDoc(doc(db, 'partners', id));
    } catch {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_partners_updated', { detail: cleanList }));
  }

  return { count: purgedIds.length, purgedIds };
};

// -------------------------------------------------------------
// GET ALL REAL PARTNERS ONLY (Zero Seed / AI Fallback)
// -------------------------------------------------------------
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

  if (list.length === 0 && INITIAL_PARTNERS && INITIAL_PARTNERS.length > 0) {
    list = [...INITIAL_PARTNERS];
    localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(list));
  }

  // Filter out any residual demo/mock records
  const demoIds = ['partner-101', 'partner-102', 'partner-103', 'partner-104', 'partner-105'];
  const realPartners = list.filter(p => !demoIds.includes(p.id) && p.isDemo !== true);

  if (realPartners.length !== list.length) {
    localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(realPartners));
  }

  return realPartners;
};

// Duplicate Partner Check
export const checkDuplicatePartner = (
  partners: Partner[],
  phone: string,
  email?: string,
  pan?: string,
  excludePartnerId?: string
): { isDuplicate: boolean; duplicatePartner?: Partner; reason?: string } => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const cleanPan = pan?.trim().toUpperCase();
  const cleanEmail = email?.trim().toLowerCase();

  for (const p of partners) {
    if (excludePartnerId && p.id === excludePartnerId) continue;
    
    const pPhone = p.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone && pPhone === cleanPhone) {
      return {
        isDuplicate: true,
        duplicatePartner: p,
        reason: `Mobile number (${cleanPhone}) is already registered with Partner ID: ${p.loginUserId || p.id} (${p.name}).`
      };
    }

    if (cleanPan && p.panNumber && p.panNumber.trim().toUpperCase() === cleanPan) {
      return {
        isDuplicate: true,
        duplicatePartner: p,
        reason: `PAN number (${cleanPan}) is already registered with Partner ID: ${p.loginUserId || p.id} (${p.name}).`
      };
    }

    if (cleanEmail && p.email && p.email.trim().toLowerCase() === cleanEmail) {
      return {
        isDuplicate: true,
        duplicatePartner: p,
        reason: `Email address (${cleanEmail}) is already registered with Partner ID: ${p.loginUserId || p.id} (${p.name}).`
      };
    }
  }

  return { isDuplicate: false };
};

// -------------------------------------------------------------
// SAVE PARTNER HELPER (LocalStorage + Firestore)
// -------------------------------------------------------------
export const savePartnerRecord = async (partner: Partner): Promise<Partner> => {
  partner.onboardingProgress = calculateOnboardingProgress(partner);

  let partners: Partner[] = [];
  try {
    const stored = localStorage.getItem(STORAGE_PARTNERS_KEY);
    if (stored) partners = JSON.parse(stored);
  } catch {}

  const index = partners.findIndex(p => p.id === partner.id);
  if (index !== -1) {
    partners[index] = partner;
  } else {
    partners.unshift(partner);
  }

  localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(partners));

  try {
    await setDoc(doc(db, 'partners', partner.id), partner, { merge: true });
  } catch (err) {
    console.warn('Firestore partner write notice:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_partners_updated', { detail: partners }));
  }

  return partner;
};

// -------------------------------------------------------------
// CREATE NEW PARTNER (DRAFT OR SUBMITTED)
// -------------------------------------------------------------
export const createPartner = async (
  data: Partial<Partner>, 
  adminId: string = 'admin_owner',
  submitForVerification = false
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const cleanPhone = (data.phone || '').replace(/\D/g, '').slice(-10);
  if (!data.name?.trim() || cleanPhone.length !== 10) {
    return { success: false, error: 'Full Legal Name and a valid 10-digit Indian Mobile Number are required.' };
  }

  const existing = await getOrSeedPartners();
  const dup = checkDuplicatePartner(existing, cleanPhone, data.email, data.panNumber);
  if (dup.isDuplicate) {
    return { success: false, error: dup.reason };
  }

  const nowIso = new Date().toISOString();
  const partnerId = `prt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const loginUserId = `BPE-PRO-${Math.floor(100 + Math.random() * 900)}`;
  const loginPassword = `Clean@${Math.floor(1000 + Math.random() * 9000)}`;

  const newPartner: Partner = {
    id: partnerId,
    name: data.name.trim(),
    displayName: data.displayName?.trim() || data.name.trim(),
    guardianName: data.guardianName?.trim() || '',
    dob: data.dob || '',
    gender: data.gender || 'MALE',
    email: data.email?.trim() || '',
    phone: cleanPhone,
    alternatePhone: data.alternatePhone?.replace(/\D/g, '').slice(-10) || '',
    emergencyContactName: data.emergencyContactName?.trim() || '',
    emergencyContactPhone: data.emergencyContactPhone?.replace(/\D/g, '').slice(-10) || '',
    avatarUrl: data.avatarUrl || '',
    photoUploadedAt: data.avatarUrl ? nowIso : undefined,

    // Address
    houseNumber: data.houseNumber || '',
    street: data.street || '',
    locality: data.locality || '',
    sector: data.sector || '',
    city: data.city || 'Patna',
    state: data.state || 'Bihar',
    pincode: data.pincode || '',
    fullAddress: data.fullAddress || '',
    permanentAddress: data.permanentAddress || '',
    isPermanentSameAsCurrent: data.isPermanentSameAsCurrent ?? true,

    // Professional
    experienceYears: data.experienceYears || 1,
    skills: data.skills || ['Floor Scrubbing', 'Bathroom Buffing'],
    languages: data.languages || ['Hindi'],
    serviceRadiusKm: data.serviceRadiusKm || 12,
    preferredHubId: data.preferredHubId || data.assignedHubId || 'hub-patna-central',
    availableDays: data.availableDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    availableHours: data.availableHours || '08:00 - 20:00',
    emergencyAvailability: data.emergencyAvailability ?? false,
    partnerType: data.partnerType || 'FULL_TIME',
    joiningDate: nowIso,
    expectedCapacity: data.expectedCapacity || 4,
    notes: data.notes || '',

    status: submitForVerification ? 'PENDING_VERIFICATION' : 'DRAFT',
    onboardingStatus: submitForVerification ? 'DOCUMENTS_SUBMITTED' : 'DRAFT',
    isOnline: false,
    assignedHubId: data.assignedHubId || 'hub-patna-central',
    assignedHubName: data.assignedHubName || 'Patna Central Hub',
    approvedCategories: data.approvedCategories || ['full-home-cleaning', 'bathroom-cleaning'],
    rating: 5.0,
    totalJobs: 0,
    totalEarnings: 0,

    kycVerified: false,
    kycStatus: submitForVerification ? 'UNDER_REVIEW' : 'DRAFT',
    panNumber: data.panNumber?.trim().toUpperCase() || '',
    panName: data.panName?.trim() || '',
    aadhaarNumber: data.aadhaarNumber?.replace(/\D/g, '') || '',
    aadhaarNumberMasked: maskAadhaar(data.aadhaarNumber),
    documents: data.documents || [],
    bankDetails: data.bankDetails || {
      accountHolderName: data.name.trim(),
      bankName: '',
      accountNumber: '',
      accountNumberMasked: '',
      ifsc: '',
      verificationStatus: 'NOT_SUBMITTED'
    },

    loginUserId,
    loginPassword,
    isDemo: false
  };

  const saved = await savePartnerRecord(newPartner);
  await logPartnerAudit(partnerId, 'PARTNER_CREATED', adminId, {
    newValue: `Created partner ${saved.name} (Status: ${saved.status})`
  });

  return { success: true, partner: saved };
};

// -------------------------------------------------------------
// UPDATE PARTNER PROFILE & SENSITIVE FIELDS
// -------------------------------------------------------------
export const updatePartnerProfile = async (
  partnerId: string,
  updates: Partial<Partner>,
  adminId = 'admin_owner',
  reason?: string
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const partners = await getOrSeedPartners();
  const current = partners.find(p => p.id === partnerId);
  if (!current) return { success: false, error: 'Partner not found' };

  if (updates.phone) {
    const cleanPh = updates.phone.replace(/\D/g, '').slice(-10);
    const dup = checkDuplicatePartner(partners, cleanPh, updates.email, updates.panNumber, partnerId);
    if (dup.isDuplicate) return { success: false, error: dup.reason };
  }

  // Check if PAN or Aadhaar changed -> Material identity change requires re-review!
  let kycNeedsReview = false;
  if (updates.panNumber && updates.panNumber.trim().toUpperCase() !== current.panNumber?.toUpperCase()) {
    kycNeedsReview = true;
    await logPartnerAudit(partnerId, 'PAN_UPDATED', adminId, {
      fieldChanged: 'panNumber',
      oldValue: maskPan(current.panNumber),
      newValue: maskPan(updates.panNumber),
      reason: reason || 'Admin updated PAN number'
    });
  }

  if (updates.aadhaarNumber && updates.aadhaarNumber.replace(/\D/g, '') !== current.aadhaarNumber?.replace(/\D/g, '')) {
    kycNeedsReview = true;
    updates.aadhaarNumberMasked = maskAadhaar(updates.aadhaarNumber);
    await logPartnerAudit(partnerId, 'AADHAAR_UPDATED', adminId, {
      fieldChanged: 'aadhaarNumber',
      oldValue: maskAadhaar(current.aadhaarNumber),
      newValue: maskAadhaar(updates.aadhaarNumber),
      reason: reason || 'Admin updated Aadhaar number'
    });
  }

  const updatedPartner: Partner = {
    ...current,
    ...updates,
    panNumber: updates.panNumber ? updates.panNumber.trim().toUpperCase() : current.panNumber,
    aadhaarNumber: updates.aadhaarNumber ? updates.aadhaarNumber.replace(/\D/g, '') : current.aadhaarNumber,
    aadhaarNumberMasked: updates.aadhaarNumber ? maskAadhaar(updates.aadhaarNumber) : current.aadhaarNumberMasked,
    kycStatus: kycNeedsReview ? 'UNDER_REVIEW' : (updates.kycStatus || current.kycStatus),
    kycVerified: kycNeedsReview ? false : (updates.kycVerified ?? current.kycVerified)
  };

  const saved = await savePartnerRecord(updatedPartner);
  await logPartnerAudit(partnerId, 'PROFILE_UPDATED', adminId, {
    reason: reason || 'Admin modified partner profile'
  });

  return { success: true, partner: saved };
};

// -------------------------------------------------------------
// PHOTO MANAGEMENT (Real upload, preview, replace, remove)
// -------------------------------------------------------------
export const uploadPartnerPhoto = async (
  partnerId: string,
  photoDataUrl: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  const nowIso = new Date().toISOString();
  const compressed = await compressImage(photoDataUrl, 800, 800, 0.88);

  partner.avatarUrl = compressed.dataUrl;
  partner.photoStorageKey = `partners/${partnerId}/profile/photo_${Date.now()}.jpg`;
  partner.photoUploadedAt = partner.photoUploadedAt || nowIso;
  partner.photoUpdatedAt = nowIso;

  const saved = await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'PHOTO_UPLOADED', adminId, {
    newValue: `Uploaded profile photo (${Math.round(compressed.fileSize / 1024)} KB)`
  });

  return { success: true, partner: saved };
};

export const removePartnerPhoto = async (
  partnerId: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  partner.avatarUrl = '';
  partner.photoStorageKey = undefined;
  partner.photoUpdatedAt = new Date().toISOString();

  const saved = await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'PHOTO_REMOVED', adminId, {
    reason: 'Admin removed partner profile photo'
  });

  return { success: true, partner: saved };
};

// -------------------------------------------------------------
// DOCUMENT MANAGEMENT (Upload, Replace, Delete, Preview)
// -------------------------------------------------------------
export const uploadPartnerDocument = async (
  partnerId: string,
  docData: {
    documentType: DocumentType;
    documentName: string;
    documentNumber?: string;
    side?: 'FRONT' | 'BACK' | 'BOTH';
    fileUrl: string;
    mimeType?: string;
    fileSize?: number;
  },
  adminId = 'admin_owner'
): Promise<{ success: boolean; document?: PartnerDocument; error?: string }> => {
  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  const nowIso = new Date().toISOString();
  const currentDocs = partner.documents || [];

  // Check if replacing an existing document of same type & side
  const existingIdx = currentDocs.findIndex(
    d => d.documentType === docData.documentType && (d.side === docData.side || (!d.side && !docData.side))
  );

  const docId = `doc_${partnerId}_${docData.documentType}_${Date.now()}`;
  const newDoc: PartnerDocument = {
    id: docId,
    partnerId,
    documentType: docData.documentType,
    documentName: docData.documentName,
    documentNumber: docData.documentNumber,
    side: docData.side || 'BOTH',
    fileUrl: docData.fileUrl,
    storageKey: `partners/${partnerId}/documents/${docData.documentType}_${Date.now()}`,
    mimeType: docData.mimeType || 'image/jpeg',
    fileSize: docData.fileSize || 0,
    uploadedAt: nowIso,
    updatedAt: nowIso,
    verificationStatus: 'UNDER_REVIEW',
    isCurrent: true,
    version: existingIdx !== -1 ? (currentDocs[existingIdx].version || 1) + 1 : 1
  };

  let updatedDocs: PartnerDocument[];
  if (existingIdx !== -1) {
    updatedDocs = currentDocs.map((d, i) => i === existingIdx ? newDoc : d);
    await logPartnerAudit(partnerId, 'DOCUMENT_REPLACED', adminId, {
      fieldChanged: docData.documentType,
      newValue: `Replaced with version ${newDoc.version}`
    });
  } else {
    updatedDocs = [...currentDocs, newDoc];
    await logPartnerAudit(partnerId, 'DOCUMENT_UPLOADED', adminId, {
      fieldChanged: docData.documentType,
      newValue: `Uploaded ${docData.documentName}`
    });
  }

  partner.documents = updatedDocs;
  partner.kycStatus = 'UNDER_REVIEW';
  await savePartnerRecord(partner);

  try {
    await setDoc(doc(db, 'partner_documents', newDoc.id), newDoc);
  } catch {}

  return { success: true, document: newDoc };
};

export const deletePartnerDocument = async (
  partnerId: string,
  documentId: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; error?: string }> => {
  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  const targetDoc = (partner.documents || []).find(d => d.id === documentId);
  partner.documents = (partner.documents || []).filter(d => d.id !== documentId);

  await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'DOCUMENT_DELETED', adminId, {
    fieldChanged: targetDoc?.documentType || 'document',
    oldValue: targetDoc?.documentName
  });

  try {
    await deleteDoc(doc(db, 'partner_documents', documentId));
  } catch {}

  return { success: true };
};

// -------------------------------------------------------------
// DOCUMENT VERIFICATION ENGINE (Verify, Reject, Request Re-upload)
// -------------------------------------------------------------
export const verifyPartnerDocument = async (
  partnerId: string,
  documentId: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; document?: PartnerDocument; error?: string }> => {
  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  const nowIso = new Date().toISOString();
  const docIndex = (partner.documents || []).findIndex(d => d.id === documentId);
  if (docIndex === -1) return { success: false, error: 'Document not found' };

  const verifiedDoc: PartnerDocument = {
    ...partner.documents![docIndex],
    verificationStatus: 'VERIFIED',
    verifiedBy: adminId,
    verifiedAt: nowIso,
    rejectionReason: undefined
  };

  partner.documents![docIndex] = verifiedDoc;

  // Check if all mandatory documents are now verified
  const reqConfigs = getDocumentRequirements().filter(r => r.isActive && r.isMandatory);
  const allMandatoryVerified = reqConfigs.every(req => {
    return (partner.documents || []).some(d => d.documentType === req.documentType && d.verificationStatus === 'VERIFIED');
  });

  if (allMandatoryVerified) {
    partner.kycStatus = 'KYC_VERIFIED';
    partner.kycVerified = true;
  }

  await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'DOCUMENT_VERIFIED', adminId, {
    fieldChanged: verifiedDoc.documentType,
    newValue: `Verified by ${adminId}`
  });

  try {
    await setDoc(doc(db, 'partner_documents', documentId), verifiedDoc, { merge: true });
  } catch {}

  return { success: true, document: verifiedDoc };
};

export const rejectPartnerDocument = async (
  partnerId: string,
  documentId: string,
  reason: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; document?: PartnerDocument; error?: string }> => {
  if (!reason?.trim()) {
    return { success: false, error: 'A specific rejection reason is mandatory.' };
  }

  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  const docIndex = (partner.documents || []).findIndex(d => d.id === documentId);
  if (docIndex === -1) return { success: false, error: 'Document not found' };

  const rejectedDoc: PartnerDocument = {
    ...partner.documents![docIndex],
    verificationStatus: 'REJECTED',
    verifiedBy: adminId,
    rejectionReason: reason.trim()
  };

  partner.documents![docIndex] = rejectedDoc;

  partner.kycStatus = 'KYC_NEEDS_REUPLOAD';
  partner.kycVerified = false;

  await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'DOCUMENT_REJECTED', adminId, {
    fieldChanged: rejectedDoc.documentType,
    reason: reason.trim()
  });

  try {
    await setDoc(doc(db, 'partner_documents', documentId), rejectedDoc, { merge: true });
  } catch {}

  return { success: true, document: rejectedDoc };
};

export const requestDocumentReupload = async (
  partnerId: string,
  documentId: string,
  reason: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; document?: PartnerDocument; error?: string }> => {
  if (!reason?.trim()) {
    return { success: false, error: 'Re-upload request reason is required.' };
  }

  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  const docIndex = (partner.documents || []).findIndex(d => d.id === documentId);
  if (docIndex === -1) return { success: false, error: 'Document not found' };

  const reqDoc: PartnerDocument = {
    ...partner.documents![docIndex],
    verificationStatus: 'REUPLOAD_REQUIRED',
    rejectionReason: reason.trim()
  };

  partner.documents![docIndex] = reqDoc;

  partner.kycStatus = 'KYC_NEEDS_REUPLOAD';
  partner.kycVerified = false;

  await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'REUPLOAD_REQUESTED', adminId, {
    fieldChanged: reqDoc.documentType,
    reason: reason.trim()
  });

  return { success: true, document: reqDoc };
};

// -------------------------------------------------------------
// BANK DETAILS MANAGEMENT & VERIFICATION (Sections 12 & 13)
// -------------------------------------------------------------
export const updatePartnerBankDetails = async (
  partnerId: string,
  bankData: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    confirmAccountNumber?: string;
    ifsc: string;
    branchName?: string;
    accountType?: 'SAVINGS' | 'CURRENT';
    upiId?: string;
    bankProofType?: 'CANCELLED_CHEQUE' | 'PASSBOOK' | 'BANK_STATEMENT';
    bankProofUrl?: string;
  },
  adminId = 'admin_owner'
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const cleanAcc = bankData.accountNumber.trim();
  const cleanIfsc = bankData.ifsc.trim().toUpperCase();

  if (!bankData.accountHolderName.trim() || !cleanAcc || !cleanIfsc) {
    return { success: false, error: 'Account Holder Name, Account Number, and IFSC Code are required.' };
  }

  if (bankData.confirmAccountNumber && bankData.confirmAccountNumber.trim() !== cleanAcc) {
    return { success: false, error: 'Account Number and Confirm Account Number do not match.' };
  }

  // Basic IFSC format: 4 letters, 0, 6 letters/digits
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(cleanIfsc)) {
    return { success: false, error: 'Invalid IFSC format. Example format: SBIN0001234.' };
  }

  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  const nowIso = new Date().toISOString();
  const previousAcc = partner.bankDetails?.accountNumberMasked;

  partner.bankDetails = {
    accountHolderName: bankData.accountHolderName.trim(),
    bankName: bankData.bankName.trim() || 'Bank',
    accountNumber: cleanAcc,
    accountNumberMasked: maskBankAccount(cleanAcc),
    ifsc: cleanIfsc,
    branchName: bankData.branchName?.trim() || '',
    accountType: bankData.accountType || 'SAVINGS',
    upiId: bankData.upiId?.trim() || '',
    bankProofType: bankData.bankProofType || 'CANCELLED_CHEQUE',
    bankProofUrl: bankData.bankProofUrl || partner.bankDetails?.bankProofUrl,
    verificationStatus: 'PENDING',
    updatedAt: nowIso
  };

  const saved = await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'BANK_DETAILS_UPDATED', adminId, {
    fieldChanged: 'bankDetails',
    oldValue: previousAcc,
    newValue: maskBankAccount(cleanAcc),
    reason: 'Admin updated bank details. Status reset to PENDING.'
  });

  return { success: true, partner: saved };
};

export const verifyPartnerBank = async (
  partnerId: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner || !partner.bankDetails) return { success: false, error: 'Bank details not found' };

  partner.bankDetails.verificationStatus = 'VERIFIED';
  partner.bankDetails.verifiedBy = adminId;
  partner.bankDetails.verifiedAt = new Date().toISOString();
  partner.bankDetails.rejectionReason = undefined;

  const saved = await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'BANK_VERIFIED', adminId, {
    newValue: `Verified by ${adminId}`
  });

  return { success: true, partner: saved };
};

export const rejectPartnerBank = async (
  partnerId: string,
  reason: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  if (!reason?.trim()) {
    return { success: false, error: 'Bank rejection reason is required.' };
  }

  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner || !partner.bankDetails) return { success: false, error: 'Bank details not found' };

  partner.bankDetails.verificationStatus = 'FAILED';
  partner.bankDetails.verifiedBy = adminId;
  partner.bankDetails.rejectionReason = reason.trim();

  const saved = await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'BANK_REJECTED', adminId, {
    reason: reason.trim()
  });

  return { success: true, partner: saved };
};

// -------------------------------------------------------------
// PARTNER APPROVAL & LIFECYCLE (Approve, Suspend, Reactivate, Delete)
// -------------------------------------------------------------
export const approvePartnerAndMakeIdLive = async (
  partnerId: string,
  customCredentials?: {
    loginUserId?: string;
    loginPassword?: string;
    approvedBy?: string;
  }
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  const nowIso = new Date().toISOString();
  const finalUserId = customCredentials?.loginUserId?.trim().toUpperCase() || 
                      partner.loginUserId || 
                      `BPE-PRO-${Math.floor(100 + Math.random() * 900)}`;

  const finalPassword = customCredentials?.loginPassword?.trim() || 
                        partner.loginPassword || 
                        `Clean@${Math.floor(1000 + Math.random() * 9000)}`;

  const approvedBy = customCredentials?.approvedBy || OWNER_EMAIL;

  partner.loginUserId = finalUserId;
  partner.loginPassword = finalPassword;
  partner.status = 'ACTIVE';
  partner.onboardingStatus = 'approved';
  partner.kycStatus = 'KYC_VERIFIED';
  partner.kycVerified = true;
  partner.approvedAt = nowIso;
  partner.approvedBy = approvedBy;
  partner.isOnline = true;

  const saved = await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'PARTNER_APPROVED', approvedBy, {
    newValue: `Partner Approved. Login ID: ${finalUserId}`
  });

  // Dispatched Owner notification email
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

  return { success: true, partner: saved };
};

export const suspendPartner = async (
  partnerId: string,
  reason: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  partner.status = 'SUSPENDED';
  partner.isOnline = false;

  const saved = await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'PARTNER_SUSPENDED', adminId, {
    reason: reason || 'Suspended by admin'
  });

  return { success: true, partner: saved };
};

export const reactivatePartner = async (
  partnerId: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  partner.status = 'ACTIVE';
  partner.isOnline = true;

  const saved = await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'PARTNER_REACTIVATED', adminId, {
    reason: 'Reactivated by admin'
  });

  return { success: true, partner: saved };
};

export const deletePartner = async (
  partnerId: string,
  adminId = 'admin_owner'
): Promise<{ success: boolean; error?: string }> => {
  const partners = await getOrSeedPartners();
  const target = partners.find(p => p.id === partnerId);
  if (!target) return { success: false, error: 'Partner not found' };

  const cleanList = partners.filter(p => p.id !== partnerId);
  localStorage.setItem(STORAGE_PARTNERS_KEY, JSON.stringify(cleanList));

  try {
    await deleteDoc(doc(db, 'partners', partnerId));
  } catch {}

  await logPartnerAudit(partnerId, 'PARTNER_DELETED', adminId, {
    oldValue: `${target.name} (${target.phone})`
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bharatpro_partners_updated', { detail: cleanList }));
  }

  return { success: true };
};

export const rejectPartnerApplication = async (
  partnerId: string,
  reason: string = 'Incomplete documentation or unverified credentials'
): Promise<{ success: boolean; partner?: Partner; error?: string }> => {
  const partners = await getOrSeedPartners();
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };

  partner.status = 'REJECTED';
  partner.onboardingStatus = 'rejected';
  partner.approvedBy = `${OWNER_EMAIL} (REJECTED: ${reason})`;

  const saved = await savePartnerRecord(partner);
  await logPartnerAudit(partnerId, 'APPLICATION_REJECTED', OWNER_EMAIL, { reason });

  return { success: true, partner: saved };
};

export const submitPartnerApplication = async (appData: {
  name: string;
  phone: string;
  email: string;
  city: string;
  hubId: string;
  hubName: string;
  categories: string[];
}): Promise<Partner> => {
  const res = await createPartner(
    {
      name: appData.name,
      phone: appData.phone,
      email: appData.email,
      city: appData.city,
      assignedHubId: appData.hubId,
      assignedHubName: appData.hubName,
      preferredHubId: appData.hubId,
      approvedCategories: appData.categories,
      skills: appData.categories,
    },
    'self_registration',
    true
  );
  if (!res.success || !res.partner) {
    throw new Error(res.error || 'Failed to submit application');
  }
  return res.partner;
};

// -------------------------------------------------------------
// PARTNER PORTAL LOGIN AUTHENTICATION
// -------------------------------------------------------------
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

  if (partner.loginPassword !== cleanPass) {
    return {
      success: false,
      error: 'गलत Password! Admin द्वारा दिया गया सही Password ही दर्ज करें।'
    };
  }

  if (partner.onboardingStatus === 'pending_approval' || partner.status === 'DRAFT' || partner.status === 'PENDING_VERIFICATION') {
    return {
      success: false,
      error: `आपकी Partner ID अभी Approval के लिए Pending है। Owner (${OWNER_EMAIL}) द्वारा Approve होने के बाद ही ID Live होगी।`
    };
  }

  if (partner.status === 'inactive' || partner.status === 'SUSPENDED' || partner.status === 'REJECTED') {
    return {
      success: false,
      error: 'यह Partner Account वर्तमान में Inactive / Suspended है। कृपया Admin सपोर्ट से संपर्क करें।'
    };
  }

  savePartnerSession(partner);
  return { success: true, partner };
};

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
