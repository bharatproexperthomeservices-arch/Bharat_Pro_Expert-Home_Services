/* ============================================================
   BHARAT PRO EXPERT — PARTNER TYPES
   Blueprint v2 — Shared types for Partner Management
   ============================================================ */

export type PartnerTab =
  | 'all'
  | 'onboarding'
  | 'kyc'
  | 'bank'
  | 'services'
  | 'matrix'
  | 'coverage'
  | 'performance'
  | 'earnings'
  | 'training'
  | 'incentives'
  | 'cases'
  | 'communication'
  | 'recruitment'
  | 'reports'
  | 'settings';

export type LifecycleStatus =
  | 'REGISTERED'
  | 'ONBOARDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'REJECTED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'OFFBOARDING'
  | 'OFFBOARDED'
  | 'BLACKLISTED'
  | 'ARCHIVED';

export type KycStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export type BankStatus =
  | 'NOT_ADDED'
  | 'ADDED'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED'
  | 'MISMATCH'
  | 'FAILED';

export type AgreementStatus = 'PENDING' | 'ACCEPTED' | 'RE_ACCEPT_REQUIRED';

export type TrainingStatus =
  | 'NOT_ASSIGNED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PASSED'
  | 'FAILED'
  | 'EXPIRED';

export type KitStatus = 'PENDING' | 'PARTIAL' | 'SATISFIED' | 'EXPIRED';

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'BUSY'
  | 'OFFLINE'
  | 'ON_BREAK'
  | 'ON_LEAVE';

export type ServiceStatus =
  | 'PENDING_TRAINING'
  | 'PENDING_KIT'
  | 'READY'
  | 'ACTIVE'
  | 'PAUSED'
  | 'REVOKED';

export type PartnerType = 'INDIVIDUAL' | 'TEAM_LEAD' | 'AGENCY';

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export type DocumentStatus =
  | 'UPLOADED'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export type DocumentMethod = 'MANUAL' | 'PROVIDER' | 'OFFLINE_XML';

export type DocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'SELFIE'
  | 'ADDRESS_PROOF'
  | 'POLICE_VERIFICATION'
  | 'BANK_PROOF'
  | 'PROFILE_PHOTO'
  | 'DRIVING_LICENCE'
  | 'VEHICLE_PAPERS'
  | 'GST'
  | 'TRAINING_CERTIFICATE'
  | 'OTHER';

export type DocumentRejectReason =
  | 'BLURRY'
  | 'CROPPED'
  | 'EXPIRED'
  | 'NAME_MISMATCH'
  | 'DOB_MISMATCH'
  | 'PHOTO_MISMATCH'
  | 'WRONG_DOC_TYPE'
  | 'UNREADABLE'
  | 'SUSPECTED_TAMPERING'
  | 'DUPLICATE_IDENTITY'
  | 'OTHER';

export type MatrixItemType =
  | 'CHEMICAL'
  | 'TOOL'
  | 'MACHINE'
  | 'PPE'
  | 'CONSUMABLE';

export type MatrixSupplyMode = 'PARTNER_OWNED' | 'COMPANY_ISSUED' | 'EITHER';

export type MatrixComplianceStatus =
  | 'VERIFIED_OWNED'
  | 'ISSUED'
  | 'PENDING'
  | 'MISSING'
  | 'DAMAGED'
  | 'EXPIRED';

export type PayoutState =
  | 'CREATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'RETRY';

export type WalletEntryType =
  | 'JOB_EARNING'
  | 'TIP'
  | 'INCENTIVE'
  | 'REFERRAL_BONUS'
  | 'ADJUSTMENT'
  | 'PENALTY'
  | 'KIT_DEPOSIT'
  | 'KIT_DAMAGE'
  | 'CASH_COLLECTED'
  | 'CASH_REMITTED'
  | 'HOLD'
  | 'HOLD_RELEASE'
  | 'PAYOUT'
  | 'PAYOUT_REVERSAL'
  | 'TAX_DEDUCTION'
  | 'FEE';

export type CaseStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'PARTNER_RESPONSE'
  | 'DECISION'
  | 'CLOSED'
  | 'APPEALED';

export type CaseOutcome =
  | 'DISMISSED'
  | 'ADVICE'
  | 'RETRAINING'
  | 'PENALTY'
  | 'RESTRICTION'
  | 'SUSPENSION'
  | 'TERMINATION';

export type EligibilityReasonCode =
  | 'NOT_ACTIVE'
  | 'DOC_EXPIRED'
  | 'KYC_INCOMPLETE'
  | 'BANK_NOT_VERIFIED'
  | 'AGREEMENT_PENDING'
  | 'TRAINING_PENDING'
  | 'KIT_MISSING'
  | 'OUT_OF_COVERAGE'
  | 'OFFLINE'
  | 'CAPACITY_REACHED'
  | 'TIME_CONFLICT'
  | 'DUES_LIMIT'
  | 'CASE_BLOCKING'
  | 'RESTRICTED'
  | 'NO_CHANNEL';

