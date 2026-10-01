/* ============================================================
   BHARAT PRO EXPERTS — DISPATCH TYPES (FULL)
   Auto-Dispatch Engine — Live Monitor + First-Accept Atomic
   ------------------------------------------------------------
   Sections:
   1. Core Enums / Unions
   2. Entity Interfaces
   3. API Payloads & Filters
   4. UI Labels
   5. Helper Functions
   6. Default Configuration
   7. First-Accept Atomicity Constants
   8. Score Weight Configuration
   9. Reason Codes (offer decline, exception, cancel)
   10. Seed Data (starter runs / offers / exceptions / partners)
   11. Sorting & Comparison Helpers
   ============================================================ */

import type { BookingStatus } from './booking';

/* ============================================================
   1. CORE ENUMS / UNIONS
   ============================================================ */

export type DispatchStage =
  | 'QUEUED'
  | 'BROADCASTING'
  | 'AWAITING_ACCEPT'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'FAILED'
  | 'REASSIGNING';

export type OfferOutcome =
  | 'PENDING'
  | 'SEEN'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export type ExceptionType =
  | 'NO_ELIGIBLE_PARTNER'
  | 'ALL_DECLINED'
  | 'OFFER_TIMEOUT'
  | 'CONCURRENCY_VIOLATION'
  | 'PARTNER_CANCELLED'
  | 'OTHER';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export type DispatchActionType =
  | 'RETRY'
  | 'FORCE_ASSIGN'
  | 'CANCEL_RUN'
  | 'EXTEND_OFFER'
  | 'MANUAL_ASSIGN';

export type OfferDeclineReasonCode =
  | 'TOO_FAR'
  | 'BUSY'
  | 'LOW_PAYOUT'
  | 'SERVICE_NOT_PREFERRED'
  | 'SCHEDULE_CONFLICT'
  | 'NOT_INTERESTED'
  | 'OTHER';

export type ExceptionResolutionCode =
  | 'RETRIED'
  | 'REASSIGNED_MANUALLY'
  | 'WIDENED_RADIUS'
  | 'NOTIFIED_HUB'
  | 'ESCALATED'
  | 'IGNORED_WITH_REASON'
  | 'OTHER';

/* ============================================================
   2. ENTITY INTERFACES
   ============================================================ */

export interface DispatchOfferScoreComponent {
  /** Human readable label — e.g. "Proximity", "Acceptance Rate" */
  label: string;
  /** Normalized value 0..1 */
  value: number;
  /** Weight 0..1 — should sum to 1.0 across components */
  weight: number;
  /** Optional raw metric (km, count, rating, etc.) */
  raw?: string;
}

export interface DispatchOffer {
  id: string;
  booking_id: string;
  booking_code: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  partner_mobile_masked: string;
  stage: DispatchStage;
  outcome: OfferOutcome;
  /** 0..100 weighted score */
  score: number;
  score_components: DispatchOfferScoreComponent[];
  distance_km: number;
  eta_min: number;
  sent_at: string;
  seen_at?: string;
  responded_at?: string;
  expires_at: string;
  decline_reason?: string;
  decline_reason_code?: OfferDeclineReasonCode;
  /** Broadcast stage number when this offer was sent (1-based) */
  broadcast_stage?: number;
  /** Optional provider reference (e.g. push notification ID) */
  delivery_ref?: string;
  /** Final delivery status from provider */
  delivery_status?: 'DELIVERED' | 'FAILED' | 'UNKNOWN';
}

export interface DispatchRun {
  id: string;
  booking_id: string;
  booking_code: string;
  booking_status: BookingStatus;
  customer_name: string;
  customer_mobile_masked: string;
  service_name: string;
  city_name: string;
  sector_name?: string;
  scheduled_at: string;
  stage: DispatchStage;
  offers_sent: number;
  offers_pending: number;
  offers_accepted: number;
  offers_declined: number;
  offers_expired: number;
  first_accept_at?: string;
  winner_partner_id?: string;
  winner_partner_name?: string;
  winner_partner_code?: string;
  reassignment_count: number;
  started_at: string;
  ended_at?: string;
  duration_sec?: number;
  exception?: string;
  exception_type?: ExceptionType;
  /** Current broadcast stage number (1-based) */
  current_broadcast_stage?: number;
  /** Total broadcast stages configured for this run */
  total_broadcast_stages?: number;
  /** Flag: true if any partner accepted atomically (first-accept) */
  atomic_accept_confirmed?: boolean;
  /** Concurrency proof: server-side transaction ID */
  atomicity_ref?: string;
}

