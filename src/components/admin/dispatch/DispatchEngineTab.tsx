import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/* ============================================================
   BHARAT PRO EXPERTS — DISPATCH ENGINE TAB
   Self-contained component.
   ============================================================ */

type DispatchStage =
  | 'QUEUED'
  | 'BROADCASTING'
  | 'AWAITING_ACCEPT'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'FAILED'
  | 'REASSIGNING';

type OfferOutcome =
  | 'PENDING'
  | 'SEEN'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

type ExceptionType =
  | 'NO_ELIGIBLE_PARTNER'
  | 'ALL_DECLINED'
  | 'OFFER_TIMEOUT'
  | 'CONCURRENCY_VIOLATION'
  | 'PARTNER_CANCELLED'
  | 'OTHER';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

interface ScoreComponent {
  label: string;
  value: number;
  weight: number;
  raw?: string;
}

interface DispatchOffer {
  id: string;
  booking_id: string;
  booking_code: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  partner_mobile_masked: string;
  stage: DispatchStage;
  outcome: OfferOutcome;
  score: number;
  score_components: ScoreComponent[];
  distance_km: number;
  eta_min: number;
  sent_at: string;
  seen_at?: string;
  responded_at?: string;
  expires_at: string;
  decline_reason?: string;
  broadcast_stage?: number;
}

interface DispatchRun {
  id: string;
  booking_id: string;
  booking_code: string;
  booking_status: string;
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
  current_broadcast_stage?: number;
  total_broadcast_stages?: number;
  atomic_accept_confirmed?: boolean;
  atomicity_ref?: string;
}

interface DispatchException {
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
}

interface EligiblePartner {
  partner_id: string;
  partner_name: string;
  partner_code: string;
  mobile_masked: string;
  distance_km: number;
  eta_min: number;
  score: number;
  score_components: ScoreComponent[];
  availability: string;
  rating: number | null;
  rating_sample: number;
  recent_jobs: number;
  eligible: boolean;
  reasons_if_not: string[];
  reasons_if_not_labels?: string[];
}

const STAGE_LABELS: Record<DispatchStage, string> = {
  QUEUED: 'Queued',
  BROADCASTING: 'Broadcasting',
  AWAITING_ACCEPT: 'Awaiting Accept',
  ACCEPTED: 'Accepted',
  EXPIRED: 'Expired',
  FAILED: 'Failed',
  REASSIGNING: 'Reassigning',
};

const OUTCOME_LABELS: Record<OfferOutcome, string> = {
  PENDING: 'Pending',
  SEEN: 'Seen',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

const EXCEPTION_LABELS: Record<ExceptionType, string> = {
  NO_ELIGIBLE_PARTNER: 'No Eligible Partner',
  ALL_DECLINED: 'All Declined',
  OFFER_TIMEOUT: 'Offer Timeout',
  CONCURRENCY_VIOLATION: 'Concurrency Violation',
  PARTNER_CANCELLED: 'Partner Cancelled',
  OTHER: 'Other',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

/* ---------------- Seed Data ---------------- */

const STARTER_RUNS: DispatchRun[] = [
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
    exception: 'Partner cancelled after accept',
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
    exception: 'No eligible partner found',
    exception_type: 'NO_ELIGIBLE_PARTNER',
    current_broadcast_stage: 2,
    total_broadcast_stages: 2,
  },
];

const STARTER_OFFERS: DispatchOffer[] = [
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
      { label: 'Load Balance', value: 0.78, weight: 0.1, raw: '2 recent' },
      { label: 'Reliability', value: 0.92, weight: 0.05, raw: '92%' },
    ],
    distance_km: 2.4,
    eta_min: 12,
    sent_at: new Date(Date.now() - 40000).toISOString(),
    expires_at: new Date(Date.now() + 80000).toISOString(),
    broadcast_stage: 1,
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
      { label: 'Load Balance', value: 0.85, weight: 0.1, raw: '1 recent' },
      { label: 'Reliability', value: 0.9, weight: 0.05, raw: '90%' },
    ],
    distance_km: 3.8,
    eta_min: 18,
    sent_at: new Date(Date.now() - 40000).toISOString(),
    seen_at: new Date(Date.now() - 20000).toISOString(),
    expires_at: new Date(Date.now() + 80000).toISOString(),
    broadcast_stage: 1,
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
      { label: 'Load Balance', value: 0.9, weight: 0.1, raw: '0 recent' },
      { label: 'Reliability', value: 0.85, weight: 0.05, raw: '85%' },
    ],
    distance_km: 5.2,
    eta_min: 22,
    sent_at: new Date(Date.now() - 40000).toISOString(),
    responded_at: new Date(Date.now() - 25000).toISOString(),
    expires_at: new Date(Date.now() + 80000).toISOString(),
    decline_reason: 'Too far from my area',
    broadcast_stage: 1,
  },
];

