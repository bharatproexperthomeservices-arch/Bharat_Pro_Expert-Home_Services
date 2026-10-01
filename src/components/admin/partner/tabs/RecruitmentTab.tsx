import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { PartnerRow } from '../../../../types/partner';
import { fetchPartners } from '../../../../services/partnerApi';

/* ============================================================
   RECRUITMENT & REFERRAL TAB — COMPLETE
   - Lead pipeline (NEW → CONTACTED → INTERESTED → DOCS_PENDING → CONVERTED / LOST)
   - Referral tracking (referrer → referee, reward unlock)
   - Source analytics (website, referral, hub, social, walk-in)
   - Recruitment targets (from supply-gap forecast)
   - Two view modes: Leads / Referrals
   - Detail drawers + create-lead wizard
   ============================================================ */

export interface RecruitmentTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

type ViewMode = 'leads' | 'referrals';
type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'DOCS_PENDING'
  | 'CONVERTED'
  | 'LOST';

type LeadSource =
  | 'WEBSITE'
  | 'REFERRAL'
  | 'HUB_STAFF'
  | 'SOCIAL'
  | 'WALK_IN'
  | 'CALL_CENTER';

interface Lead {
  id: string;
  name: string;
  mobile_masked: string;
  city: string;
  hub?: string;
  source: LeadSource;
  status: LeadStatus;
  interest_categories: string[];
  notes?: string;
  assigned_to?: string;
  follow_up_at?: string;
  converted_partner_id?: string;
  lost_reason?: string;
  created_at: string;
  updated_at: string;
}

interface Referral {
  id: string;
  referrer_partner_id: string;
  referrer_name: string;
  referrer_code: string;
  referee_name: string;
  referee_mobile_masked: string;
  referee_partner_id?: string;
  referee_status?: string;
  reward_paise: number;
  reward_status: 'LOCKED' | 'UNLOCKED' | 'PAID' | 'CANCELLED';
  referee_jobs_completed: number;
  required_jobs: number;
  created_at: string;
  unlocked_at?: string;
}

interface RecruitmentTarget {
  hub: string;
  category: string;
  target_count: number;
  current_count: number;
  gap: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

/* -------------------- Labels -------------------- */

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  DOCS_PENDING: 'Docs Pending',
  CONVERTED: 'Converted',
  LOST: 'Lost',
};

const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  HUB_STAFF: 'Hub Staff',
  SOCIAL: 'Social',
  WALK_IN: 'Walk-in',
  CALL_CENTER: 'Call Center',
};