export interface DispatchException {
  id: string;
  booking_id: string;
  booking_code: string;
  type: ExceptionType;
  message: string;
  recommended_action: string;
  severity: Severity;
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolution_code?: ExceptionResolutionCode;
  resolution_note?: string;
}

export interface DispatchKpis {
  active_runs: number;
  awaiting_accept: number;
  broadcasting_now: number;
  accepted_today: number;
  expired_today: number;
  failed_today: number;
  avg_accept_time_sec: number;
  acceptance_rate_7d: number;
  reassignments_today: number;
  total_offers_today: number;
  total_accepted_today: number;
  total_declined_today: number;
  total_expired_today: number;
  as_of: string;
}

export interface EligiblePartner {
  partner_id: string;
  partner_name: string;
  partner_code: string;
  mobile_masked: string;
  distance_km: number;
  eta_min: number;
  score: number;
  score_components: DispatchOfferScoreComponent[];
  availability: string;
  rating: number | null;
  rating_sample: number;
  recent_jobs: number;
  eligible: boolean;
  /** If not eligible, machine-readable reasons like NOT_ACTIVE, DOC_EXPIRED etc. */
  reasons_if_not: string[];
  /** Optional reasons in human-readable form */
  reasons_if_not_labels?: string[];
}

export interface DispatchMonitorSnapshot {
  runs: DispatchRun[];
  offers: DispatchOffer[];
  exceptions: DispatchException[];
  kpis: DispatchKpis;
  as_of: string;
}

export interface DispatchRuleConfig {
  /** How many sequential broadcast stages before giving up */
  broadcast_stages: number;
  /** Seconds before an unaccepted offer expires */
  offer_timeout_sec: number;
  /** Max offers in flight at one time */
  max_concurrent_offers: number;
  /** Minimum weighted score (0..100) to be considered */
  min_score_threshold: number;
  /** If true, auto-start reassignment when all offers expire */
  auto_reassign_on_no_accept: boolean;
  /** Delay before starting reassignment (seconds) */
  reassign_delay_sec: number;
  /** Travel buffer between jobs (minutes) */
  crew_travel_buffer_min: number;
  /** Radius (km) for first broadcast stage */
  initial_radius_km: number;
  /** Radius (km) for second broadcast stage (wider) */
  widened_radius_km: number;
  /** Notify hub lead if no accept after this many minutes */
  escalate_to_hub_min: number;
}

/* ============================================================
   3. API PAYLOADS & FILTERS
   ============================================================ */

export interface DispatchActionPayload {
  action: DispatchActionType;
  partner_id?: string;
  reason?: string;
  extend_sec?: number;
}