const STARTER_EXCEPTIONS: DispatchException[] = [
  {
    id: 'ex-1',
    booking_id: 'bk-8',
    booking_code: 'BK-20398',
    type: 'PARTNER_CANCELLED',
    message: 'Partner cancelled after accepting — booking needs reassignment.',
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
    message: 'No eligible partner in this sector.',
    recommended_action: 'Widen radius or notify hub lead',
    severity: 'MEDIUM',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    acknowledged: false,
  },
];

const STARTER_ELIGIBLE: EligiblePartner[] = [
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

/* ---------------- Helpers ---------------- */

function formatDuration(sec?: number | null): string {
  if (sec == null) return '—';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatDate(iso?: string | null): string {
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

function formatCountdown(expiresAt: string): string {
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return '—';
  const sec = Math.max(0, Math.round((t - Date.now()) / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function stageTone(stage: DispatchStage): CSSProperties {
  switch (stage) {
    case 'ACCEPTED':
      return styles.stageAccepted;
    case 'AWAITING_ACCEPT':
      return styles.stageAwaiting;
    case 'BROADCASTING':
      return styles.stageBroadcasting;
    case 'QUEUED':
      return styles.stageQueued;
    case 'EXPIRED':
      return styles.stageExpired;
    case 'FAILED':
      return styles.stageFailed;
    case 'REASSIGNING':
      return styles.stageReassigning;
    default:
      return styles.stageQueued;
  }
}

function outcomeTone(outcome: OfferOutcome): CSSProperties {
  switch (outcome) {
    case 'ACCEPTED':
      return styles.outcomeAccepted;
    case 'PENDING':
      return styles.outcomePending;
    case 'SEEN':
      return styles.outcomeSeen;
    case 'DECLINED':
      return styles.outcomeDeclined;
    case 'EXPIRED':
      return styles.outcomeExpired;
    case 'CANCELLED':
      return styles.outcomeCancelled;
    default:
      return styles.outcomePending;
  }
}

function severityTone(sev: Severity): CSSProperties {
  switch (sev) {
    case 'HIGH':
      return styles.sevHigh;
    case 'MEDIUM':
      return styles.sevMedium;
    case 'LOW':
      return styles.sevLow;
    default:
      return styles.sevLow;
  }
}

/* ---------------- Main Component ---------------- */

export interface DispatchEngineTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
  onBookingSelect?: (bookingId: string) => void;
}

export default function DispatchEngineTab({
  onPartnerSelect,
  onBookingSelect,
}: DispatchEngineTabProps) {
  const [runs, setRuns] = useState<DispatchRun[]>(STARTER_RUNS);
  const [exceptions, setExceptions] =
    useState<DispatchException[]>(STARTER_EXCEPTIONS);
  const [loading, setLoading] = useState(false);
  const [stageFilter, setStageFilter] = useState<'ALL' | DispatchStage>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedRun, setSelectedRun] = useState<DispatchRun | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setRuns(STARTER_RUNS);
      setExceptions(STARTER_EXCEPTIONS);
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cityOptions = useMemo(() => {
    const s = new Set<string>();
    runs.forEach((r) => {
      if (r.city_name) s.add(r.city_name);
    });
    return Array.from(s).sort();
  }, [runs]);

  const filteredRuns = useMemo(() => {
    let list = [...runs];
    if (stageFilter !== 'ALL') list = list.filter((r) => r.stage === stageFilter);
    if (cityFilter !== 'ALL') list = list.filter((r) => r.city_name === cityFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.booking_code.toLowerCase().includes(q) ||
          r.customer_name.toLowerCase().includes(q) ||
          (r.winner_partner_name ?? '').toLowerCase().includes(q) ||
          r.service_name.toLowerCase().includes(q)
      );
    }
    list.sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
    return list;
  }, [runs, stageFilter, cityFilter, search]);

  const summary = useMemo(() => {
    const active = runs.filter(
      (r) =>
        r.stage === 'BROADCASTING' ||
        r.stage === 'AWAITING_ACCEPT' ||
        r.stage === 'REASSIGNING'
    ).length;
    const accepted = runs.filter((r) => r.stage === 'ACCEPTED').length;
    const expired = runs.filter((r) => r.stage === 'EXPIRED').length;
    const failed = runs.filter((r) => r.stage === 'FAILED').length;
    const openExceptions = exceptions.filter((e) => !e.acknowledged).length;
    const avgAccept =
      accepted > 0
        ? Math.round(
            runs
              .filter((r) => r.stage === 'ACCEPTED')
              .reduce((s, r) => s + (r.duration_sec ?? 0), 0) / accepted
          )
        : 0;
    return { active, accepted, expired, failed, openExceptions, avgAccept };
  }, [runs, exceptions]);

  const handleAcknowledge = (id: string) => {
    setExceptions((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              acknowledged: true,
              acknowledged_at: new Date().toISOString(),
              acknowledged_by: 'Admin',
            }
          : e
      )
    );
  };

  const handleAction = (
    action: 'RETRY' | 'FORCE_ASSIGN' | 'CANCEL_RUN' | 'EXTEND_OFFER'
  ) => {
    setActionMsg(
      `Action ${action} submitted — API wiring required for real execution.`
    );
    setTimeout(() => setActionMsg(null), 4000);
  };

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.title}>Dispatch Engine — Live Monitor</div>
          <div style={styles.subtitle}>
            Auto-dispatch · first-accept atomic · eligibility shared
          </div>
        </div>
        <div style={styles.topActions}>
          <span style={styles.liveIndicator}>
            <span style={styles.liveDot} />
            Live
          </span>
          <button style={styles.refreshBtn} onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div style={styles.infoBanner}>
        <strong>Note:</strong> Dispatch API not configured yet — showing starter
        seed data.
      </div>

      <div style={styles.kpiRow}>
        <KpiCard
          label="Active Runs"
          value={String(summary.active)}
          sub="broadcast + awaiting"
          tone="warning"
        />
        <KpiCard
          label="Accepted"
          value={String(summary.accepted)}
          sub="first-accept wins"
          tone="success"
        />
        <KpiCard
          label="Expired"
          value={String(summary.expired)}
          sub="no accept in time"
          tone="danger"
        />
        <KpiCard
          label="Failed"
          value={String(summary.failed)}
          sub="exceptions logged"
          tone="danger"
        />
        <KpiCard
          label="Avg Accept Time"
          value={formatDuration(summary.avgAccept)}
          sub="accepted runs"
          tone="info"
        />
        <KpiCard
          label="Open Exceptions"
          value={String(summary.openExceptions)}
          sub="needs acknowledgement"
          tone={summary.openExceptions > 0 ? 'danger' : 'success'}
        />
      </div>

      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="Search booking code, customer, partner, service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={stageFilter}
          onChange={(e) =>
            setStageFilter(e.target.value as 'ALL' | DispatchStage)
          }
        >
          <option value="ALL">All Stages</option>
          <option value="QUEUED">Queued</option>
          <option value="BROADCASTING">Broadcasting</option>
          <option value="AWAITING_ACCEPT">Awaiting Accept</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="EXPIRED">Expired</option>
          <option value="FAILED">Failed</option>
          <option value="REASSIGNING">Reassigning</option>
        </select>
        <select
          style={styles.select}
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="ALL">All Cities</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.sectionTitle}>
        Live Dispatch Runs ({filteredRuns.length})
      </div>
      {filteredRuns.length === 0 ? (
        <div style={styles.state}>
          <h3 style={{ margin: 0 }}>No dispatch runs match</h3>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
            Try changing filters.
          </p>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <Th>Booking</Th>
                <Th>Customer</Th>
                <Th>Service</Th>
                <Th>Location</Th>
                <Th>Stage</Th>
                <Th>Offers</Th>
                <Th>Winner</Th>
                <Th>Duration</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <button
                      style={styles.linkBtn}
                      onClick={() => onBookingSelect?.(r.booking_id)}
                      disabled={!onBookingSelect}
                    >
                      {r.booking_code}
                    </button>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {formatDate(r.started_at)}
                    </div>
                  </Td>
                  <Td>
                    <div style={{ fontWeight: 700 }}>{r.customer_name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {r.customer_mobile_masked}
                    </div>
                  </Td>
                  <Td>{r.service_name}</Td>
                  <Td>
                    <div style={{ fontSize: 12 }}>{r.city_name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {r.sector_name ?? '—'}
                    </div>
                  </Td>
                  <Td>
                    <span style={stageTone(r.stage)}>
                      {STAGE_LABELS[r.stage]}
                    </span>
                  </Td>
                  <Td>
                    <div style={{ fontSize: 12 }}>
                      <strong>{r.offers_sent}</strong> sent
                    </div>
                    <div style={{ fontSize: 11, color: '#92400e' }}>
                      {r.offers_pending} pending
                    </div>
                    {r.offers_accepted > 0 && (
                      <div style={{ fontSize: 11, color: '#166534' }}>
                        {r.offers_accepted} accepted
                      </div>
                    )}
                  </Td>
                  <Td>
                    {r.winner_partner_name ? (
                      <>
                        <button
                          style={styles.linkBtn}
                          onClick={() =>
                            r.winner_partner_id &&
                            onPartnerSelect?.(r.winner_partner_id)
                          }
                          disabled={!onPartnerSelect}
                        >
                          {r.winner_partner_name}
                        </button>
                        {r.atomic_accept_confirmed && (
                          <div
                            style={{
                              fontSize: 10,
                              color: '#166534',
                              fontWeight: 700,
                            }}
                          >
                            ✓ Atomic
                          </div>
                        )}
                      </>
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          color: '#9ca3af',
                          fontStyle: 'italic',
                        }}
                      >
                        —
                      </span>
                    )}
                  </Td>
                  <Td>{formatDuration(r.duration_sec)}</Td>
                  <Td>
                    <button
                      style={styles.smallBtn}
                      onClick={() => setSelectedRun(r)}
                    >
                      View
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.sectionTitle}>
        Dispatch Exceptions (
        {exceptions.filter((e) => !e.acknowledged).length} open)
      </div>
      {exceptions.length === 0 ? (
        <div style={styles.state}>
          <h3 style={{ margin: 0 }}>No exceptions</h3>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
            Dispatch is healthy.
          </p>
        </div>
      ) : (
        <div style={styles.exceptionList}>
          {exceptions.map((ex) => (
            <div
              key={ex.id}
              style={
                ex.acknowledged ? styles.exceptionRowAck : styles.exceptionRow
              }
            >
              <div style={styles.exceptionMain}>
                <div style={styles.exceptionHeader}>
                  <span style={severityTone(ex.severity)}>
                    {SEVERITY_LABELS[ex.severity]}
                  </span>
                  <span style={styles.exceptionType}>
                    {EXCEPTION_LABELS[ex.type]}
                  </span>
                  <span style={styles.exceptionBooking}>{ex.booking_code}</span>
                </div>
                <div style={styles.exceptionMsg}>{ex.message}</div>
                <div style={styles.exceptionAction}>
                  <strong>Recommended:</strong> {ex.recommended_action}
                </div>
              </div>
              <div style={styles.exceptionSide}>
                <div style={styles.exceptionTime}>
                  {formatDate(ex.created_at)}
                </div>
                {!ex.acknowledged ? (
                  <button
                    style={styles.smallBtnPrimary}
                    onClick={() => handleAcknowledge(ex.id)}
                  >
                    Acknowledge
                  </button>
                ) : (
                  <span style={styles.ackBadge}>Acknowledged</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.footerNote}>
        <strong>Atomic guarantee:</strong> First valid accept wins. Two partners
        cannot hold the same booking.
      </div>

      {selectedRun && (
        <RunDrawer
          run={selectedRun}
          offers={selectedRun.booking_id === 'bk-2' ? STARTER_OFFERS : []}
          eligible={STARTER_ELIGIBLE}
          actionMsg={actionMsg}
          onClose={() => {
            setSelectedRun(null);
            setActionMsg(null);
          }}
          onAction={handleAction}
          onPartnerSelect={onPartnerSelect}
          onBookingSelect={onBookingSelect}
        />
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: 'info' | 'success' | 'danger' | 'warning';
}) {
  const map: Record<string, { bg: string; color: string }> = {
    success: { bg: '#f0fdf4', color: '#166534' },
    danger: { bg: '#fef2f2', color: '#991b1b' },
    warning: { bg: '#fffbeb', color: '#92400e' },
    info: { bg: '#eff6ff', color: '#1d4ed8' },
  };
  const theme = map[tone];
  return (
    <div
      style={{
        ...styles.kpiCard,
        background: theme.bg,
        borderColor: theme.color + '33',
      }}
    >
      <div style={{ ...styles.kpiLabel, color: theme.color }}>{label}</div>
      <div style={{ ...styles.kpiValue, color: theme.color }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: theme.color, opacity: 0.8 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function RunDrawer({
  run,
  offers,
  eligible,
  actionMsg,
  onClose,
  onAction,
  onPartnerSelect,
  onBookingSelect,
}: {
  run: DispatchRun;
  offers: DispatchOffer[];
  eligible: EligiblePartner[];
  actionMsg: string | null;
  onClose: () => void;
  onAction: (
    action: 'RETRY' | 'FORCE_ASSIGN' | 'CANCEL_RUN' | 'EXTEND_OFFER'
  ) => void;
  onPartnerSelect?: (id: string) => void;
  onBookingSelect?: (id: string) => void;
}) {
  const eligibleOnly = eligible.filter((e) => e.eligible);
  const notEligible = eligible.filter((e) => !e.eligible);

  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{run.booking_code}</div>
            <div style={styles.drawerSub}>
              {run.customer_name} · {run.service_name}
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.drawerBody}>
          {actionMsg && <div style={styles.infoBanner}>{actionMsg}</div>}

          <div style={styles.detailGrid}>
            <DetailItem label="Stage" value={STAGE_LABELS[run.stage]} />
            <DetailItem label="City" value={run.city_name} />
            <DetailItem label="Sector" value={run.sector_name ?? '—'} />
            <DetailItem label="Offers Sent" value={String(run.offers_sent)} />
            <DetailItem label="Pending" value={String(run.offers_pending)} />
            <DetailItem label="Accepted" value={String(run.offers_accepted)} />
            <DetailItem
              label="Reassignments"
              value={String(run.reassignment_count)}
            />
            <DetailItem
              label="Duration"
              value={formatDuration(run.duration_sec)}
            />
            <DetailItem label="Started" value={formatDate(run.started_at)} />
            {run.winner_partner_name && (
              <DetailItem
                label="Winner"
                value={`${run.winner_partner_name} (${
                  run.winner_partner_code ?? ''
                })`}
              />
            )}
            {run.atomicity_ref && (
              <DetailItem label="Atomicity Ref" value={run.atomicity_ref} />
            )}
          </div>

          {run.exception && (
            <div style={styles.warningBox}>
              <strong>Exception:</strong> {run.exception}
            </div>
          )}

          {run.atomic_accept_confirmed && (
            <div style={styles.successBox}>
              <strong>✓ Atomic first-accept confirmed.</strong>
            </div>
          )}

          <div style={styles.sectionTitle}>Offers ({offers.length})</div>
          {offers.length === 0 ? (
            <div style={styles.drawerState}>No offers recorded yet.</div>
          ) : (
            <div style={styles.offerList}>
              {offers.map((o) => (
                <div key={o.id} style={styles.offerRow}>
                  <div style={styles.offerHeader}>
                    <div>
                      <button
                        style={styles.linkBtn}
                        onClick={() => onPartnerSelect?.(o.partner_id)}
                        disabled={!onPartnerSelect}
                      >
                        {o.partner_name}
                      </button>
                      <span style={styles.offerCode}>{o.partner_code}</span>
                    </div>
                    <span style={outcomeTone(o.outcome)}>
                      {OUTCOME_LABELS[o.outcome]}
                    </span>
                  </div>
                  <div style={styles.offerMeta}>
                    <span>
                      Score: <strong>{o.score.toFixed(1)}</strong>
                    </span>
                    <span>{o.distance_km.toFixed(1)} km</span>
                    <span>ETA {o.eta_min} min</span>
                    {o.outcome === 'PENDING' && (
                      <span style={{ color: '#92400e', fontWeight: 700 }}>
                        ⏱ {formatCountdown(o.expires_at)}
                      </span>
                    )}
                  </div>
                  <div style={styles.scoreBars}>
                    {o.score_components.map((c) => (
                      <div key={c.label} style={styles.scoreBar}>
                        <div style={styles.scoreBarLabel}>{c.label}</div>
                        <div style={styles.scoreBarTrack}>
                          <div
                            style={{
                              ...styles.scoreBarFill,
                              width: `${Math.round(c.value * 100)}%`,
                            }}
                          />
                        </div>
                        <div style={styles.scoreBarPct}>
                          {c.raw ?? `${Math.round(c.value * 100)}%`}
                        </div>
                      </div>
                    ))}
                  </div>
                  {o.decline_reason && (
                    <div style={styles.declineReason}>
                      <strong>Declined:</strong> {o.decline_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={styles.sectionTitle}>
            Eligible Partners ({eligibleOnly.length})
          </div>
          {eligibleOnly.length === 0 ? (
            <div style={styles.drawerState}>No eligible partners.</div>
          ) : (
            <div style={styles.eligibleList}>
              {eligibleOnly.map((e) => (
                <div key={e.partner_id} style={styles.eligibleRow}>
                  <div>
                    <button
                      style={styles.linkBtn}
                      onClick={() => onPartnerSelect?.(e.partner_id)}
                      disabled={!onPartnerSelect}
                    >
                      {e.partner_name}
                    </button>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {e.partner_code} · {e.distance_km.toFixed(1)} km · ETA{' '}
                      {e.eta_min}m
                    </div>
                  </div>
                  <div style={styles.eligibleSide}>
                    <div style={styles.eligibleScore}>
                      {e.score.toFixed(1)}
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>score</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notEligible.length > 0 && (
            <>
              <div style={styles.sectionTitle}>
                Not Eligible ({notEligible.length})
              </div>
              <div style={styles.eligibleList}>
                {notEligible.map((e) => (
                  <div key={e.partner_id} style={styles.notEligibleRow}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {e.partner_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {e.partner_code}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#991b1b' }}>
                      {(e.reasons_if_not_labels ?? e.reasons_if_not).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={styles.drawerActions}>
            {(run.stage === 'EXPIRED' || run.stage === 'FAILED') && (
              <button
                style={styles.primaryBtn}
                onClick={() => onAction('RETRY')}
              >
                Retry Dispatch
              </button>
            )}
            {run.stage === 'AWAITING_ACCEPT' && (
              <>
                <button
                  style={styles.ghostBtn}
                  onClick={() => onAction('EXTEND_OFFER')}
                >
                  Extend Offer 60s
                </button>
                <button
                  style={styles.ghostBtn}
                  onClick={() => onAction('FORCE_ASSIGN')}
                >
                  Force Assign
                </button>
              </>
            )}
            {run.stage !== 'ACCEPTED' && (
              <button
                style={styles.dangerBtn}
                onClick={() => onAction('CANCEL_RUN')}
              >
                Cancel Run
              </button>
            )}
          </div>

          <div style={styles.linkRow}>
            <button
              style={styles.linkBtn}
              onClick={() => onBookingSelect?.(run.booking_id)}
              disabled={!onBookingSelect}
            >
              Open Booking →
            </button>
            {run.winner_partner_id && (
              <button
                style={styles.linkBtn}
                onClick={() => onPartnerSelect?.(run.winner_partner_id!)}
                disabled={!onPartnerSelect}
              >
                Open Winner Partner →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailItem}>
      <div style={styles.detailItemLabel}>{label}</div>
      <div style={styles.detailItemValue}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th style={styles.th}>{children}</th>;
}
function Td({ children }: { children: ReactNode }) {
  return <td style={styles.td}>{children}</td>;
}

const styles: Record<string, CSSProperties> = {
  root: { padding: 4 },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  title: { fontSize: 20, fontWeight: 800, color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  topActions: { display: 'flex', gap: 8, alignItems: 'center' },
  liveIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  liveDot: {
    width: 8,
    height: 8,
    background: '#16a34a',
    borderRadius: '50%',
  },
  refreshBtn: {
    padding: '9px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 800,
    marginTop: 4,
    marginBottom: 2,
    wordBreak: 'break-word',
  },
  infoBanner: {
    padding: '10px 14px',
    background: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 12,
  },
  warningBox: {
    padding: 12,
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 8,
    fontSize: 13,
    color: '#92400e',
    marginBottom: 12,
    lineHeight: 1.6,
  },
  successBox: {
    padding: 12,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    fontSize: 13,
    color: '#166534',
    marginBottom: 12,
    lineHeight: 1.6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 16,
    marginBottom: 10,
  },
  filterBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 220,
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
  },
  tableWrap: {
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    background: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'top',
  },
  stageQueued: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#374151',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  stageBroadcasting: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#ede9fe',
    color: '#5b21b6',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  stageAwaiting: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  stageAccepted: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  stageExpired: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#e5e7eb',
    color: '#374151',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  stageFailed: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  stageReassigning: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  outcomePending: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  outcomeSeen: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  outcomeAccepted: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  outcomeDeclined: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  outcomeExpired: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#e5e7eb',
    color: '#374151',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  outcomeCancelled: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  sevHigh: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  sevMedium: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  sevLow: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  smallBtn: {
    padding: '4px 10px',
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  smallBtnPrimary: {
    padding: '6px 12px',
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
  },
  primaryBtn: {
    padding: '8px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  },
  ghostBtn: {
    padding: '8px 16px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  dangerBtn: {
    padding: '8px 16px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    padding: 0,
    textAlign: 'left',
  },
  exceptionList: { display: 'flex', flexDirection: 'column', gap: 10 },
  exceptionRow: {
    background: '#fff',
    border: '1px solid #fecaca',
    borderRadius: 10,
    padding: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  exceptionRowAck: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
    opacity: 0.75,
  },
  exceptionMain: { flex: 1, minWidth: 240 },
  exceptionHeader: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  exceptionType: {
    fontSize: 11,
    fontWeight: 800,
    color: '#374151',
    textTransform: 'uppercase',
  },
  exceptionBooking: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6b7280',
  },
  exceptionMsg: {
    fontSize: 13,
    color: '#111827',
    marginBottom: 6,
    lineHeight: 1.5,
  },
  exceptionAction: { fontSize: 12, color: '#6b7280' },
  exceptionSide: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  exceptionTime: { fontSize: 11, color: '#6b7280' },
  ackBadge: {
    fontSize: 10,
    fontWeight: 800,
    background: '#dcfce7',
    color: '#166534',
    padding: '3px 8px',
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  state: {
    padding: 40,
    textAlign: 'center',
    border: '1px dashed #d1d5db',
    borderRadius: 10,
    background: '#fff',
    color: '#374151',
    marginTop: 8,
  },
  footerNote: {
    marginTop: 16,
    padding: '10px 14px',
    background: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: 6,
    fontSize: 12,
    color: '#6b7280',
  },
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: 'min(820px, 100%)',
    height: '100%',
    background: '#fff',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  drawerHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  drawerTitle: { fontSize: 16, fontWeight: 700, color: '#111827' },
  drawerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  drawerClose: {
    background: 'transparent',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: '#6b7280',
    padding: 4,
    lineHeight: 1,
  },
  drawerBody: { padding: 20, overflowY: 'auto', flex: 1 },
  drawerState: {
    padding: 20,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 13,
    background: '#f9fafb',
    border: '1px dashed #e5e7eb',
    borderRadius: 8,
  },
  drawerActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 16,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 10,
    marginBottom: 16,
  },
  detailItem: {
    padding: 10,
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
  },
  detailItemLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailItemValue: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
    marginTop: 4,
    wordBreak: 'break-word',
  },
  offerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  offerRow: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  offerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  offerCode: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  offerMeta: {
    display: 'flex',
    gap: 14,
    fontSize: 12,
    color: '#374151',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  scoreBars: { display: 'flex', flexDirection: 'column', gap: 4 },
  scoreBar: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr 70px',
    gap: 8,
    alignItems: 'center',
  },
  scoreBarLabel: { fontSize: 11, color: '#6b7280' },
  scoreBarTrack: {
    height: 5,
    background: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
    borderRadius: 999,
  },
  scoreBarPct: {
    fontSize: 11,
    fontWeight: 700,
    color: '#111827',
    textAlign: 'right',
  },
  declineReason: {
    marginTop: 8,
    fontSize: 12,
    color: '#991b1b',
    padding: 8,
    background: '#fef2f2',
    borderRadius: 6,
  },
  eligibleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  eligibleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 6,
  },
  notEligibleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
  },
  eligibleSide: { textAlign: 'right' },
  eligibleScore: { fontSize: 18, fontWeight: 800, color: '#1d4ed8' },
  linkRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 16,
  },
};

export { DispatchEngineTab };