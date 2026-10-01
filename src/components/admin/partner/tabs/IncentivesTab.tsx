import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { PartnerRow } from '../../../../types/partner';
import { fetchPartners } from '../../../../services/partnerApi';

/* ============================================================
   INCENTIVES & PENALTIES TAB — COMPLETE
   - Incentive rules engine (configurable conditions)
   - Awarded incentives tracking
   - Penalties (proposed → approved → applied)
   - Maker-checker discipline
   - Two view modes: Incentives / Penalties
   - Detail drawer
   - Create-rule wizard
   ============================================================ */

export interface IncentivesTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

type ViewMode = 'incentives' | 'penalties';
type SortKey = 'name' | 'code' | 'amount' | 'date';

type IncentiveStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'EXPIRED'
  | 'BUDGET_CAPPED';

type AwardStatus =
  | 'ELIGIBLE'
  | 'AWARDED'
  | 'PAID'
  | 'CANCELLED';

type PenaltyStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'APPLIED'
  | 'DISPUTED'
  | 'REVERSED';

interface IncentiveRule {
  id: string;
  name: string;
  description: string;
  condition_type:
    | 'JOBS_PER_WEEK'
    | 'PEAK_SLOT'
    | 'RATING_ABOVE'
    | 'HUB_TARGET'
    | 'CATEGORY_TARGET';
  condition_value: string;
  reward_type: 'FIXED' | 'PER_JOB' | 'PERCENT';
  reward_amount_paise: number;
  budget_cap_paise: number;
  spent_paise: number;
  validity_from: string;
  validity_to: string;
  status: IncentiveStatus;
  hub?: string;
  category?: string;
}

interface IncentiveAward {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  rule_id: string;
  rule_name: string;
  amount_paise: number;
  status: AwardStatus;
  awarded_at: string;
  paid_at?: string;
}

interface PenaltyRecord {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  case_id?: string;
  reason_code: string;
  reason_label: string;
  amount_paise: number;
  status: PenaltyStatus;
  proposed_by: string;
  proposed_at: string;
  approved_by?: string;
  approved_at?: string;
  evidence?: string;
}

/* -------------------- Labels -------------------- */

const INCENTIVE_STATUS_LABELS: Record<IncentiveStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  EXPIRED: 'Expired',
  BUDGET_CAPPED: 'Budget Capped',
};

