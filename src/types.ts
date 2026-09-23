export type HubStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'MAINTENANCE' | 'OVERLOADED' | 'CLOSED' | 'ARCHIVED';

export interface HubCapacity {
  maxJobsPerHour: number;
  maxJobsPerDay: number;
  partnerCapacity: number;
  peakCapacity: number;
  bookingBufferMinutes: number;
  travelBufferMinutes: number;
  emergencyCapacity: number;
}

export interface HubLocation {
  id: string;
  code?: string; // e.g. "BPE-DEL-01", "BPE-PAT-CENTRAL"
  name: string;
  state: string;
  city: string;
  district?: string;
  address?: string;
  coveredSectors: string[];
  pincodes?: string[];
  lat: number;
  lng: number;
  serviceRadiusKm: number; // typically 5-15km
  contactPhone?: string;
  managerName?: string;
  operatingHours?: string; // e.g. "08:00 - 20:00"
  holidays?: string[];
  allowedPropertyTypes?: string[]; // e.g. ['Apartment', 'Villa', 'Duplex', 'Independent Floor', 'Commercial/Office']
  capacity?: HubCapacity;
  partnerIds?: string[];
  dispatchPriority?: 'PRIMARY' | 'SECONDARY' | 'BACKUP';
  backupHubId?: string; // ID of fallback hub for overflow
  backupHubName?: string;
  crossHubDispatchAllowed?: boolean;
  overflowThresholdPct?: number; // default 85%
  dispatchTimeoutSec?: number; // default 60s
  priceOverrides?: Record<string, number>; // optional serviceId -> custom price
  status?: HubStatus;
  active: boolean;
}

export interface LocationZone {
  id: string;
  name: string;
  hubId: string;
  hubName: string;
  state: string;
  city: string;
  district: string;
  pincode: string;
  sector: string;
  radiusKm: number;
  travelTimeMinutes: number;
  serviceable: boolean;
}

export interface DispatchAttempt {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  customerLocation: string;
  serviceName: string;
  hubId: string;
  hubName: string;
  partnerId: string;
  partnerName: string;
  status: 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'TIMEOUT' | 'ESCALATED';
  score: number;
  distanceKm: number;
  attemptedAt: string;
  responseSec?: number;
  reason?: string;
}

export interface SOPRule {
  id: string;
  categoryId?: string;
  category?: string;
  stepName?: string;
  title?: string;
  description: string;
  mandatory?: boolean;
  photoProofRequired?: boolean;
  mandatoryPhotoProof?: boolean;
  checkCriteria?: string;
  auditFrequency?: string;
  chemicalUsed?: string;
  dilutionRatio?: string;
  penaltyIfViolated?: string;
  steps?: string[];
}

export interface TrainingCourse {
  id: string;
  code?: string;
  title: string;
  category: string;
  description?: string;
  modulesCount: number;
  durationHours: number;
  passingScore: number;
  passingScorePct?: number;
  requiredForOnboarding: boolean;
  autoAssignOnLowRating: boolean;
  certifiedPartnersCount: number;
  enrolledCount?: number;
  mandatoryFor?: string;
  modules?: string[];
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'CHEMICAL' | 'MACHINE' | 'CONSUMABLE' | 'SAFETY_PPE';
  hubId: string;
  hubName: string;
  unit: string;
  stockQuantity: number;
  reorderLevel: number;
  unitCost: number;
  lastRestocked: string;
  currentStock: number;
  minThreshold: number;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  hubName: string;
  totalBookings: number;
  lifetimeValue: number;
  totalSpend?: number;
  walletBalance?: number;
  ratingGiven: number;
  addresses: { tag: string; address: string }[];
  savedAddresses?: string[];
  registeredDate: string;
}

export interface ComplaintTicket {
  id: string;
  ticketNumber: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  partnerName: string;
  hubName: string;
  issueType: 'QUALITY_DEFICIENCY' | 'UNPUNCTUAL_ARRIVAL' | 'MISSING_EQUIPMENT' | 'DAMAGE' | 'BILLING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'REWORK_SCHEDULED' | 'REFUND_APPROVED' | 'RESOLVED';
  slaHoursRemaining: number;
  reportedAt: string;
  resolutionNotes?: string;
}