export interface PartnerRow {
  id: string;
  partner_code: string;
  type: PartnerType;
  legal_name: string;
  display_name?: string;
  mobile_masked: string;
  aadhaar_last4?: string;
  bank_last4?: string;
  primary_hub?: string;
  city?: string;
  lifecycle_status: LifecycleStatus;
  kyc_status: KycStatus;
  bank_status: BankStatus;
  availability_status: AvailabilityStatus;
  categories_count: number;
  docs_count: number;
  onboarding_percent: number;
  rating?: number | null;
  rating_count?: number;
  tier?: string;
  lifetime_earnings_paise?: number;
  last_active_at?: string;
  created_at?: string;
}

export interface PartnerKpis {
  total_fleet: number;
  active_dispatch_eligible: number;
  in_onboarding: number;
  awaiting_review: number;
  kyc_verified: number;
  bank_pending: number;
  docs_expiring_30d: number;
  online_now: number;
  on_job_now: number;
  restricted_suspended: number;
  open_cases: number;
  payouts_pending_count: number;
  payouts_pending_paise: number;
  payouts_failed_count: number;
  avg_rating_30d: number | null;
  avg_rating_sample: number;
  acceptance_rate_7d: number | null;
  median_approval_tat_hours: number | null;
  as_of: string;
}

export interface PartnerDocument {
  id: string;
  partner_id: string;
  doc_type: DocumentType;
  version: number;
  media_id: string;
  number_last4?: string;
  issue_date?: string;
  expiry_date?: string;
  status: DocumentStatus;
  method: DocumentMethod;
  provider_ref?: string;
  reviewer_id?: string;
  reviewed_at?: string;
  reject_reason_code?: DocumentRejectReason;
  ai_prescreen_id?: string;
  supersedes_id?: string;
  created_at: string;
}

export interface PartnerBankAccount {
  id: string;
  partner_id: string;
  holder_name: string;
  account_last4: string;
  ifsc: string;
  bank_name: string;
  upi_masked?: string;
  status: BankStatus;
  name_match_score?: number;
  verified_by?: string;
  method: DocumentMethod;
  is_primary: boolean;
  change_cooldown_until?: string;
  created_at: string;
}

export interface PartnerService {
  id: string;
  partner_id: string;
  category_id: string;
  category_name: string;
  service_id?: string;
  service_name?: string;
  level: SkillLevel;
  status: ServiceStatus;
  certified_at?: string;
  cert_expires_at?: string;
  approved_by?: string;
}

export interface MatrixItem {
  id: string;
  category_id: string;
  type: MatrixItemType;
  name: string;
  specification?: string;
  mandatory: boolean;
  supply_mode: MatrixSupplyMode;
  min_quantity: number;
  unit: string;
  inspection_interval_days?: number;
  safety_doc_url?: string;
  on_missing: 'BLOCK_CATEGORY' | 'WARN';
}

export interface PartnerMatrixCompliance {
  id: string;
  partner_id: string;
  category_id: string;
  item_id: string;
  item_name: string;
  status: MatrixComplianceStatus;
  evidence_media_id?: string;
  verified_by?: string;
  verified_at?: string;
  next_due?: string;
  inventory_movement_id?: string;
}

export interface EligibilityResult {
  partner_id: string;
  category_id: string;
  eligible: boolean;
  reasons: EligibilityReasonCode[];
  reasons_detail?: { code: EligibilityReasonCode; message: string }[];
  score_components?: Record<string, number>;
  computed_at: string;
}

export interface ReadinessGate {
  key: string;
  label: string;
  passed: boolean;
  detail?: string;
  fix_link?: string;
  overridable?: boolean;
}

export interface PartnerReadiness {
  partner_id: string;
  gates: ReadinessGate[];
  passed_count: number;
  total_count: number;
  ready_to_approve: boolean;
}

export interface PartnerWalletEntry {
  id: string;
  partner_id: string;
  type: WalletEntryType;
  amount_paise: number;
  ref_type?: string;
  ref_id?: string;
  description?: string;
  created_at: string;
}

export interface PartnerPayout {
  id: string;
  partner_id: string;
  batch_id?: string;
  amount_paise: number;
  state: PayoutState;
  provider_ref?: string;
  failure_reason?: string;
  created_at: string;
  processed_at?: string;
}

export interface PartnerCase {
  id: string;
  partner_id: string;
  type: string;
  source: string;
  booking_id?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: CaseStatus;
  assigned_to?: string;
  sla_due?: string;
  outcome?: CaseOutcome;
  evidence?: string;
  created_at: string;
}

export interface PartnerStatusHistory {
  id: string;
  partner_id: string;
  from_status: LifecycleStatus | null;
  to_status: LifecycleStatus;
  actor_type: 'ADMIN' | 'SYSTEM' | 'AUTOMATION' | 'PARTNER';
  actor_id?: string;
  reason_code?: string;
  note?: string;
  task_id?: string;
  automation_id?: string;
  ai_task_id?: string;
  at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  cursor?: string;
}

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}