const REWARD_STATUS_LABELS: Record<Referral['reward_status'], string> = {
  LOCKED: 'Locked',
  UNLOCKED: 'Unlocked',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

/* -------------------- Starter seeds -------------------- */

const STARTER_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Ravi Sharma',
    mobile_masked: '98765****1',
    city: 'Gurugram',
    hub: 'Gurugram',
    source: 'WEBSITE',
    status: 'NEW',
    interest_categories: ['Home / Deep Cleaning'],
    assigned_to: 'Hub Recruiter',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'lead-2',
    name: 'Suresh Yadav',
    mobile_masked: '98765****2',
    city: 'Delhi',
    hub: 'Delhi Central',
    source: 'REFERRAL',
    status: 'CONTACTED',
    interest_categories: ['Bathroom Cleaning', 'Kitchen Cleaning'],
    assigned_to: 'Hub Recruiter',
    follow_up_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'lead-3',
    name: 'Mahesh Kumar',
    mobile_masked: '98765****3',
    city: 'Gurugram',
    hub: 'Gurugram',
    source: 'SOCIAL',
    status: 'INTERESTED',
    interest_categories: ['Sofa Cleaning'],
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'lead-4',
    name: 'Deepak Verma',
    mobile_masked: '98765****4',
    city: 'Noida',
    hub: 'Noida',
    source: 'WALK_IN',
    status: 'DOCS_PENDING',
    interest_categories: ['Carpet Cleaning', 'Floor Cleaning'],
    follow_up_at: new Date(Date.now() + 48 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'lead-5',
    name: 'Anil Chauhan',
    mobile_masked: '98765****5',
    city: 'Gurugram',
    hub: 'Gurugram',
    source: 'REFERRAL',
    status: 'CONVERTED',
    interest_categories: ['Home / Deep Cleaning'],
    converted_partner_id: 'p-100',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'lead-6',
    name: 'Rajesh Nair',
    mobile_masked: '98765****6',
    city: 'Delhi',
    hub: 'Delhi Central',
    source: 'CALL_CENTER',
    status: 'LOST',
    interest_categories: ['Kitchen Cleaning'],
    lost_reason: 'Not interested — chose another company',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const STARTER_REFERRALS: Referral[] = [
  {
    id: 'ref-1',
    referrer_partner_id: 'p-1',
    referrer_name: 'Ramesh Kumar',
    referrer_code: 'BPE-PRO-1001',
    referee_name: 'Suresh Yadav',
    referee_mobile_masked: '98765****2',
    referee_partner_id: 'p-101',
    referee_status: 'ACTIVE',
    reward_paise: 100000,
    reward_status: 'PAID',
    referee_jobs_completed: 12,
    required_jobs: 10,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    unlocked_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'ref-2',
    referrer_partner_id: 'p-2',
    referrer_name: 'Suresh Yadav',
    referrer_code: 'BPE-PRO-1002',
    referee_name: 'Mahesh Kumar',
    referee_mobile_masked: '98765****3',
    referee_partner_id: 'p-102',
    referee_status: 'ACTIVE',
    reward_paise: 100000,
    reward_status: 'UNLOCKED',
    referee_jobs_completed: 10,
    required_jobs: 10,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    unlocked_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ref-3',
    referrer_partner_id: 'p-3',
    referrer_name: 'Mohan Lal',
    referrer_code: 'BPE-PRO-1003',
    referee_name: 'Deepak Verma',
    referee_mobile_masked: '98765****4',
    referee_status: 'ONBOARDING',
    reward_paise: 100000,
    reward_status: 'LOCKED',
    referee_jobs_completed: 0,
    required_jobs: 10,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'ref-4',
    referrer_partner_id: 'p-1',
    referrer_name: 'Ramesh Kumar',
    referrer_code: 'BPE-PRO-1001',
    referee_name: 'Anil Chauhan',
    referee_mobile_masked: '98765****5',
    referee_partner_id: 'p-100',
    referee_status: 'ACTIVE',
    reward_paise: 100000,
    reward_status: 'LOCKED',
    referee_jobs_completed: 4,
    required_jobs: 10,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

const STARTER_TARGETS: RecruitmentTarget[] = [
  { hub: 'Gurugram', category: 'Sofa Cleaning', target_count: 15, current_count: 11, gap: 4, priority: 'HIGH' },
  { hub: 'Gurugram', category: 'Carpet Cleaning', target_count: 10, current_count: 8, gap: 2, priority: 'MEDIUM' },
  { hub: 'Delhi Central', category: 'Home / Deep Cleaning', target_count: 20, current_count: 18, gap: 2, priority: 'MEDIUM' },
  { hub: 'Noida', category: 'Single-Disc Machine Cleaning', target_count: 5, current_count: 2, gap: 3, priority: 'HIGH' },
  { hub: 'Delhi Central', category: 'Bathroom Cleaning', target_count: 12, current_count: 12, gap: 0, priority: 'LOW' },
];

/* -------------------- Tone helpers -------------------- */

function leadStatusTone(status: LeadStatus): CSSProperties {
  switch (status) {
    case 'NEW': return styles.statusNew;
    case 'CONTACTED': return styles.statusContacted;
    case 'INTERESTED': return styles.statusInterested;
    case 'DOCS_PENDING': return styles.statusDocsPending;
    case 'CONVERTED': return styles.statusConverted;
    case 'LOST': return styles.statusLost;
    default: return styles.statusNew;
  }
}

function rewardStatusTone(status: Referral['reward_status']): CSSProperties {
  switch (status) {
    case 'PAID': return styles.statusPaid;
    case 'UNLOCKED': return styles.statusUnlocked;
    case 'LOCKED': return styles.statusLocked;
    case 'CANCELLED': return styles.statusCancelled;
    default: return styles.statusLocked;
  }
}

function priorityTone(p: RecruitmentTarget['priority']): CSSProperties {
  switch (p) {
    case 'HIGH': return styles.priHigh;
    case 'MEDIUM': return styles.priMedium;
    case 'LOW': return styles.priLow;
    default: return styles.priLow;
  }
}

/* -------------------- Utils -------------------- */

function formatPaise(paise?: number | null): string {
  if (paise == null) return '—';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(rupees);
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function RecruitmentTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: RecruitmentTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>('leads');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showCreateLead, setShowCreateLead] = useState(false);

  const apiOpts = useMemo(
    () => ({ baseUrl: apiBase, authToken }),
    [apiBase, authToken]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPartners({ limit: 200 }, apiOpts);
      const items = Array.isArray(res) ? res : res.items ?? [];
      setPartners(items);
      setNotConfigured(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg === 'Not configured') {
        setNotConfigured('Recruitment API not configured yet.');
        setPartners([]);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [apiOpts]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- Summary -------------------- */

  const summary = useMemo(() => {
    const totalLeads = STARTER_LEADS.length;
    const newLeads = STARTER_LEADS.filter((l) => l.status === 'NEW').length;
    const contacted = STARTER_LEADS.filter((l) => l.status === 'CONTACTED').length;
    const converted = STARTER_LEADS.filter((l) => l.status === 'CONVERTED').length;
    const lost = STARTER_LEADS.filter((l) => l.status === 'LOST').length;
    const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

    const referrals = STARTER_REFERRALS.length;
    const unlockedReferrals = STARTER_REFERRALS.filter((r) => r.reward_status === 'UNLOCKED' || r.reward_status === 'PAID').length;
    const pendingRewardPaise = STARTER_REFERRALS
      .filter((r) => r.reward_status === 'UNLOCKED')
      .reduce((s, r) => s + r.reward_paise, 0);

    const totalGap = STARTER_TARGETS.reduce((s, t) => s + t.gap, 0);

    return {
      totalLeads, newLeads, contacted, converted, lost, conversionRate,
      referrals, unlockedReferrals, pendingRewardPaise, totalGap,
    };
  }, []);

  /* -------------------- Filtered leads -------------------- */

  const filteredLeads = useMemo(() => {
    let list = [...STARTER_LEADS];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          (l.hub ?? '').toLowerCase().includes(q) ||
          l.mobile_masked.includes(q)
      );
    }

    if (statusFilter !== 'ALL') list = list.filter((l) => l.status === statusFilter);
    if (sourceFilter !== 'ALL') list = list.filter((l) => l.source === sourceFilter);

    list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    return list;
  }, [search, statusFilter, sourceFilter]);

  /* -------------------- Filtered referrals -------------------- */

  const filteredReferrals = useMemo(() => {
    let list = [...STARTER_REFERRALS];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.referrer_name.toLowerCase().includes(q) ||
          r.referrer_code.toLowerCase().includes(q) ||
          r.referee_name.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [search]);

  /* -------------------- Lead pipeline counts -------------------- */

  const leadPipeline = useMemo(() => {
    const s = { NEW: 0, CONTACTED: 0, INTERESTED: 0, DOCS_PENDING: 0, CONVERTED: 0, LOST: 0 };
    STARTER_LEADS.forEach((l) => { s[l.status]++; });
    return s;
  }, []);

  /* -------------------- Render states -------------------- */

  if (loading) {
    return <div style={styles.state}>Loading recruitment & referral…</div>;
  }

  if (notConfigured) {
    return (
      <div style={styles.state}>
        <strong>Not configured:</strong> {notConfigured}
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 12 }}>
          Connect the recruitment API to see live leads.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.stateError}>
        <span>Error: {error}</span>
        <button style={styles.retryBtn} onClick={load}>Retry</button>
      </div>
    );
  }

  /* -------------------- Render -------------------- */

  return (
    <div style={styles.root}>
      {/* Summary cards */}
      <div style={styles.summaryRow}>
        <SummaryCard label="Total Leads" value={String(summary.totalLeads)} sub="in pipeline" tone="info" />
        <SummaryCard label="New" value={String(summary.newLeads)} sub="first contact pending" tone="warning" />
        <SummaryCard label="Converted" value={String(summary.converted)} sub={`${summary.conversionRate}% rate`} tone="success" />
        <SummaryCard label="Lost" value={String(summary.lost)} sub="closed" tone="danger" />
        <SummaryCard label="Referrals" value={String(summary.referrals)} sub={`${summary.unlockedReferrals} unlocked`} tone="info" />
        <SummaryCard label="Pending Rewards" value={formatPaise(summary.pendingRewardPaise)} sub="unlocked not paid" tone="warning" />
        <SummaryCard label="Supply Gap" value={String(summary.totalGap)} sub="targets not met" tone="danger" />
      </div>

      {/* View toggle */}
      <div style={styles.viewBar}>
        <button
          style={view === 'leads' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => { setView('leads'); setStatusFilter('ALL'); setSourceFilter('ALL'); }}
        >
          Leads Pipeline
        </button>
        <button
          style={view === 'referrals' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => { setView('referrals'); setStatusFilter('ALL'); setSourceFilter('ALL'); }}
        >
          Referrals
        </button>
        <button style={styles.createBtn} onClick={() => setShowCreateLead(true)}>
          + Add Lead
        </button>
        <button style={styles.refreshBtn} onClick={load} disabled={loading}>Refresh</button>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder={view === 'leads' ? 'Search name, mobile, city, hub…' : 'Search referrer, code, referee…'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {view === 'leads' && (
          <>
            <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="INTERESTED">Interested</option>
              <option value="DOCS_PENDING">Docs Pending</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
            </select>
            <select style={styles.select} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="ALL">All Sources</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="HUB_STAFF">Hub Staff</option>
              <option value="SOCIAL">Social</option>
              <option value="WALK_IN">Walk-in</option>
              <option value="CALL_CENTER">Call Center</option>
            </select>
          </>
        )}
      </div>

      {/* Leads view */}
      {view === 'leads' && (
        <>
          {/* Pipeline visualization */}
          <div style={styles.pipelineBar}>
            {(['NEW', 'CONTACTED', 'INTERESTED', 'DOCS_PENDING', 'CONVERTED', 'LOST'] as LeadStatus[]).map((s) => (
              <div key={s} style={styles.pipelineStage}>
                <div style={styles.pipelineLabel}>{LEAD_STATUS_LABELS[s]}</div>
                <div style={styles.pipelineCount}>{leadPipeline[s]}</div>
              </div>
            ))}
          </div>

          {filteredLeads.length === 0 ? (
            <div style={styles.state}>
              <h3 style={{ margin: 0 }}>No leads match</h3>
              <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Try changing filters or search.</p>
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <Th>Lead</Th>
                    <Th>City / Hub</Th>
                    <Th>Source</Th>
                    <Th>Interest</Th>
                    <Th>Status</Th>
                    <Th>Assigned</Th>
                    <Th>Updated</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l) => (
                    <tr key={l.id}>
                      <Td>
                        <div style={{ fontWeight: 700 }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{l.mobile_masked}</div>
                      </Td>
                      <Td>
                        <div>{l.city}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{l.hub ?? '—'}</div>
                      </Td>
                      <Td>
                        <span style={styles.sourceChip}>{LEAD_SOURCE_LABELS[l.source]}</span>
                      </Td>
                      <Td>
                        <div style={{ fontSize: 12 }}>
                          {l.interest_categories.slice(0, 2).join(', ')}
                          {l.interest_categories.length > 2 ? ` +${l.interest_categories.length - 2}` : ''}
                        </div>
                      </Td>
                      <Td><span style={leadStatusTone(l.status)}>{LEAD_STATUS_LABELS[l.status]}</span></Td>
                      <Td>{l.assigned_to ?? '—'}</Td>
                      <Td>{formatDate(l.updated_at)}</Td>
                      <Td>
                        <button style={styles.smallBtn} onClick={() => setSelectedLead(l)}>View</button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Supply gap targets */}
          <div style={styles.sectionTitle}>Recruitment Targets (from Supply Gap)</div>
          <div style={styles.targetGrid}>
            {STARTER_TARGETS.map((t) => (
              <div key={`${t.hub}-${t.category}`} style={styles.targetCard}>
                <div style={styles.targetHeader}>
                  <div style={styles.targetTitle}>{t.category}</div>
                  <span style={priorityTone(t.priority)}>{t.priority}</span>
                </div>
                <div style={styles.targetHub}>{t.hub}</div>
                <div style={styles.targetStats}>
                  <div>
                    <div style={styles.targetStatLabel}>Target</div>
                    <div style={styles.targetStatValue}>{t.target_count}</div>
                  </div>
                  <div>
                    <div style={styles.targetStatLabel}>Current</div>
                    <div style={{ ...styles.targetStatValue, color: '#166534' }}>{t.current_count}</div>
                  </div>
                  <div>
                    <div style={styles.targetStatLabel}>Gap</div>
                    <div style={{ ...styles.targetStatValue, color: t.gap > 0 ? '#991b1b' : '#166534' }}>{t.gap}</div>
                  </div>
                </div>
                <div style={styles.targetBar}>
                  <div style={{
                    ...styles.targetBarFill,
                    width: `${Math.round((t.current_count / t.target_count) * 100)}%`,
                    background: t.gap === 0 ? '#16a34a' : t.gap <= 2 ? '#f59e0b' : '#dc2626',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Referrals view */}
      {view === 'referrals' && (
        <>
          {filteredReferrals.length === 0 ? (
            <div style={styles.state}>
              <h3 style={{ margin: 0 }}>No referrals match</h3>
              <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Try changing search.</p>
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <Th>Referrer</Th>
                    <Th>Referee</Th>
                    <Th>Referee Status</Th>
                    <Th>Jobs Progress</Th>
                    <Th>Reward</Th>
                    <Th>Reward Status</Th>
                    <Th>Created</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReferrals.map((r) => (
                    <tr key={r.id}>
                      <Td>
                        <div style={{ fontWeight: 700 }}>{r.referrer_name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{r.referrer_code}</div>
                      </Td>
                      <Td>
                        <div>{r.referee_name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{r.referee_mobile_masked}</div>
                      </Td>
                      <Td>{r.referee_status ?? '—'}</Td>
                      <Td>
                        <div style={styles.progressOuter}>
                          <div style={{
                            ...styles.progressInner,
                            width: `${Math.min(100, Math.round((r.referee_jobs_completed / r.required_jobs) * 100))}%`,
                            background: r.referee_jobs_completed >= r.required_jobs ? '#16a34a' : '#f59e0b',
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                          {r.referee_jobs_completed} / {r.required_jobs} jobs
                        </div>
                      </Td>
                      <Td><strong>{formatPaise(r.reward_paise)}</strong></Td>
                      <Td><span style={rewardStatusTone(r.reward_status)}>{REWARD_STATUS_LABELS[r.reward_status]}</span></Td>
                      <Td>{formatDate(r.created_at)}</Td>
                      <Td>
                        <button style={styles.smallBtn} onClick={() => setSelectedReferral(r)}>View</button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Footer note */}
      <div style={styles.footerNote}>
        <strong>Referral policy:</strong> Reward released only after the referee
        is ACTIVE and completes N jobs. Duplicate / self-referral fraud checks
        apply. Leads are deduplicated against existing partners using HMAC keys.
      </div>

      {/* Drawers */}
      {selectedLead && <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      {selectedReferral && (
        <ReferralDrawer
          referral={selectedReferral}
          onClose={() => setSelectedReferral(null)}
          onPartnerSelect={onPartnerSelect}
        />
      )}
      {showCreateLead && <CreateLeadWizard onClose={() => setShowCreateLead(false)} />}
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function SummaryCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: 'info' | 'success' | 'danger' | 'warning'; }) {
  const map: Record<string, { bg: string; color: string }> = {
    success: { bg: '#f0fdf4', color: '#166534' },
    danger: { bg: '#fef2f2', color: '#991b1b' },
    warning: { bg: '#fffbeb', color: '#92400e' },
    info: { bg: '#eff6ff', color: '#1d4ed8' },
  };
  const theme = map[tone];
  return (
    <div style={{ ...styles.summaryCard, background: theme.bg, borderColor: theme.color + '33' }}>
      <div style={{ ...styles.summaryLabel, color: theme.color }}>{label}</div>
      <div style={{ ...styles.summaryValue, color: theme.color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.color, opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}

function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{lead.name}</div>
            <div style={styles.drawerSub}>{lead.mobile_masked} · {lead.city}</div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.detailGrid}>
            <DetailItem label="Status" value={LEAD_STATUS_LABELS[lead.status]} />
            <DetailItem label="Source" value={LEAD_SOURCE_LABELS[lead.source]} />
            <DetailItem label="Hub" value={lead.hub ?? '—'} />
            <DetailItem label="Assigned To" value={lead.assigned_to ?? '—'} />
            <DetailItem label="Follow-up" value={formatDate(lead.follow_up_at)} />
            <DetailItem label="Created" value={formatDate(lead.created_at)} />
            <DetailItem label="Updated" value={formatDate(lead.updated_at)} />
            {lead.converted_partner_id && (
              <DetailItem label="Converted Partner ID" value={lead.converted_partner_id} />
            )}
            {lead.lost_reason && (
              <DetailItem label="Lost Reason" value={lead.lost_reason} />
            )}
          </div>

          <div style={styles.descriptionBox}>
            <div style={styles.descriptionLabel}>Interest Categories</div>
            <div>{lead.interest_categories.map((c) => <span key={c} style={styles.varChip}>{c}</span>)}</div>
          </div>

          {lead.notes && (
            <div style={styles.descriptionBox}>
              <div style={styles.descriptionLabel}>Notes</div>
              <div>{lead.notes}</div>
            </div>
          )}

          <div style={styles.infoBox}>
            <strong>Lead pipeline:</strong> NEW → CONTACTED → INTERESTED →
            DOCS_PENDING → CONVERTED (creates partner in REGISTERED). LOST needs
            a reason code. First-contact SLA applies.
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferralDrawer({ referral, onClose, onPartnerSelect }: { referral: Referral; onClose: () => void; onPartnerSelect?: (id: string) => void; }) {
  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>Referral</div>
            <div style={styles.drawerSub}>
              {referral.referrer_name} → {referral.referee_name}
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.detailGrid}>
            <DetailItem label="Referrer" value={referral.referrer_name} />
            <DetailItem label="Referrer Code" value={referral.referrer_code} />
            <DetailItem label="Referee" value={referral.referee_name} />
            <DetailItem label="Referee Status" value={referral.referee_status ?? '—'} />
            <DetailItem label="Reward" value={formatPaise(referral.reward_paise)} />
            <DetailItem label="Reward Status" value={REWARD_STATUS_LABELS[referral.reward_status]} />
            <DetailItem label="Jobs" value={`${referral.referee_jobs_completed} / ${referral.required_jobs}`} />
            <DetailItem label="Created" value={formatDate(referral.created_at)} />
            {referral.unlocked_at && (
              <DetailItem label="Unlocked At" value={formatDate(referral.unlocked_at)} />
            )}
          </div>

          <div style={styles.infoBox}>
            <strong>Reward unlock rule:</strong> Reward is unlocked only after
            the referee is ACTIVE and completes N jobs. Duplicate / self-referral
            fraud checks apply.
          </div>

          <div style={styles.drawerActions}>
            <button
              style={styles.primaryBtn}
              onClick={() => onPartnerSelect?.(referral.referrer_partner_id)}
              disabled={!onPartnerSelect}
            >
              Open Referrer 360°
            </button>
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

/* ============================================================
   CreateLeadWizard
   ============================================================ */

function CreateLeadWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [hub, setHub] = useState('');
  const [source, setSource] = useState<LeadSource>('WEBSITE');
  const [categories, setCategories] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const allCategories = [
    'Home / Deep Cleaning', 'Bathroom Cleaning', 'Kitchen Cleaning',
    'Sofa Cleaning', 'Carpet Cleaning', 'Floor Cleaning',
    'Single-Disc Machine Cleaning', 'Shampoo / Extraction Cleaning',
    'Chimney Cleaning', 'Mattress Cleaning', 'Water Tank Cleaning', 'Pest Control',
  ];

  const toggleCategory = (c: string) => {
    setCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const isMobileValid = /^[6-9]\d{9}$/.test(mobile);

  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={{ ...styles.drawer, width: 'min(620px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>Add Lead</div>
            <div style={styles.drawerSub}>Capture a new recruitment lead</div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.stepRow}>
            <span style={step >= 1 ? styles.stepActive : styles.step}>1. Basic</span>
            <span style={step >= 2 ? styles.stepActive : styles.step}>2. Source</span>
            <span style={step >= 3 ? styles.stepActive : styles.step}>3. Interest</span>
            <span style={step >= 4 ? styles.stepActive : styles.step}>4. Confirm</span>
          </div>

          {step === 1 && (
            <div>
              <div style={styles.fieldLabel}>Name</div>
              <input style={styles.textInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              <div style={styles.fieldLabel}>Mobile (10 digits, starts 6-9)</div>
              <input style={styles.textInput} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" />
              {mobile && !isMobileValid && <div style={styles.errorHint}>Invalid mobile format.</div>}
              <div style={styles.fieldLabel}>City</div>
              <input style={styles.textInput} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Gurugram" />
              <div style={styles.fieldLabel}>Hub (optional)</div>
              <input style={styles.textInput} value={hub} onChange={(e) => setHub(e.target.value)} placeholder="e.g., Gurugram" />
              <div style={styles.wizardActions}>
                <button style={styles.primaryBtn} disabled={!name.trim() || !isMobileValid || !city.trim()} onClick={() => setStep(2)}>Next: Source</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={styles.fieldLabel}>Source</div>
              <div style={styles.levelPickRow}>
                {(['WEBSITE', 'REFERRAL', 'HUB_STAFF', 'SOCIAL', 'WALK_IN', 'CALL_CENTER'] as LeadSource[]).map((s) => (
                  <button key={s} style={source === s ? styles.levelPickActive : styles.levelPick} onClick={() => setSource(s)}>
                    {LEAD_SOURCE_LABELS[s]}
                  </button>
                ))}
              </div>
              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(1)}>Back</button>
                <button style={styles.primaryBtn} onClick={() => setStep(3)}>Next: Interest</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={styles.fieldLabel}>Interest Categories</div>
              <div style={styles.categoryPickGrid}>
                {allCategories.map((c) => (
                  <button key={c} style={categories.includes(c) ? styles.categoryPickActive : styles.categoryPick} onClick={() => toggleCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <div style={styles.fieldLabel}>Notes (optional)</div>
              <textarea style={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any additional details…" />
              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(2)}>Back</button>
                <button style={styles.primaryBtn} disabled={categories.length === 0} onClick={() => setStep(4)}>Next: Confirm</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={styles.confirmBox}>
                <div><strong>Name:</strong> {name}</div>
                <div style={{ marginTop: 4 }}><strong>Mobile:</strong> {mobile}</div>
                <div style={{ marginTop: 4 }}><strong>City:</strong> {city}{hub ? ` · ${hub}` : ''}</div>
                <div style={{ marginTop: 4 }}><strong>Source:</strong> {LEAD_SOURCE_LABELS[source]}</div>
                <div style={{ marginTop: 4 }}><strong>Interest:</strong> {categories.join(', ')}</div>
                {notes && <div style={{ marginTop: 4 }}><strong>Notes:</strong> {notes}</div>}
              </div>

              <div style={styles.infoBox}>
                <strong>Dedupe:</strong> System will check against existing leads
                and partners using HMAC keys. Duplicate mobile will be blocked.
              </div>

              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(3)}>Back</button>
                <button style={styles.primaryBtn} disabled title="Save API not wired yet" onClick={onClose}>Submit (API not configured)</button>
              </div>
            </div>
          )}
        </div>

        <div style={styles.drawerFooter}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            Lead creation requires backend wiring. Auto-assign happens by pin code.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Table helpers
   ============================================================ */

function Th({ children }: { children: ReactNode }) { return <th style={styles.th}>{children}</th>; }
function Td({ children }: { children: ReactNode }) { return <td style={styles.td}>{children}</td>; }

/* ============================================================
   Styles
   ============================================================ */

const styles: Record<string, CSSProperties> = {
  root: { padding: 4 },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 16 },
  summaryCard: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 },
  summaryLabel: { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 },
  summaryValue: { fontSize: 20, fontWeight: 800, marginTop: 4, marginBottom: 2, wordBreak: 'break-word' },
  viewBar: { display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' },
  viewBtn: { padding: '8px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 },
  viewBtnActive: { padding: '8px 14px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#1d4ed8', fontWeight: 700 },
  createBtn: { padding: '8px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  refreshBtn: { marginLeft: 'auto', padding: '8px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  filterBar: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none' },
  select: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff' },
  textInput: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, marginBottom: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' },
  errorHint: { fontSize: 11, color: '#991b1b', marginBottom: 10, fontWeight: 700 },
  pipelineBar: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 14, padding: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 },
  pipelineStage: { textAlign: 'center', padding: 6, background: '#f9fafb', borderRadius: 6 },
  pipelineLabel: { fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  pipelineCount: { fontSize: 20, fontWeight: 800, color: '#111827', marginTop: 2 },
  sourceChip: { fontSize: 10, fontWeight: 800, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 13, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 20, marginBottom: 10 },
  targetGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 16 },
  targetCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 },
  targetHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  targetTitle: { fontSize: 13, fontWeight: 800, color: '#111827', flex: 1 },
  targetHub: { fontSize: 11, color: '#6b7280', marginBottom: 10 },
  targetStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 },
  targetStatLabel: { fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  targetStatValue: { fontSize: 16, fontWeight: 800, color: '#111827', marginTop: 2 },
  targetBar: { height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' },
  targetBarFill: { height: '100%', transition: 'width .3s' },
  tableWrap: { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: '#6b7280', whiteSpace: 'nowrap' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' },
  smallBtn: { padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  primaryBtn: { padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  ghostBtn: { padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  statusNew: { display: 'inline-block', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusContacted: { display: 'inline-block', padding: '2px 8px', background: '#ede9fe', color: '#5b21b6', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusInterested: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusDocsPending: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusConverted: { display: 'inline-block', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusLost: { display: 'inline-block', padding: '2px 8px', background: '#e5e7eb', color: '#374151', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusPaid: { display: 'inline-block', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusUnlocked: { display: 'inline-block', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusLocked: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusCancelled: { display: 'inline-block', padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  priHigh: { display: 'inline-block', padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  priMedium: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  priLow: { display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  progressOuter: { width: '100%', height: 5, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' },
  progressInner: { height: '100%', transition: 'width .3s' },
  state: { padding: 40, textAlign: 'center', border: '1px dashed #d1d5db', borderRadius: 10, background: '#fff', color: '#374151' },
  stateError: { padding: 20, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  retryBtn: { padding: '6px 12px', background: '#991b1b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  footerNote: { marginTop: 16, padding: '10px 14px', background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 6, fontSize: 12, color: '#6b7280' },
  drawerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' },
  drawer: { width: 'min(700px, 100%)', height: '100%', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  drawerHeader: { padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  drawerTitle: { fontSize: 16, fontWeight: 700, color: '#111827' },
  drawerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  drawerClose: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', padding: 4, lineHeight: 1 },
  drawerBody: { padding: 20, overflowY: 'auto', flex: 1 },
  drawerFooter: { padding: '10px 20px', borderTop: '1px solid #e5e7eb', background: '#fff' },
  drawerActions: { marginTop: 16, display: 'flex', gap: 8 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 },
  detailItem: { padding: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 },
  detailItemLabel: { fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  detailItemValue: { fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 4, wordBreak: 'break-word' },
  descriptionBox: { padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, fontSize: 13, lineHeight: 1.6 },
  descriptionLabel: { fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  infoBox: { padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#1e40af', marginBottom: 16, lineHeight: 1.6 },
  varChip: { display: 'inline-block', padding: '2px 8px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 4, fontSize: 11, fontWeight: 700, marginRight: 6, marginBottom: 4 },
  stepRow: { display: 'flex', gap: 10, marginBottom: 18, fontSize: 11, flexWrap: 'wrap' },
  step: { color: '#9ca3af', fontWeight: 600 },
  stepActive: { color: '#1d4ed8', fontWeight: 800 },
  fieldLabel: { fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  levelPickRow: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  levelPick: { padding: '8px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' },
  levelPickActive: { padding: '8px 14px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#1d4ed8' },
  categoryPickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 14 },
  categoryPick: { padding: '10px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 12, textAlign: 'left', fontWeight: 600, color: '#374151' },
  categoryPickActive: { padding: '10px 12px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, cursor: 'pointer', fontSize: 12, textAlign: 'left', fontWeight: 700, color: '#1d4ed8' },
  confirmBox: { padding: 14, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.7 },
  wizardActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
};