const AWARD_STATUS_LABELS: Record<AwardStatus, string> = {
  ELIGIBLE: 'Eligible',
  AWARDED: 'Awarded',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

const PENALTY_STATUS_LABELS: Record<PenaltyStatus, string> = {
  PROPOSED: 'Proposed',
  APPROVED: 'Approved',
  APPLIED: 'Applied',
  DISPUTED: 'Disputed',
  REVERSED: 'Reversed',
};

const RULE_TYPE_LABELS: Record<IncentiveRule['condition_type'], string> = {
  JOBS_PER_WEEK: 'Jobs / Week',
  PEAK_SLOT: 'Peak Slot',
  RATING_ABOVE: 'Rating Above',
  HUB_TARGET: 'Hub Target',
  CATEGORY_TARGET: 'Category Target',
};

/* -------------------- Starter seeds -------------------- */

const STARTER_RULES: IncentiveRule[] = [
  {
    id: 'rule-1',
    name: 'Weekend Warrior',
    description: 'Complete 10+ jobs in a week (Mon–Sun)',
    condition_type: 'JOBS_PER_WEEK',
    condition_value: '10',
    reward_type: 'FIXED',
    reward_amount_paise: 50000,
    budget_cap_paise: 500000,
    spent_paise: 125000,
    validity_from: '2026-01-01',
    validity_to: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    id: 'rule-2',
    name: 'Peak Hour Hero',
    description: 'Accept 5+ jobs in peak slot (6–10 PM)',
    condition_type: 'PEAK_SLOT',
    condition_value: '5',
    reward_type: 'PER_JOB',
    reward_amount_paise: 5000,
    budget_cap_paise: 200000,
    spent_paise: 68000,
    validity_from: '2026-01-01',
    validity_to: '2026-06-30',
    status: 'ACTIVE',
  },
  {
    id: 'rule-3',
    name: 'Top Rated',
    description: 'Maintain 4.7+ rating with 20+ ratings',
    condition_type: 'RATING_ABOVE',
    condition_value: '4.7',
    reward_type: 'FIXED',
    reward_amount_paise: 100000,
    budget_cap_paise: 300000,
    spent_paise: 300000,
    validity_from: '2026-01-01',
    validity_to: '2026-12-31',
    status: 'BUDGET_CAPPED',
  },
  {
    id: 'rule-4',
    name: 'Sofa Specialist Drive',
    description: 'Complete 15 Sofa Cleaning jobs in the month',
    condition_type: 'CATEGORY_TARGET',
    condition_value: '15',
    reward_type: 'FIXED',
    reward_amount_paise: 75000,
    budget_cap_paise: 200000,
    spent_paise: 0,
    validity_from: '2026-03-01',
    validity_to: '2026-04-30',
    status: 'DRAFT',
    category: 'Sofa Cleaning',
  },
];

const STARTER_AWARDS: IncentiveAward[] = [
  {
    id: 'aw-1',
    partner_id: 'p-1',
    partner_name: 'Ramesh Kumar',
    partner_code: 'BPE-PRO-1001',
    rule_id: 'rule-1',
    rule_name: 'Weekend Warrior',
    amount_paise: 50000,
    status: 'AWARDED',
    awarded_at: '2026-09-22T10:15:00Z',
  },
  {
    id: 'aw-2',
    partner_id: 'p-2',
    partner_name: 'Suresh Yadav',
    partner_code: 'BPE-PRO-1002',
    rule_id: 'rule-2',
    rule_name: 'Peak Hour Hero',
    amount_paise: 25000,
    status: 'PAID',
    awarded_at: '2026-09-20T09:00:00Z',
    paid_at: '2026-09-25T14:00:00Z',
  },
  {
    id: 'aw-3',
    partner_id: 'p-3',
    partner_name: 'Mohan Lal',
    partner_code: 'BPE-PRO-1003',
    rule_id: 'rule-1',
    rule_name: 'Weekend Warrior',
    amount_paise: 50000,
    status: 'ELIGIBLE',
    awarded_at: '2026-09-23T11:30:00Z',
  },
];

const STARTER_PENALTIES: PenaltyRecord[] = [
  {
    id: 'pen-1',
    partner_id: 'p-4',
    partner_name: 'Ajay Singh',
    partner_code: 'BPE-PRO-1004',
    case_id: 'case-1001',
    reason_code: 'LATE_ARRIVAL',
    reason_label: 'Late arrival (30+ min)',
    amount_paise: 20000,
    status: 'PROPOSED',
    proposed_by: 'Fleet Manager',
    proposed_at: '2026-09-24T15:00:00Z',
  },
  {
    id: 'pen-2',
    partner_id: 'p-5',
    partner_name: 'Vijay Sharma',
    partner_code: 'BPE-PRO-1005',
    case_id: 'case-1002',
    reason_code: 'CUSTOMER_COMPLAINT',
    reason_label: 'Substantiated complaint',
    amount_paise: 50000,
    status: 'APPROVED',
    proposed_by: 'Quality Officer',
    proposed_at: '2026-09-23T13:20:00Z',
    approved_by: 'Operations Director',
    approved_at: '2026-09-24T09:10:00Z',
  },
  {
    id: 'pen-3',
    partner_id: 'p-6',
    partner_name: 'Kiran Patel',
    partner_code: 'BPE-PRO-1006',
    case_id: 'case-1003',
    reason_code: 'NO_SHOW',
    reason_label: 'No-show without notice',
    amount_paise: 100000,
    status: 'APPLIED',
    proposed_by: 'Live Dispatch',
    proposed_at: '2026-09-19T08:40:00Z',
    approved_by: 'Operations Director',
    approved_at: '2026-09-19T11:00:00Z',
  },
  {
    id: 'pen-4',
    partner_id: 'p-7',
    partner_name: 'Naresh Verma',
    partner_code: 'BPE-PRO-1007',
    case_id: 'case-1004',
    reason_code: 'KIT_NOT_MAINTAINED',
    reason_label: 'Mandatory kit not maintained',
    amount_paise: 15000,
    status: 'DISPUTED',
    proposed_by: 'Hub Lead',
    proposed_at: '2026-09-18T17:00:00Z',
  },
];

/* -------------------- Tone helpers -------------------- */

function incentiveStatusTone(status: IncentiveStatus): CSSProperties {
  switch (status) {
    case 'ACTIVE':
      return styles.statusActive;
    case 'DRAFT':
      return styles.statusDraft;
    case 'PAUSED':
      return styles.statusPaused;
    case 'EXPIRED':
      return styles.statusExpired;
    case 'BUDGET_CAPPED':
      return styles.statusCapped;
    default:
      return styles.statusDraft;
  }
}

function awardStatusTone(status: AwardStatus): CSSProperties {
  switch (status) {
    case 'PAID':
      return styles.statusPaid;
    case 'AWARDED':
      return styles.statusAwarded;
    case 'ELIGIBLE':
      return styles.statusEligible;
    case 'CANCELLED':
      return styles.statusCancelled;
    default:
      return styles.statusDraft;
  }
}

function penaltyStatusTone(status: PenaltyStatus): CSSProperties {
  switch (status) {
    case 'PROPOSED':
      return styles.statusProposed;
    case 'APPROVED':
      return styles.statusApproved;
    case 'APPLIED':
      return styles.statusApplied;
    case 'DISPUTED':
      return styles.statusDisputed;
    case 'REVERSED':
      return styles.statusReversed;
    default:
      return styles.statusDraft;
  }
}

/* -------------------- Utils -------------------- */

function formatPaise(paise?: number | null): string {
  if (paise == null) return '—';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
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

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function IncentivesTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: IncentivesTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>('incentives');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedAward, setSelectedAward] = useState<IncentiveAward | null>(
    null
  );
  const [selectedPenalty, setSelectedPenalty] =
    useState<PenaltyRecord | null>(null);
  const [showCreateRule, setShowCreateRule] = useState(false);

  const apiOpts = useMemo(
    () => ({ baseUrl: apiBase, authToken }),
    [apiBase, authToken]
  );

  /* -------------------- Load -------------------- */

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
        setNotConfigured('Incentives API not configured yet.');
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

  /* -------------------- Derived: Summary -------------------- */

  const summary = useMemo(() => {
    const totalBudget = STARTER_RULES.reduce(
      (s, r) => s + r.budget_cap_paise,
      0
    );
    const totalSpent = STARTER_RULES.reduce((s, r) => s + r.spent_paise, 0);
    const activeRules = STARTER_RULES.filter(
      (r) => r.status === 'ACTIVE'
    ).length;
    const awardedCount = STARTER_AWARDS.filter(
      (a) => a.status === 'AWARDED'
    ).length;
    const paidAmount = STARTER_AWARDS.filter(
      (a) => a.status === 'PAID'
    ).reduce((s, a) => s + a.amount_paise, 0);
    const proposedPenalties = STARTER_PENALTIES.filter(
      (p) => p.status === 'PROPOSED'
    ).length;
    const appliedPenalties = STARTER_PENALTIES.filter(
      (p) => p.status === 'APPLIED'
    ).reduce((s, p) => s + p.amount_paise, 0);
    const disputed = STARTER_PENALTIES.filter(
      (p) => p.status === 'DISPUTED'
    ).length;

    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      activeRules,
      awardedCount,
      paidAmount,
      proposedPenalties,
      appliedPenalties,
      disputed,
    };
  }, []);

  /* -------------------- Filtered: Awards -------------------- */

  const filteredAwards = useMemo(() => {
    let list = [...STARTER_AWARDS];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.partner_name.toLowerCase().includes(q) ||
          a.partner_code.toLowerCase().includes(q) ||
          a.rule_name.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (sortBy === 'name') {
      list.sort((a, b) => a.partner_name.localeCompare(b.partner_name));
    } else if (sortBy === 'code') {
      list.sort((a, b) => a.partner_code.localeCompare(b.partner_code));
    } else if (sortBy === 'amount') {
      list.sort((a, b) => b.amount_paise - a.amount_paise);
    } else if (sortBy === 'date') {
      list.sort(
        (a, b) =>
          new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime()
      );
    }

    return list;
  }, [search, sortBy, statusFilter]);

  /* -------------------- Filtered: Penalties -------------------- */

  const filteredPenalties = useMemo(() => {
    let list = [...STARTER_PENALTIES];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.partner_name.toLowerCase().includes(q) ||
          p.partner_code.toLowerCase().includes(q) ||
          p.reason_label.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((p) => p.status === statusFilter);
    }

    if (sortBy === 'name') {
      list.sort((a, b) => a.partner_name.localeCompare(b.partner_name));
    } else if (sortBy === 'code') {
      list.sort((a, b) => a.partner_code.localeCompare(b.partner_code));
    } else if (sortBy === 'amount') {
      list.sort((a, b) => b.amount_paise - a.amount_paise);
    } else if (sortBy === 'date') {
      list.sort(
        (a, b) =>
          new Date(b.proposed_at).getTime() -
          new Date(a.proposed_at).getTime()
      );
    }

    return list;
  }, [search, sortBy, statusFilter]);

  /* -------------------- Render states -------------------- */

  if (loading) {
    return <div style={styles.state}>Loading incentives & penalties…</div>;
  }

  if (notConfigured) {
    return (
      <div style={styles.state}>
        <strong>Not configured:</strong> {notConfigured}
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 12 }}>
          Connect the incentive & penalty API to see live data.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.stateError}>
        <span>Error: {error}</span>
        <button style={styles.retryBtn} onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  /* -------------------- Render -------------------- */

  return (
    <div style={styles.root}>
      {/* Summary cards */}
      <div style={styles.summaryRow}>
        <SummaryCard
          label="Total Budget"
          value={formatPaise(summary.totalBudget)}
          sub={`${summary.activeRules} active rules`}
          tone="info"
        />
        <SummaryCard
          label="Spent"
          value={formatPaise(summary.totalSpent)}
          sub={`remaining ${formatPaise(summary.remaining)}`}
          tone="warning"
        />
        <SummaryCard
          label="Awards Paid"
          value={formatPaise(summary.paidAmount)}
          sub={`${summary.awardedCount} awarded`}
          tone="success"
        />
        <SummaryCard
          label="Penalties Applied"
          value={formatPaise(summary.appliedPenalties)}
          sub={`${summary.proposedPenalties} proposed`}
          tone="danger"
        />
        <SummaryCard
          label="Disputed Penalties"
          value={String(summary.disputed)}
          sub="under review"
          tone="warning"
        />
      </div>

      {/* View toggle */}
      <div style={styles.viewBar}>
        <button
          style={view === 'incentives' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => {
            setView('incentives');
            setStatusFilter('ALL');
          }}
        >
          Incentives
        </button>
        <button
          style={view === 'penalties' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => {
            setView('penalties');
            setStatusFilter('ALL');
          }}
        >
          Penalties
        </button>
        {view === 'incentives' && (
          <button
            style={styles.createBtn}
            onClick={() => setShowCreateRule(true)}
          >
            + Create Rule
          </button>
        )}
        <button style={styles.refreshBtn} onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="Search partner, code, rule, reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          {view === 'incentives' ? (
            <>
              <option value="ELIGIBLE">Eligible</option>
              <option value="AWARDED">Awarded</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </>
          ) : (
            <>
              <option value="PROPOSED">Proposed</option>
              <option value="APPROVED">Approved</option>
              <option value="APPLIED">Applied</option>
              <option value="DISPUTED">Disputed</option>
              <option value="REVERSED">Reversed</option>
            </>
          )}
        </select>
        <select
          style={styles.select}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
        >
          <option value="date">Sort: Date</option>
          <option value="amount">Sort: Amount</option>
          <option value="name">Sort: Name</option>
          <option value="code">Sort: Code</option>
        </select>
      </div>

      {/* Incentives view */}
      {view === 'incentives' && (
        <>
          {/* Rules grid */}
          <div style={styles.sectionTitle}>Incentive Rules</div>
          {STARTER_RULES.length === 0 ? (
            <div style={styles.state}>No rules configured.</div>
          ) : (
            <div style={styles.ruleGrid}>
              {STARTER_RULES.map((r) => (
                <RuleCard key={r.id} rule={r} />
              ))}
            </div>
          )}

          {/* Awards table */}
          <div style={styles.sectionTitle}>
            Awarded Incentives ({filteredAwards.length})
          </div>
          {filteredAwards.length === 0 ? (
            <div style={styles.state}>No awards match.</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <Th>Partner</Th>
                    <Th>Code</Th>
                    <Th>Rule</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Awarded At</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAwards.map((a) => (
                    <tr key={a.id}>
                      <Td>
                        <strong>{a.partner_name}</strong>
                      </Td>
                      <Td>
                        <code style={{ fontSize: 12 }}>{a.partner_code}</code>
                      </Td>
                      <Td>{a.rule_name}</Td>
                      <Td>
                        <strong>{formatPaise(a.amount_paise)}</strong>
                      </Td>
                      <Td>
                        <span style={awardStatusTone(a.status)}>
                          {AWARD_STATUS_LABELS[a.status]}
                        </span>
                      </Td>
                      <Td>{formatDate(a.awarded_at)}</Td>
                      <Td>
                        <button
                          style={styles.smallBtn}
                          onClick={() => setSelectedAward(a)}
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
        </>
      )}

      {/* Penalties view */}
      {view === 'penalties' && (
        <>
          <div style={styles.sectionTitle}>
            Penalty Records ({filteredPenalties.length})
          </div>
          {filteredPenalties.length === 0 ? (
            <div style={styles.state}>No penalties match.</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <Th>Partner</Th>
                    <Th>Code</Th>
                    <Th>Reason</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Proposed At</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPenalties.map((p) => (
                    <tr key={p.id}>
                      <Td>
                        <strong>{p.partner_name}</strong>
                      </Td>
                      <Td>
                        <code style={{ fontSize: 12 }}>{p.partner_code}</code>
                      </Td>
                      <Td>{p.reason_label}</Td>
                      <Td>
                        <strong style={{ color: '#991b1b' }}>
                          −{formatPaise(p.amount_paise)}
                        </strong>
                      </Td>
                      <Td>
                        <span style={penaltyStatusTone(p.status)}>
                          {PENALTY_STATUS_LABELS[p.status]}
                        </span>
                      </Td>
                      <Td>{formatDate(p.proposed_at)}</Td>
                      <Td>
                        <button
                          style={styles.smallBtn}
                          onClick={() => setSelectedPenalty(p)}
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
        </>
      )}

      {/* Footer note */}
      <div style={styles.footerNote}>
        <strong>Note:</strong> Penalties follow maker-checker: proposed →
        approved → applied. Applied penalties create ledger entries. Disputes
        open a partner-facing window with reversal option. Rewards are released
        only after conditions are met and budget is available.
      </div>

      {/* Drawers */}
      {selectedAward && (
        <AwardDrawer
          award={selectedAward}
          onClose={() => setSelectedAward(null)}
          onPartnerSelect={onPartnerSelect}
        />
      )}
      {selectedPenalty && (
        <PenaltyDrawer
          penalty={selectedPenalty}
          onClose={() => setSelectedPenalty(null)}
          onPartnerSelect={onPartnerSelect}
        />
      )}
      {showCreateRule && (
        <CreateRuleWizard onClose={() => setShowCreateRule(false)} />
      )}
    </div>
  );
}

/* ============================================================
   SummaryCard
   ============================================================ */

function SummaryCard({
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
        ...styles.summaryCard,
        background: theme.bg,
        borderColor: theme.color + '33',
      }}
    >
      <div style={{ ...styles.summaryLabel, color: theme.color }}>
        {label}
      </div>
      <div style={{ ...styles.summaryValue, color: theme.color }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: theme.color, opacity: 0.8 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   RuleCard
   ============================================================ */

function RuleCard({ rule }: { rule: IncentiveRule }) {
  const usedPct = rule.budget_cap_paise
    ? Math.min(100, Math.round((rule.spent_paise / rule.budget_cap_paise) * 100))
    : 0;

  return (
    <div style={styles.ruleCard}>
      <div style={styles.ruleHeader}>
        <div style={styles.ruleTitle}>{rule.name}</div>
        <span style={incentiveStatusTone(rule.status)}>
          {INCENTIVE_STATUS_LABELS[rule.status]}
        </span>
      </div>
      <div style={styles.ruleDesc}>{rule.description}</div>

      <div style={styles.ruleMetaRow}>
        <span style={styles.ruleMetaPill}>
          {RULE_TYPE_LABELS[rule.condition_type]}
        </span>
        <span style={styles.ruleMetaValue}>{rule.condition_value}</span>
        <span style={styles.ruleMetaPill}>{rule.reward_type}</span>
        <span style={styles.ruleMetaValue}>
          {formatPaise(rule.reward_amount_paise)}
        </span>
      </div>

      {rule.hub && (
        <div style={styles.ruleTag}>
          Hub: <strong>{rule.hub}</strong>
        </div>
      )}
      {rule.category && (
        <div style={styles.ruleTag}>
          Category: <strong>{rule.category}</strong>
        </div>
      )}

      <div style={styles.budgetRow}>
        <div style={styles.budgetLabel}>
          Spent {formatPaise(rule.spent_paise)} of{' '}
          {formatPaise(rule.budget_cap_paise)}
        </div>
        <div style={styles.budgetPct}>{usedPct}%</div>
      </div>
      <div style={styles.budgetBar}>
        <div
          style={{
            ...styles.budgetBarFill,
            width: `${usedPct}%`,
            background:
              usedPct >= 100
                ? '#dc2626'
                : usedPct >= 75
                ? '#f59e0b'
                : '#16a34a',
          }}
        />
      </div>

      <div style={styles.ruleValidity}>
        {rule.validity_from} → {rule.validity_to}
      </div>
    </div>
  );
}

/* ============================================================
   AwardDrawer
   ============================================================ */

function AwardDrawer({
  award,
  onClose,
  onPartnerSelect,
}: {
  award: IncentiveAward;
  onClose: () => void;
  onPartnerSelect?: (partnerId: string) => void;
}) {
  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>Incentive Award</div>
            <div style={styles.drawerSub}>
              {award.partner_name} · {award.partner_code}
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.detailGrid}>
            <DetailItem label="Rule" value={award.rule_name} />
            <DetailItem
              label="Amount"
              value={formatPaise(award.amount_paise)}
            />
            <DetailItem
              label="Status"
              value={AWARD_STATUS_LABELS[award.status]}
            />
            <DetailItem
              label="Awarded At"
              value={formatDate(award.awarded_at)}
            />
            <DetailItem
              label="Paid At"
              value={award.paid_at ? formatDate(award.paid_at) : 'Not paid yet'}
            />
          </div>

          <div style={styles.infoBox}>
            <strong>Note:</strong> Awards are created when a partner meets all
            rule conditions. Paid status only after the wallet ledger confirms
            the entry.
          </div>

          <div style={styles.drawerActions}>
            <button
              style={styles.primaryBtn}
              onClick={() => onPartnerSelect?.(award.partner_id)}
              disabled={!onPartnerSelect}
            >
              Open Partner 360°
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PenaltyDrawer
   ============================================================ */

function PenaltyDrawer({
  penalty,
  onClose,
  onPartnerSelect,
}: {
  penalty: PenaltyRecord;
  onClose: () => void;
  onPartnerSelect?: (partnerId: string) => void;
}) {
  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>Penalty Record</div>
            <div style={styles.drawerSub}>
              {penalty.partner_name} · {penalty.partner_code}
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.detailGrid}>
            <DetailItem label="Reason" value={penalty.reason_label} />
            <DetailItem
              label="Reason Code"
              value={penalty.reason_code}
            />
            <DetailItem
              label="Amount"
              value={`−${formatPaise(penalty.amount_paise)}`}
            />
            <DetailItem
              label="Status"
              value={PENALTY_STATUS_LABELS[penalty.status]}
            />
            <DetailItem label="Proposed By" value={penalty.proposed_by} />
            <DetailItem
              label="Proposed At"
              value={formatDate(penalty.proposed_at)}
            />
            {penalty.approved_by && (
              <DetailItem label="Approved By" value={penalty.approved_by} />
            )}
            {penalty.approved_at && (
              <DetailItem
                label="Approved At"
                value={formatDate(penalty.approved_at)}
              />
            )}
            {penalty.case_id && (
              <DetailItem label="Case ID" value={penalty.case_id} />
            )}
          </div>

          <div style={styles.infoBox}>
            <strong>Maker-checker:</strong> Penalty cannot be applied by the
            same person who proposed it. Applied penalties create ledger
            entries with reason + evidence + audit.
          </div>

          <div style={styles.drawerActions}>
            <button
              style={styles.primaryBtn}
              onClick={() => onPartnerSelect?.(penalty.partner_id)}
              disabled={!onPartnerSelect}
            >
              Open Partner 360°
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
   CreateRuleWizard
   ============================================================ */

function CreateRuleWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conditionType, setConditionType] =
    useState<IncentiveRule['condition_type']>('JOBS_PER_WEEK');
  const [conditionValue, setConditionValue] = useState('');
  const [rewardType, setRewardType] =
    useState<IncentiveRule['reward_type']>('FIXED');
  const [rewardAmount, setRewardAmount] = useState('');
  const [budgetCap, setBudgetCap] = useState('');
  const [validityFrom, setValidityFrom] = useState('');
  const [validityTo, setValidityTo] = useState('');

  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div
        style={{ ...styles.drawer, width: 'min(620px, 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>Create Incentive Rule</div>
            <div style={styles.drawerSub}>
              Configure conditions, reward, and budget cap
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.stepRow}>
            <span style={step >= 1 ? styles.stepActive : styles.step}>
              1. Basic Info
            </span>
            <span style={step >= 2 ? styles.stepActive : styles.step}>
              2. Condition
            </span>
            <span style={step >= 3 ? styles.stepActive : styles.step}>
              3. Reward & Budget
            </span>
            <span style={step >= 4 ? styles.stepActive : styles.step}>
              4. Validity
            </span>
          </div>

          {step === 1 && (
            <div>
              <div style={styles.fieldLabel}>Rule Name</div>
              <input
                style={styles.textInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekend Warrior"
              />
              <div style={styles.fieldLabel}>Description</div>
              <textarea
                style={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Explain what the partner needs to do…"
              />
              <div style={styles.wizardActions}>
                <button
                  style={styles.primaryBtn}
                  disabled={!name.trim()}
                  onClick={() => setStep(2)}
                >
                  Next: Condition
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={styles.fieldLabel}>Condition Type</div>
              <div style={styles.levelPickRow}>
                {(
                  Object.keys(RULE_TYPE_LABELS) as IncentiveRule['condition_type'][]
                ).map((t) => (
                  <button
                    key={t}
                    style={
                      conditionType === t
                        ? styles.levelPickActive
                        : styles.levelPick
                    }
                    onClick={() => setConditionType(t)}
                  >
                    {RULE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <div style={styles.fieldLabel}>Condition Value</div>
              <input
                style={styles.textInput}
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                placeholder="e.g., 10, 4.7, 5"
              />
              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  style={styles.primaryBtn}
                  disabled={!conditionValue.trim()}
                  onClick={() => setStep(3)}
                >
                  Next: Reward
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={styles.fieldLabel}>Reward Type</div>
              <div style={styles.levelPickRow}>
                {(['FIXED', 'PER_JOB', 'PERCENT'] as IncentiveRule['reward_type'][]).map(
                  (t) => (
                    <button
                      key={t}
                      style={
                        rewardType === t
                          ? styles.levelPickActive
                          : styles.levelPick
                      }
                      onClick={() => setRewardType(t)}
                    >
                      {t}
                    </button>
                  )
                )}
              </div>
              <div style={styles.fieldLabel}>Reward Amount (₹)</div>
              <input
                style={styles.textInput}
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="e.g., 500"
              />
              <div style={styles.fieldLabel}>Budget Cap (₹)</div>
              <input
                style={styles.textInput}
                type="number"
                value={budgetCap}
                onChange={(e) => setBudgetCap(e.target.value)}
                placeholder="e.g., 5000"
              />
              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(2)}>
                  Back
                </button>
                <button
                  style={styles.primaryBtn}
                  disabled={!rewardAmount || !budgetCap}
                  onClick={() => setStep(4)}
                >
                  Next: Validity
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={styles.fieldLabel}>Validity From</div>
              <input
                type="date"
                style={styles.textInput}
                value={validityFrom}
                onChange={(e) => setValidityFrom(e.target.value)}
              />
              <div style={styles.fieldLabel}>Validity To</div>
              <input
                type="date"
                style={styles.textInput}
                value={validityTo}
                onChange={(e) => setValidityTo(e.target.value)}
              />

              <div style={styles.confirmBox}>
                <div>
                  <strong>Rule:</strong> {name}
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>Condition:</strong> {RULE_TYPE_LABELS[conditionType]}{' '}
                  ≥ {conditionValue}
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>Reward:</strong> {rewardType} · ₹{rewardAmount}
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>Budget Cap:</strong> ₹{budgetCap}
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>Validity:</strong> {validityFrom} → {validityTo}
                </div>
              </div>

              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(3)}>
                  Back
                </button>
                <button
                  style={styles.primaryBtn}
                  disabled
                  title="Save API not wired yet"
                  onClick={onClose}
                >
                  Submit (API not configured)
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={styles.drawerFooter}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            Rule creation requires budget approval. Once active, rewards are
            computed from the ledger.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Table helpers
   ============================================================ */

function Th({ children }: { children: ReactNode }) {
  return <th style={styles.th}>{children}</th>;
}
function Td({ children }: { children: ReactNode }) {
  return <td style={styles.td}>{children}</td>;
}

/* ============================================================
   Styles
   ============================================================ */

const styles: Record<string, CSSProperties> = {
  root: { padding: 4 },

  /* Summary */
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 800,
    marginTop: 4,
    marginBottom: 2,
    wordBreak: 'break-word',
  },

  /* View bar */
  viewBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  viewBtn: {
    padding: '8px 14px',
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#374151',
    fontWeight: 600,
  },
  viewBtnActive: {
    padding: '8px 14px',
    background: '#eff6ff',
    border: '1px solid #93c5fd',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: 700,
  },
  createBtn: {
    padding: '8px 14px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  },
  refreshBtn: {
    marginLeft: 'auto',
    padding: '8px 14px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },

  /* Filters */
  filterBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 200,
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
  textInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 12,
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 12,
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },

  /* Section title */
  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
    marginBottom: 10,
  },

  /* Rules */
  ruleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
    marginBottom: 18,
  },
  ruleCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 14,
  },
  ruleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#111827',
    flex: 1,
  },
  ruleDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  ruleMetaRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleMetaPill: {
    fontSize: 10,
    fontWeight: 800,
    background: '#eff6ff',
    color: '#1d4ed8',
    padding: '2px 8px',
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  ruleMetaValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111827',
  },
  ruleTag: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  budgetRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 11,
    color: '#6b7280',
    marginTop: 8,
  },
  budgetLabel: {},
  budgetPct: { fontWeight: 700, color: '#374151' },
  budgetBar: {
    height: 5,
    background: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },
  budgetBarFill: {
    height: '100%',
    transition: 'width .3s',
  },
  ruleValidity: {
    marginTop: 8,
    fontSize: 11,
    color: '#6b7280',
  },

  /* Status chips */
  statusActive: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusDraft: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusPaused: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusExpired: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#e5e7eb',
    color: '#374151',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusCapped: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusPaid: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusAwarded: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusEligible: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusCancelled: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#e5e7eb',
    color: '#374151',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusProposed: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusApproved: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusApplied: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusDisputed: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusReversed: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#e5e7eb',
    color: '#374151',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },

  /* Table */
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

  /* States */
  state: {
    padding: 40,
    textAlign: 'center',
    border: '1px dashed #d1d5db',
    borderRadius: 10,
    background: '#fff',
    color: '#374151',
  },
  stateError: {
    padding: 20,
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryBtn: {
    padding: '6px 12px',
    background: '#991b1b',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },

  /* Footer */
  footerNote: {
    marginTop: 16,
    padding: '10px 14px',
    background: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: 6,
    fontSize: 12,
    color: '#6b7280',
  },

  /* Drawer */
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
    width: 'min(620px, 100%)',
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
  drawerBody: {
    padding: 20,
    overflowY: 'auto',
    flex: 1,
  },
  drawerFooter: {
    padding: '10px 20px',
    borderTop: '1px solid #e5e7eb',
    background: '#fff',
  },
  drawerActions: {
    marginTop: 16,
    display: 'flex',
    gap: 8,
  },

  /* Details */
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 12,
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

  /* Wizard */
  stepRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 18,
    fontSize: 11,
    flexWrap: 'wrap',
  },
  step: { color: '#9ca3af', fontWeight: 600 },
  stepActive: { color: '#1d4ed8', fontWeight: 800 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  levelPickRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  levelPick: {
    padding: '8px 14px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
  },
  levelPickActive: {
    padding: '8px 14px',
    background: '#eff6ff',
    border: '1px solid #93c5fd',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    color: '#1d4ed8',
  },
  infoBox: {
    padding: 12,
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 8,
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 16,
    lineHeight: 1.6,
  },
  confirmBox: {
    padding: 14,
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 1.7,
  },
  wizardActions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
};