export interface CMSPageContent {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED';
  heroHeadline: string;
  heroSubheadline: string;
  announcementBanner: string;
  seoTitle: string;
  seoDescription: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface CouponRule {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  applicableCategoryIds: string[];
  applicableHubIds: string[];
  validTill: string;
  maxUses: number;
  usedCount: number;
  active: boolean;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  actorRole: string;
  module: string;
  action: string;
  targetId: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  ipAddress: string;
  timestamp: string;
}

export interface RBACRoleRecord {
  role: string;
  title: string;
  description: string;
  permissions: string[];
  userCount: number;
  twoFactorRequired: boolean;
}

export interface ServiceStep {
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface ServiceAddon {
  id: string;
  name: string;
  price: number;
  description: string;
  icon?: string;
}

export interface CleaningService {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  shortDesc: string;
  detailedDesc: string;
  basePrice: number; // Target Bharat Pro Expert price (Benchmark * 0.85 by default)
  referencePrice: number; // Standard market benchmark price
  competitorPrice: number; // Standard market reference price (15% higher)
  discountPct: number; // Default 15% transparent customer savings
  pricingMode: 'REFERENCE_PERCENT' | 'MANUAL';
  manualPrice?: number; // Optional admin manual price override
  priceVersion: string; // e.g. "v1.0.0"
  cityOverrides?: Record<string, number>; // e.g. { "Mumbai": 359 }
  active: boolean; // Admin activation/deactivation
  estimatedMinutes: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  beforeAfterImage: string;
  beforeImage?: string;
  afterImage?: string;
  demoVideoBadge: string;
  popular?: boolean;
  steps: ServiceStep[];
  inclusions: string[];
  exclusions: string[];
  addons: ServiceAddon[];
}

export interface BookingPriceSnapshot {
  basePrice: number;
  referencePrice: number;
  customerSavings: number;
  discountPct: number;
  pricingMode: 'REFERENCE_PERCENT' | 'MANUAL';
  priceVersion: string;
  addonsPrice: number;
  taxesGst: number;
  convenienceFee: number;
  discount: number;
  totalAmount: number;
  capturedAt: string;
}

export interface CleaningCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  heroImage: string;
  description: string;
  serviceCount: number;
}

export interface BumperOffer {
  id: string;
  tierMinAmount: number;
  badge: string;
  headline: string;
  subheadline: string;
  freeItemDescription: string;
  freeItemValue: number;
  categoryTrigger?: string;
  active: boolean;
}

export type JobStatus = 
  | 'PENDING'
  | 'SEARCHING_PROFESSIONAL'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'PARTNER_ASSIGNED'
  | 'ACCEPTED'
  | 'PARTNER_ON_THE_WAY'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AssignmentHistoryEntry {
  id: string;
  bookingId: string;
  previousPartnerId?: string;
  previousPartnerName?: string;
  newPartnerId: string;
  newPartnerName: string;
  assignedByAdminId: string;
  reason?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  categoryName: string;
  date: string;
  timeSlot: string;
  address: {
    street: string;
    sector: string;
    city: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
    landmark?: string;
  };
  selectedAddons: ServiceAddon[];
  basePrice: number;
  addonsPrice: number;
  taxesGst: number;
  convenienceFee: number;
  discount: number;
  totalAmount: number;
  appliedCoupon?: string;
  unlockedBumperOffer?: string;
  priceSnapshot?: BookingPriceSnapshot;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'PAY_AFTER_SERVICE';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  transactionId?: string;
  
  // Mandatory OTPs
  startOtp: string;
  completionOtp: string;
  otpVerifiedAt?: string;
  completionVerifiedAt?: string;

  // Partner details
  status: JobStatus;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  assignedPartnerPhone?: string;
  assignedPartnerAvatar?: string;
  assignedHubId?: string;
  assignedHubName?: string;
  partnerRating?: number;
  partnerCompletedJobs?: number;
  partnerReview?: string;
  tipAmount?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  onTheWayAt?: string;
  arrivedAt?: string;
  jobStartedAt?: string;
  jobFinishedAt?: string;
  cancelledAt?: string;
  assignmentHistory?: AssignmentHistoryEntry[];
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  status: 'active' | 'pending' | 'inactive';
  isOnline: boolean;
  assignedHubId: string;
  assignedHubName: string;
  hubName?: string;
  city?: string;
  approvedCategories: string[]; // Category IDs
  rating: number;
  totalJobs: number;
  completedJobs?: number;
  totalEarnings: number;
  kycVerified: boolean;
  kycStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  currentLocation?: { lat: number; lng: number };
  // Partner Credentials & Approval State
  loginUserId?: string; // Assigned User ID (e.g. BPE-PRO-101)
  loginPassword?: string; // Admin-issued Password
  onboardingStatus?: 'pending_approval' | 'approved' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;
  emailNotificationSent?: boolean;
}

export interface AdminLoginRequest {
  id: string;
  requesterEmail: string;
  requesterName?: string;
  ipOrDevice: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
  approvedBy?: string;
  ownerEmail: string; // bharatproexperthomeservices@gmail.com
  accessCode?: string;
}

export interface EmailNotificationLog {
  id: string;
  type: 'PARTNER_ID_LIVE' | 'ADMIN_LOGIN_REQUEST' | 'ADMIN_LOGIN_APPROVED' | 'ADMIN_LOGIN_REJECTED';
  toEmail: string; // bharatproexperthomeservices@gmail.com
  subject: string;
  body: string;
  status: 'SENT' | 'DISPATCHED';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  role: 'customer' | 'partner' | 'admin';
  referralCode: string;
  referredBy?: string;
  walletBalance: number;
  createdAt: string;
}

export interface WhatsAppLog {
  id: string;
  bookingId: string;
  recipientPhone: string;
  recipientType: 'ADMIN' | 'PARTNER' | 'CUSTOMER';
  eventType: string;
  messageSnippet: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  timestamp: string;
}