export interface DispatchRunFilters {
  stage?: DispatchStage | 'ALL';
  city?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export interface DispatchExceptionFilters {
  acknowledged?: boolean;
  severity?: Severity;
  limit?: number;
}

export interface ManualAssignPayload {
  booking_id: string;
  partner_id: string;
  reason: string;
}

export interface AcknowledgeExceptionPayload {
  resolution_code?: ExceptionResolutionCode;
  resolution_note?: string;
}

/* ============================================================
   4. UI LABELS
   ============================================================ */

export const DISPATCH_STAGE_LABELS: Record<DispatchStage, string> = {
  QUEUED: 'Queued',
  BROADCASTING: 'Broadcasting',
  AWAITING_ACCEPT: 'Awaiting Accept',
  ACCEPTED: 'Accepted',
  EXPIRED: 'Expired',
  FAILED: 'Failed',
  REASSIGNING: 'Reassigning',
};

export const OFFER_OUTCOME_LABELS: Record<OfferOutcome, string> = {
  PENDING: 'Pending',
  SEEN: 'Seen',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  NO_ELIGIBLE_PARTNER: 'No Eligible Partner',
  ALL_DECLINED: 'All Declined',
  OFFER_TIMEOUT: 'Offer Timeout',
  CONCURRENCY_VIOLATION: 'Concurrency Violation',
  PARTNER_CANCELLED: 'Partner Cancelled',
  OTHER: 'Other',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const OFFER_DECLINE_REASON_LABELS: Record<
  OfferDeclineReasonCode,
  string
> = {
  TOO_FAR: 'Too far',
  BUSY: 'Busy',
  LOW_PAYOUT: 'Low payout',
  SERVICE_NOT_PREFERRED: 'Service not preferred',
  SCHEDULE_CONFLICT: 'Schedule conflict',
  NOT_INTERESTED: 'Not interested',
  OTHER: 'Other',
};

export const EXCEPTION_RESOLUTION_LABELS: Record<
  ExceptionResolutionCode,
  string
> = {
  RETRIED: 'Retried',
  REASSIGNED_MANUALLY: 'Reassigned manually',
  WIDENED_RADIUS: 'Widened radius',
  NOTIFIED_HUB: 'Notified hub lead',
  ESCALATED: 'Escalated',
  IGNORED_WITH_REASON: 'Ignored with reason',
  OTHER: 'Other',
};

export const DISPATCH_ACTION_LABELS: Record<DispatchActionType, string> = {
  RETRY: 'Retry Dispatch',
  FORCE_ASSIGN: 'Force Assign',
  CANCEL_RUN: 'Cancel Run',
  EXTEND_OFFER: 'Extend Offer',
  MANUAL_ASSIGN: 'Manual Assign',
};

/* ============================================================
   5. HELPER FUNCTIONS
   ============================================================ */

export function isStageActive(stage: DispatchStage): boolean {
  return (
    stage === 'BROADCASTING' ||
    stage === 'AWAITING_ACCEPT' ||
    stage === 'REASSIGNING'
  );
}

export function isStageTerminal(stage: DispatchStage): boolean {
  return stage === 'ACCEPTED' || stage === 'EXPIRED' || stage === 'FAILED';
}

export function isOfferLive(outcome: OfferOutcome): boolean {
  return outcome === 'PENDING' || outcome === 'SEEN';
}

export function isOfferClosed(outcome: OfferOutcome): boolean {
  return (
    outcome === 'ACCEPTED' ||
    outcome === 'DECLINED' ||
    outcome === 'EXPIRED' ||
    outcome === 'CANCELLED'
  );
}

export function formatDispatchDuration(sec?: number | null): string {
  if (sec == null) return '—';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return `${h}h ${rm}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function formatDispatchDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDispatchTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function offerCountdownSec(expiresAt: string): number {
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.round((t - Date.now()) / 1000));
}

export function formatCountdown(sec: number): string {
  if (sec <= 0) return '0s';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function computeWeightedScore(
  components: DispatchOfferScoreComponent[]
): number {
  return (
    components.reduce((sum, c) => sum + c.value * c.weight, 0) * 100
  );
}

export function computeRunDuration(run: DispatchRun): number | null {
  if (run.ended_at && run.started_at) {
    const a = new Date(run.started_at).getTime();
    const b = new Date(run.ended_at).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      return Math.max(0, Math.round((b - a) / 1000));
    }
  }
  if (run.started_at) {
    const a = new Date(run.started_at).getTime();
    if (!Number.isNaN(a)) {
      return Math.max(0, Math.round((Date.now() - a) / 1000));
    }
  }
  return run.duration_sec ?? null;
}

export function getSeverityColor(sev: Severity): string {
  switch (sev) {
    case 'HIGH':
      return '#991b1b';
    case 'MEDIUM':
      return '#92400e';
    case 'LOW':
      return '#6b7280';
    default:
      return '#6b7280';
  }
}

export function getStageColor(stage: DispatchStage): string {
  switch (stage) {
    case 'ACCEPTED':
      return '#166534';
    case 'AWAITING_ACCEPT':
      return '#92400e';
    case 'BROADCASTING':
      return '#5b21b6';
    case 'QUEUED':
      return '#374151';
    case 'EXPIRED':
      return '#6b7280';
    case 'FAILED':
      return '#991b1b';
    case 'REASSIGNING':
      return '#92400e';
    default:
      return '#374151';
  }
}

export function isExceptionOpen(ex: DispatchException): boolean {
  return !ex.acknowledged;
}

/* ============================================================
   6. DEFAULT CONFIGURATION
   ============================================================ */

export const DEFAULT_DISPATCH_RULES: DispatchRuleConfig = {
  broadcast_stages: 2,
  offer_timeout_sec: 120,
  max_concurrent_offers: 8,
  min_score_threshold: 30,
  auto_reassign_on_no_accept: true,
  reassign_delay_sec: 60,
  crew_travel_buffer_min: 30,
  initial_radius_km: 5,
  widened_radius_km: 10,
  escalate_to_hub_min: 10,
};

/* ============================================================
   7. FIRST-ACCEPT ATOMICITY
   ============================================================ */

/**
 * FIRST-ACCEPT ATOMICITY — documented contract
 * ------------------------------------------------------------------
 * Only ONE partner can win a booking.
 *
 * Backend enforcement:
 *   BEGIN TRANSACTION;
 *     SELECT * FROM bookings WHERE id = :booking_id FOR UPDATE;
 *     IF booking.status <> 'DISPATCHING' THEN
 *       ROLLBACK;
 *       RETURN HTTP 409 { code: BOOKING_ALREADY_ASSIGNED };
 *     END IF;
 *     UPDATE bookings SET partner_id = :partner_id, status = 'ASSIGNED';
 *     UPDATE dispatch_offers SET outcome = 'ACCEPTED'
 *       WHERE id = :offer_id;
 *     UPDATE dispatch_offers SET outcome = 'CANCELLED',
 *       decline_reason_code = 'LOST_TO_ANOTHER_PARTNER'
 *       WHERE booking_id = :booking_id AND id <> :offer_id
 *       AND outcome IN ('PENDING','SEEN');
 *   COMMIT;
 *
 * Concurrency proof:
 *   - SELECT ... FOR UPDATE serializes both accepts.
 *   - Second accept receives HTTP 409 BOOKING_ALREADY_ASSIGNED.
 *   - Losing partner is notified: "Offer taken by another partner".
 *   - The winning offer stores `responded_at` (earliest wins).
 */
export const FIRST_ACCEPT_LOCK_MODE = 'SELECT_FOR_UPDATE' as const;

export const CONCURRENCY_ERROR_CODE = 'BOOKING_ALREADY_ASSIGNED' as const;

export const OFFER_CANCEL_REASON = {
  LOST_TO_ANOTHER_PARTNER: 'LOST_TO_ANOTHER_PARTNER',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  TIMEOUT: 'TIMEOUT',
  PARTNER_UNAVAILABLE: 'PARTNER_UNAVAILABLE',
  WIDENED_BROADCAST: 'WIDENED_BROADCAST',
} as const;

export type OfferCancelReason =
  (typeof OFFER_CANCEL_REASON)[keyof typeof OFFER_CANCEL_REASON];

export const OFFER_CANCEL_REASON_LABELS: Record<OfferCancelReason, string> = {
  LOST_TO_ANOTHER_PARTNER: 'Lost to another partner',
  BOOKING_CANCELLED: 'Booking cancelled',
  TIMEOUT: 'Timed out',
  PARTNER_UNAVAILABLE: 'Partner unavailable',
  WIDENED_BROADCAST: 'Widened broadcast — cancelled in prior stage',
};

/* ============================================================
   8. SCORE WEIGHT CONFIGURATION
   ============================================================ */

export interface ScoreWeightConfig {
  proximity: number;
  acceptance_rate: number;
  quality_score: number;
  skill_level: number;
  load_balance: number;
  reliability: number;
  tier_bonus: number;
  no_show_penalty: number;
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeightConfig = {
  proximity: 0.35,
  acceptance_rate: 0.2,
  quality_score: 0.25,
  skill_level: 0.05,
  load_balance: 0.1,
  reliability: 0.05,
  tier_bonus: 0.05,
  no_show_penalty: -0.15,
};

export function validateScoreWeights(w: ScoreWeightConfig): {
  valid: boolean;
  sum: number;
} {
  const sum =
    w.proximity +
    w.acceptance_rate +
    w.quality_score +
    w.skill_level +
    w.load_balance +
    w.reliability +
    w.tier_bonus;
  // Sum of positive weights should be ~1.0 (no_show_penalty is negative)
  const valid = Math.abs(sum - 1) < 0.001;
  return { valid, sum };
}

/* ============================================================
   9. REASON CODES
   ============================================================ */

export const DISPATCH_REASON_CODES = {
  NO_ACTIVE_PARTNERS: 'NO_ACTIVE_PARTNERS',
  OUT_OF_COVERAGE: 'OUT_OF_COVERAGE',
  ALL_DOCS_EXPIRED: 'ALL_DOCS_EXPIRED',
  ALL_PARTNERS_BUSY: 'ALL_PARTNERS_BUSY',
  CATEGORY_NOT_READY: 'CATEGORY_NOT_READY',
  CAPACITY_REACHED: 'CAPACITY_REACHED',
  DUES_LIMIT: 'DUES_LIMIT',
  CASE_BLOCKING: 'CASE_BLOCKING',
  NO_CHANNEL: 'NO_CHANNEL',
} as const;

export type DispatchReasonCode =
  (typeof DISPATCH_REASON_CODES)[keyof typeof DISPATCH_REASON_CODES];

export const DISPATCH_REASON_LABELS: Record<DispatchReasonCode, string> = {
  NO_ACTIVE_PARTNERS: 'No active partners in the area',
  OUT_OF_COVERAGE: 'Booking is outside all partner coverage',
  ALL_DOCS_EXPIRED: 'All nearby partners have expired documents',
  ALL_PARTNERS_BUSY: 'All nearby partners are busy',
  CATEGORY_NOT_READY: 'No partner has this category active',
  CAPACITY_REACHED: 'Partners have hit their daily capacity limit',
  DUES_LIMIT: 'Partners exceeded cash remittance limit',
  CASE_BLOCKING: 'Partners have blocking open cases',
  NO_CHANNEL: 'No reachable notification channel',
};

/* ============================================================
   10. SEED DATA (starter — used until API is live)
   ============================================================ */

export const STARTER_DISPATCH_RUNS: DispatchRun[] = [
  {
    id: 'run-1',
    booking_id: 'bk-2',
    booking_code: 'BK-20392',
    booking_status: 'DISPATCHING',
    customer_name: 'Priya Mehta',
    customer_mobile_masked: '98765****2',
    service_name: '2 Bathroom Deep Clean',
    city_name: 'Gurugram',
    sector_name: 'Sector 45',
    scheduled_at: new Date(Date.now() + 4 * 3600000).toISOString(),
    stage: 'AWAITING_ACCEPT',
    offers_sent: 6,
    offers_pending: 4,
    offers_accepted: 0,
    offers_declined: 1,
    offers_expired: 0,
    reassignment_count: 0,
    started_at: new Date(Date.now() - 45000).toISOString(),
    duration_sec: 45,
    current_broadcast_stage: 1,
    total_broadcast_stages: 2,
    atomic_accept_confirmed: false,
  },
  {
    id: 'run-2',
    booking_id: 'bk-4',
    booking_code: 'BK-20394',
    booking_status: 'DISPATCHING',
    customer_name: 'Neha Singh',
    customer_mobile_masked: '98765****4',
    service_name: '3-Seater Sofa Clean',
    city_name: 'Mumbai',
    sector_name: 'Andheri',
    scheduled_at: new Date(Date.now() + 6 * 3600000).toISOString(),
    stage: 'BROADCASTING',
    offers_sent: 3,
    offers_pending: 3,
    offers_accepted: 0,
    offers_declined: 0,
    offers_expired: 0,
    reassignment_count: 0,
    started_at: new Date(Date.now() - 12000).toISOString(),
    duration_sec: 12,
    current_broadcast_stage: 1,
    total_broadcast_stages: 2,
    atomic_accept_confirmed: false,
  },
  {
    id: 'run-3',
    booking_id: 'bk-1',
    booking_code: 'BK-20391',
    booking_status: 'ASSIGNED',
    customer_name: 'Rohit Sharma',
    customer_mobile_masked: '98765****1',
    service_name: '2BHK Deep Cleaning',
    city_name: 'Gurugram',
    sector_name: 'Sector 56',
    scheduled_at: new Date(Date.now() + 2 * 3600000).toISOString(),
    stage: 'ACCEPTED',
    offers_sent: 8,
    offers_pending: 0,
    offers_accepted: 1,
    offers_declined: 2,
    offers_expired: 0,
    first_accept_at: new Date(Date.now() - 300000).toISOString(),
    winner_partner_id: 'p-1',
    winner_partner_name: 'Ramesh Kumar',
    winner_partner_code: 'BPE-PRO-1001',
    reassignment_count: 0,
    started_at: new Date(Date.now() - 330000).toISOString(),
    ended_at: new Date(Date.now() - 300000).toISOString(),
    duration_sec: 30,
    current_broadcast_stage: 1,
    total_broadcast_stages: 2,
    atomic_accept_confirmed: true,
    atomicity_ref: 'TXN-2026-10-01-AAAA-0001',
  },
  {
    id: 'run-4',
    booking_id: 'bk-8',
    booking_code: 'BK-20398',
    booking_status: 'REASSIGNMENT_REQUIRED',
    customer_name: 'Ritu Kapoor',
    customer_mobile_masked: '98765****8',
    service_name: 'Kitchen Deep Clean',
    city_name: 'Delhi',
    sector_name: 'Saket',
    scheduled_at: new Date(Date.now() + 8 * 3600000).toISOString(),
    stage: 'REASSIGNING',
    offers_sent: 5,
    offers_pending: 0,
    offers_accepted: 0,
    offers_declined: 3,
    offers_expired: 2,
    reassignment_count: 1,
    started_at: new Date(Date.now() - 900000).toISOString(),
    duration_sec: 900,
    current_broadcast_stage: 2,
    total_broadcast_stages: 2,
    exception: 'Partner cancelled after accept — reassignment started',
    exception_type: 'PARTNER_CANCELLED',
  },
  {
    id: 'run-5',
    booking_id: 'bk-9',
    booking_code: 'BK-20399',
    booking_status: 'DISPATCHING',
    customer_name: 'Anil Joshi',
    customer_mobile_masked: '98765****9',
    service_name: 'Single-Disc Machine Cleaning',
    city_name: 'Noida',
    sector_name: 'Sector 62',
    scheduled_at: new Date(Date.now() + 5 * 3600000).toISOString(),
    stage: 'FAILED',
    offers_sent: 0,
    offers_pending: 0,
    offers_accepted: 0,
    offers_declined: 0,
    offers_expired: 0,
    reassignment_count: 0,
    started_at: new Date(Date.now() - 1800000).toISOString(),
    ended_at: new Date(Date.now() - 1800000).toISOString(),
    duration_sec: 0,
    exception: 'No eligible partner found within widened radius',
    exception_type: 'NO_ELIGIBLE_PARTNER',
    current_broadcast_stage: 2,
    total_broadcast_stages: 2,
  },
];

export const STARTER_DISPATCH_OFFERS: DispatchOffer[] = [
  {
    id: 'of-1',
    booking_id: 'bk-2',
    booking_code: 'BK-20392',
    partner_id: 'p-1',
    partner_name: 'Ramesh Kumar',
    partner_code: 'BPE-PRO-1001',
    partner_mobile_masked: '98765****1',
    stage: 'AWAITING_ACCEPT',
    outcome: 'PENDING',
    score: 92.4,
    score_components: [
      { label: 'Proximity', value: 0.94, weight: 0.35, raw: '2.4 km' },
      { label: 'Acceptance Rate', value: 0.86, weight: 0.2, raw: '86%' },
      { label: 'Quality Score', value: 0.91, weight: 0.25, raw: '91' },
      { label: 'Skill Level', value: 1, weight: 0.05, raw: 'Expert' },
      { label: 'Load Balance', value: 0.78, weight: 0.1, raw: '2 recent' },
      { label: 'Reliability', value: 0.92, weight: 0.05, raw: '92%' },
    ],
    distance_km: 2.4,
    eta_min: 12,
    sent_at: new Date(Date.now() - 40000).toISOString(),
    expires_at: new Date(Date.now() + 80000).toISOString(),
    broadcast_stage: 1,
    delivery_status: 'DELIVERED',
  },
  {
    id: 'of-2',
    booking_id: 'bk-2',
    booking_code: 'BK-20392',
    partner_id: 'p-2',
    partner_name: 'Suresh Yadav',
    partner_code: 'BPE-PRO-1002',
    partner_mobile_masked: '98765****2',
    stage: 'AWAITING_ACCEPT',
    outcome: 'SEEN',
    score: 88.1,
    score_components: [
      { label: 'Proximity', value: 0.82, weight: 0.35, raw: '3.8 km' },
      { label: 'Acceptance Rate', value: 0.9, weight: 0.2, raw: '90%' },
      { label: 'Quality Score', value: 0.88, weight: 0.25, raw: '88' },
      { label: 'Skill Level', value: 0.8, weight: 0.05, raw: 'Intermediate' },
      { label: 'Load Balance', value: 0.85, weight: 0.1, raw: '1 recent' },
      { label: 'Reliability', value: 0.9, weight: 0.05, raw: '90%' },
    ],
    distance_km: 3.8,
    eta_min: 18,
    sent_at: new Date(Date.now() - 40000).toISOString(),
    seen_at: new Date(Date.now() - 20000).toISOString(),
    expires_at: new Date(Date.now() + 80000).toISOString(),
    broadcast_stage: 1,
    delivery_status: 'DELIVERED',
  },
  {
    id: 'of-3',
    booking_id: 'bk-2',
    booking_code: 'BK-20392',
    partner_id: 'p-3',
    partner_name: 'Mohan Lal',
    partner_code: 'BPE-PRO-1003',
    partner_mobile_masked: '98765****3',
    stage: 'AWAITING_ACCEPT',
    outcome: 'DECLINED',
    score: 78.5,
    score_components: [
      { label: 'Proximity', value: 0.7, weight: 0.35, raw: '5.2 km' },
      { label: 'Acceptance Rate', value: 0.72, weight: 0.2, raw: '72%' },
      { label: 'Quality Score', value: 0.82, weight: 0.25, raw: '82' },
      { label: 'Skill Level', value: 0.8, weight: 0.05, raw: 'Intermediate' },
      { label: 'Load Balance', value: 0.9, weight: 0.1, raw: '0 recent' },
      { label: 'Reliability', value: 0.85, weight: 0.05, raw: '85%' },
    ],
    distance_km: 5.2,
    eta_min: 22,
    sent_at: new Date(Date.now() - 40000).toISOString(),
    responded_at: new Date(Date.now() - 25000).toISOString(),
    expires_at: new Date(Date.now() + 80000).toISOString(),
    decline_reason: 'Too far from my area',
    decline_reason_code: 'TOO_FAR',
    broadcast_stage: 1,
    delivery_status: 'DELIVERED',
  },
  {
    id: 'of-4',
    booking_id: 'bk-1',
    booking_code: 'BK-20391',
    partner_id: 'p-1',
    partner_name: 'Ramesh Kumar',
    partner_code: 'BPE-PRO-1001',
    partner_mobile_masked: '98765****1',
    stage: 'ACCEPTED',
    outcome: 'ACCEPTED',
    score: 94.1,
    score_components: [
      { label: 'Proximity', value: 0.96, weight: 0.35, raw: '1.8 km' },
      { label: 'Acceptance Rate', value: 0.9, weight: 0.2, raw: '90%' },
      { label: 'Quality Score', value: 0.92, weight: 0.25, raw: '92' },
      { label: 'Skill Level', value: 1, weight: 0.05, raw: 'Expert' },
      { label: 'Load Balance', value: 0.85, weight: 0.1, raw: '1 recent' },
      { label: 'Reliability', value: 0.95, weight: 0.05, raw: '95%' },
    ],
    distance_km: 1.8,
    eta_min: 9,
    sent_at: new Date(Date.now() - 330000).toISOString(),
    seen_at: new Date(Date.now() - 315000).toISOString(),
    responded_at: new Date(Date.now() - 300000).toISOString(),
    expires_at: new Date(Date.now() - 210000).toISOString(),
    broadcast_stage: 1,
    delivery_status: 'DELIVERED',
  },
];

export const STARTER_DISPATCH_EXCEPTIONS: DispatchException[] = [
  {
    id: 'ex-1',
    booking_id: 'bk-8',
    booking_code: 'BK-20398',
    type: 'PARTNER_CANCELLED',
    message:
      'Partner cancelled after accepting — booking needs reassignment.',
    recommended_action: 'Start reassignment broadcast',
    severity: 'HIGH',
    created_at: new Date(Date.now() - 600000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'ex-2',
    booking_id: 'bk-9',
    booking_code: 'BK-20399',
    type: 'NO_ELIGIBLE_PARTNER',
    message:
      'No eligible partner in this sector for Single-Disc Machine Cleaning.',
    recommended_action: 'Widen radius or notify hub lead',
    severity: 'MEDIUM',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'ex-3',
    booking_id: 'bk-2',
    booking_code: 'BK-20392',
    type: 'ALL_DECLINED',
    message: '3 of 6 offers declined within first broadcast stage.',
    recommended_action: 'Widen to stage 2 broadcast',
    severity: 'LOW',
    created_at: new Date(Date.now() - 300000).toISOString(),
    acknowledged: true,
    acknowledged_by: 'Live Dispatch Commander',
    acknowledged_at: new Date(Date.now() - 200000).toISOString(),
    resolution_code: 'WIDENED_RADIUS',
    resolution_note: 'Auto-widened to stage 2 broadcast.',
  },
];

export const STARTER_ELIGIBLE_PARTNERS: EligiblePartner[] = [
  {
    partner_id: 'p-1',
    partner_name: 'Ramesh Kumar',
    partner_code: 'BPE-PRO-1001',
    mobile_masked: '98765****1',
    distance_km: 2.4,
    eta_min: 12,
    score: 92.4,
    score_components: [
      { label: 'Proximity', value: 0.94, weight: 0.35, raw: '2.4 km' },
      { label: 'Acceptance Rate', value: 0.86, weight: 0.2, raw: '86%' },
      { label: 'Quality Score', value: 0.91, weight: 0.25, raw: '91' },
      { label: 'Skill Level', value: 1, weight: 0.05, raw: 'Expert' },
      { label: 'Load Balance', value: 0.78, weight: 0.1, raw: '2 recent' },
      { label: 'Reliability', value: 0.92, weight: 0.05, raw: '92%' },
    ],
    availability: 'AVAILABLE',
    rating: 4.7,
    rating_sample: 42,
    recent_jobs: 2,
    eligible: true,
    reasons_if_not: [],
    reasons_if_not_labels: [],
  },
  {
    partner_id: 'p-2',
    partner_name: 'Suresh Yadav',
    partner_code: 'BPE-PRO-1002',
    mobile_masked: '98765****2',
    distance_km: 3.8,
    eta_min: 18,
    score: 88.1,
    score_components: [
      { label: 'Proximity', value: 0.82, weight: 0.35, raw: '3.8 km' },
      { label: 'Acceptance Rate', value: 0.9, weight: 0.2, raw: '90%' },
      { label: 'Quality Score', value: 0.88, weight: 0.25, raw: '88' },
      { label: 'Skill Level', value: 0.8, weight: 0.05, raw: 'Intermediate' },
      { label: 'Load Balance', value: 0.85, weight: 0.1, raw: '1 recent' },
      { label: 'Reliability', value: 0.9, weight: 0.05, raw: '90%' },
    ],
    availability: 'AVAILABLE',
    rating: 4.5,
    rating_sample: 28,
    recent_jobs: 1,
    eligible: true,
    reasons_if_not: [],
    reasons_if_not_labels: [],
  },
  {
    partner_id: 'p-3',
    partner_name: 'Mohan Lal',
    partner_code: 'BPE-PRO-1003',
    mobile_masked: '98765****3',
    distance_km: 5.2,
    eta_min: 22,
    score: 78.5,
    score_components: [
      { label: 'Proximity', value: 0.7, weight: 0.35, raw: '5.2 km' },
      { label: 'Acceptance Rate', value: 0.72, weight: 0.2, raw: '72%' },
      { label: 'Quality Score', value: 0.82, weight: 0.25, raw: '82' },
      { label: 'Skill Level', value: 0.8, weight: 0.05, raw: 'Intermediate' },
      { label: 'Load Balance', value: 0.9, weight: 0.1, raw: '0 recent' },
      { label: 'Reliability', value: 0.85, weight: 0.05, raw: '85%' },
    ],
    availability: 'AVAILABLE',
    rating: 4.4,
    rating_sample: 18,
    recent_jobs: 0,
    eligible: true,
    reasons_if_not: [],
    reasons_if_not_labels: [],
  },
  {
    partner_id: 'p-4',
    partner_name: 'Ajay Singh',
    partner_code: 'BPE-PRO-1004',
    mobile_masked: '98765****4',
    distance_km: 1.1,
    eta_min: 6,
    score: 0,
    score_components: [],
    availability: 'AVAILABLE',
    rating: 4.6,
    rating_sample: 36,
    recent_jobs: 1,
    eligible: false,
    reasons_if_not: ['DOC_EXPIRED:POLICE_VERIFICATION'],
    reasons_if_not_labels: ['Police verification expired'],
  },
  {
    partner_id: 'p-5',
    partner_name: 'Vijay Sharma',
    partner_code: 'BPE-PRO-1005',
    mobile_masked: '98765****5',
    distance_km: 4.5,
    eta_min: 16,
    score: 0,
    score_components: [],
    availability: 'BUSY',
    rating: 4.8,
    rating_sample: 52,
    recent_jobs: 3,
    eligible: false,
    reasons_if_not: ['CAPACITY_REACHED'],
    reasons_if_not_labels: ['Daily capacity reached'],
  },
];

/* ============================================================
   11. SORTING & COMPARISON HELPERS
   ============================================================ */

export function sortRunsByRecency(runs: DispatchRun[]): DispatchRun[] {
  return [...runs].sort(
    (a, b) =>
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
}

export function sortOffersByScore(offers: DispatchOffer[]): DispatchOffer[] {
  return [...offers].sort((a, b) => b.score - a.score);
}

export function sortEligibleByScore(
  partners: EligiblePartner[]
): EligiblePartner[] {
  return [...partners].sort((a, b) => b.score - a.score);
}

export function compareSeverity(a: Severity, b: Severity): number {
  const rank: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return rank[a] - rank[b];
}