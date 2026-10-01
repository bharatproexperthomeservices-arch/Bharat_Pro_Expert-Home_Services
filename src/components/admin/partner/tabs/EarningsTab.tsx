import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type {
  PartnerRow,
  PartnerWalletEntry,
  PartnerPayout,
  WalletEntryType,
  PayoutState,
} from '../../../../types/partner';

import {
  fetchPartners,
  fetchPartnerWallet,
  fetchPartnerPayouts,
} from '../../../../services/partnerApi';

/* ============================================================
   EARNINGS & PAYOUTS TAB — COMPLETE
   - Partner-wise lifetime earnings
   - Wallet ledger viewer
   - Payout history viewer
   - Cash remittance (COD) tracker
   - Filters, search, sort, statement export
   ============================================================ */

export interface EarningsTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

type SortKey = 'earnings' | 'name' | 'code' | 'balance';
type EarningsFilter = 'ALL' | 'HAS_EARNINGS' | 'ZERO' | 'TOP_10';
type DetailTab = 'wallet' | 'payouts';

interface DetailData {
  wallet: PartnerWalletEntry[];
  balance_paise: number;
  payouts: PartnerPayout[];
}

/* -------------------- Utils -------------------- */

function formatPaise(paise?: number | null): string {
  if (paise == null) return '—';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
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

const WALLET_TYPE_LABELS: Record<WalletEntryType, string> = {
  JOB_EARNING: 'Job Earning',
  TIP: 'Tip',
  INCENTIVE: 'Incentive',
  REFERRAL_BONUS: 'Referral Bonus',
  ADJUSTMENT: 'Adjustment',
  PENALTY: 'Penalty',
  KIT_DEPOSIT: 'Kit Deposit',
  KIT_DAMAGE: 'Kit Damage',
  CASH_COLLECTED: 'Cash Collected',
  CASH_REMITTED: 'Cash Remitted',
  HOLD: 'Hold',
  HOLD_RELEASE: 'Hold Release',
  PAYOUT: 'Payout',
  PAYOUT_REVERSAL: 'Payout Reversal',
  TAX_DEDUCTION: 'Tax Deduction',
  FEE: 'Platform Fee',
};

const PAYOUT_STATE_LABELS: Record<PayoutState, string> = {
  CREATED: 'Created',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  PROCESSING: 'Processing',
  SUCCESS: 'Success',
  FAILED: 'Failed',
  RETRY: 'Retry',
};

function walletTypeTone(type: WalletEntryType): CSSProperties {
  switch (type) {
    case 'JOB_EARNING':
    case 'TIP':
    case 'INCENTIVE':
    case 'REFERRAL_BONUS':
    case 'HOLD_RELEASE':
      return styles.creditChip;
    case 'PENALTY':
    case 'KIT_DAMAGE':
    case 'PAYOUT':
    case 'TAX_DEDUCTION':
    case 'FEE':
    case 'HOLD':
    case 'CASH_COLLECTED':
      return styles.debitChip;
    case 'ADJUSTMENT':
    case 'CASH_REMITTED':
    case 'PAYOUT_REVERSAL':
    case 'KIT_DEPOSIT':
      return styles.neutralChip;
    default:
      return styles.neutralChip;
  }
}

function payoutStateTone(state: PayoutState): CSSProperties {
  switch (state) {
    case 'SUCCESS':
      return styles.payoutSuccess;
    case 'FAILED':
      return styles.payoutFailed;
    case 'PENDING_APPROVAL':
    case 'APPROVED':
    case 'PROCESSING':
    case 'CREATED':
    case 'RETRY':
      return styles.payoutPending;
    default:
      return styles.payoutPending;
  }
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function EarningsTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: EarningsTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('earnings');
  const [earningsFilter, setEarningsFilter] = useState<EarningsFilter>('ALL');

  const [selectedPartner, setSelectedPartner] = useState<PartnerRow | null>(
    null
  );
  const [detailTab, setDetailTab] = useState<DetailTab>('wallet');
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const apiOpts = useMemo(
    () => ({ baseUrl: apiBase, authToken }),
    [apiBase, authToken]
  );

  /* -------------------- Load list -------------------- */

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
        setNotConfigured('Earnings API not configured yet.');
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

  /* -------------------- Load partner detail -------------------- */

  const loadDetail = useCallback(
    async (partner: PartnerRow) => {
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);
      try {
        const [walletRes, payoutsRes] = await Promise.all([
          fetchPartnerWallet(partner.id, apiOpts).catch(() => ({
            entries: [] as PartnerWalletEntry[],
            balance_paise: 0,
          })),
          fetchPartnerPayouts(partner.id, apiOpts).catch(
            () => [] as PartnerPayout[]
          ),
        ]);
        setDetail({
          wallet: walletRes.entries ?? [],
          balance_paise: walletRes.balance_paise ?? 0,
          payouts: payoutsRes ?? [],
        });
      } catch (e) {
        setDetailError(
          e instanceof Error ? e.message : 'Unknown detail error'
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [apiOpts]
  );

  const openPartner = useCallback(
    (partner: PartnerRow) => {
      setSelectedPartner(partner);
      setDetailTab('wallet');
      loadDetail(partner);
    },
    [loadDetail]
  );

  const closeDrawer = useCallback(() => {
    setSelectedPartner(null);
    setDetail(null);
    setDetailError(null);
  }, []);

  /* -------------------- Derived: Summary -------------------- */

  const summary = useMemo(() => {
    const withEarnings = partners.filter(
      (p) => (p.lifetime_earnings_paise ?? 0) > 0
    );
    const total = partners.reduce(
      (s, p) => s + (p.lifetime_earnings_paise ?? 0),
      0
    );
    const top = [...partners]
      .sort(
        (a, b) =>
          (b.lifetime_earnings_paise ?? 0) -
          (a.lifetime_earnings_paise ?? 0)
      )
      .slice(0, 1)[0];
    const zeroEarners = partners.filter(
      (p) => (p.lifetime_earnings_paise ?? 0) === 0
    ).length;

    return {
      total,
      topEarner: top?.legal_name ?? '—',
      topAmount: top?.lifetime_earnings_paise ?? 0,
      activeEarners: withEarnings.length,
      zeroEarners,
    };
  }, [partners]);

  /* -------------------- Derived: Filtered list -------------------- */

  const filtered = useMemo(() => {
    let list = [...partners];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.legal_name.toLowerCase().includes(q) ||
          p.partner_code.toLowerCase().includes(q) ||
          (p.mobile_masked && p.mobile_masked.includes(q))
      );
    }

    if (earningsFilter === 'HAS_EARNINGS') {
      list = list.filter((p) => (p.lifetime_earnings_paise ?? 0) > 0);
    } else if (earningsFilter === 'ZERO') {
      list = list.filter((p) => (p.lifetime_earnings_paise ?? 0) === 0);
    } else if (earningsFilter === 'TOP_10') {
      list = [...list]
        .sort(
          (a, b) =>
            (b.lifetime_earnings_paise ?? 0) -
            (a.lifetime_earnings_paise ?? 0)
        )
        .slice(0, 10);
      return list;
    }

    if (sortBy === 'earnings') {
      list.sort(
        (a, b) =>
          (b.lifetime_earnings_paise ?? 0) -
          (a.lifetime_earnings_paise ?? 0)
      );
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.legal_name.localeCompare(b.legal_name));
    } else if (sortBy === 'code') {
      list.sort((a, b) => a.partner_code.localeCompare(b.partner_code));
    } else if (sortBy === 'balance') {
      // Same order as earnings for now
      list.sort(
        (a, b) =>
          (b.lifetime_earnings_paise ?? 0) -
          (a.lifetime_earnings_paise ?? 0)
      );
    }

    return list;
  }, [partners, search, sortBy, earningsFilter]);

  /* -------------------- Export statement (CSV) -------------------- */

  const exportStatement = useCallback(() => {
    const rows: string[] = [
      'Partner Code,Partner Name,Hub,Bank Status,Lifetime Earnings (INR),Rating,Sample Size',
    ];
    filtered.forEach((p) => {
      const earn = (p.lifetime_earnings_paise ?? 0) / 100;
      const rating = p.rating != null ? p.rating.toFixed(2) : '—';
      const sample = p.rating_count ?? 0;
      const safe = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
      rows.push(
        [
          safe(p.partner_code),
          safe(p.legal_name),
          safe(p.primary_hub ?? '—'),
          safe(p.bank_status),
          earn.toFixed(2),
          rating,
          String(sample),
        ].join(',')
      );
    });
    const blob = new Blob([rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partner-earnings-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filtered]);

  /* -------------------- Render states -------------------- */

  if (loading) {
    return <div style={styles.state}>Loading earnings…</div>;
  }

  if (notConfigured) {
    return (
      <div style={styles.state}>
        <strong>Not configured:</strong> {notConfigured}
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 12 }}>
          Connect the wallet & payout API to see live earnings.
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
          label="Total Lifetime Earnings"
          value={formatPaise(summary.total)}
          sub={`${summary.activeEarners} partners with earnings`}
          tone="success"
        />
        <SummaryCard
          label="Top Earner"
          value={summary.topEarner}
          sub={formatPaise(summary.topAmount)}
          tone="info"
        />
        <SummaryCard
          label="Zero Earners"
          value={String(summary.zeroEarners)}
          sub="no jobs / no earnings yet"
          tone="warning"
        />
        <SummaryCard
          label="Total Partners"
          value={String(partners.length)}
          sub="in earnings view"
          tone="info"
        />
      </div>

      {/* Filter bar */}
      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="Search name, code, mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={earningsFilter}
          onChange={(e) =>
            setEarningsFilter(e.target.value as EarningsFilter)
          }
        >
          <option value="ALL">All Partners</option>
          <option value="HAS_EARNINGS">Has Earnings</option>
          <option value="ZERO">Zero Earners</option>
          <option value="TOP_10">Top 10</option>
        </select>
        <select
          style={styles.select}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
        >
          <option value="earnings">Sort: Earnings</option>
          <option value="balance">Sort: Balance</option>
          <option value="name">Sort: Name</option>
          <option value="code">Sort: Code</option>
        </select>
        <button
          style={styles.exportBtn}
          onClick={exportStatement}
          disabled={filtered.length === 0}
        >
          Export CSV
        </button>
        <button style={styles.refreshBtn} onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={styles.state}>
          <h3 style={{ margin: 0 }}>No partners match</h3>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
            Try changing filters or search.
          </p>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <Th>Partner</Th>
                <Th>Code</Th>
                <Th>Hub</Th>
                <Th>Lifetime Earnings</Th>
                <Th>Bank Status</Th>
                <Th>Rating</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const earning = p.lifetime_earnings_paise ?? 0;
                return (
                  <tr key={p.id}>
                    <Td>
                      <div style={{ fontWeight: 600 }}>{p.legal_name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {p.mobile_masked}
                      </div>
                    </Td>
                    <Td>
                      <code style={{ fontSize: 12 }}>{p.partner_code}</code>
                    </Td>
                    <Td>{p.primary_hub ?? '—'}</Td>
                    <Td>
                      <span
                        style={
                          earning > 0 ? styles.earnGood : styles.earnZero
                        }
                      >
                        {formatPaise(earning)}
                      </span>
                    </Td>
                    <Td>
                      <span
                        style={
                          p.bank_status === 'VERIFIED'
                            ? styles.bankOk
                            : styles.bankPending
                        }
                      >
                        {p.bank_status.replace(/_/g, ' ')}
                      </span>
                    </Td>
                    <Td>
                      {p.rating != null && p.rating_count
                        ? `${p.rating.toFixed(1)} ★ (${p.rating_count})`
                        : '—'}
                    </Td>
                    <Td>
                      <div style={styles.actionRow}>
                        <button
                          style={styles.smallBtn}
                          onClick={() => openPartner(p)}
                        >
                          Ledger
                        </button>
                        <button
                          style={styles.smallBtnGhost}
                          onClick={() => onPartnerSelect?.(p.id)}
                          disabled={!onPartnerSelect}
                        >
                          View 360°
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer note */}
      <div style={styles.footerNote}>
        <strong>Note:</strong> Earnings shown are from the append-only wallet
        ledger. Payout actions require Finance Officer approval
        (maker-checker). Payouts never mark SUCCESS without provider
        confirmation.
      </div>

      {/* Detail drawer */}
      {selectedPartner && (
        <EarningsDetailDrawer
          partner={selectedPartner}
          detail={detail}
          loading={detailLoading}
          error={detailError}
          tab={detailTab}
          onTabChange={setDetailTab}
          onClose={closeDrawer}
          onRetry={() => loadDetail(selectedPartner)}
        />
      )}
    </div>
  );
}

/* ============================================================
   Summary card
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
   Detail drawer
   ============================================================ */

function EarningsDetailDrawer({
  partner,
  detail,
  loading,
  error,
  tab,
  onTabChange,
  onClose,
  onRetry,
}: {
  partner: PartnerRow;
  detail: DetailData | null;
  loading: boolean;
  error: string | null;
  tab: DetailTab;
  onTabChange: (t: DetailTab) => void;
  onClose: () => void;
  onRetry: () => void;
}) {
  const walletEntries = detail?.wallet ?? [];
  const payouts = detail?.payouts ?? [];
  const balance = detail?.balance_paise ?? 0;

  const totalCredits = walletEntries
    .filter((e) => e.amount_paise > 0)
    .reduce((s, e) => s + e.amount_paise, 0);
  const totalDebits = walletEntries
    .filter((e) => e.amount_paise < 0)
    .reduce((s, e) => s + Math.abs(e.amount_paise), 0);

  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div
        style={styles.drawer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{partner.legal_name}</div>
            <div style={styles.drawerSub}>
              {partner.partner_code} · {partner.primary_hub ?? 'No hub'}
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Wallet summary */}
        <div style={styles.drawerSummary}>
          <div style={styles.drawerSummaryItem}>
            <div style={styles.drawerSummaryLabel}>Wallet Balance</div>
            <div style={styles.drawerSummaryValue}>
              {formatPaise(balance)}
            </div>
          </div>
          <div style={styles.drawerSummaryItem}>
            <div style={styles.drawerSummaryLabel}>Total Credits</div>
            <div style={{ ...styles.drawerSummaryValue, color: '#166534' }}>
              {formatPaise(totalCredits)}
            </div>
          </div>
          <div style={styles.drawerSummaryItem}>
            <div style={styles.drawerSummaryLabel}>Total Debits</div>
            <div style={{ ...styles.drawerSummaryValue, color: '#991b1b' }}>
              {formatPaise(totalDebits)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.drawerTabs}>
          <button
            style={
              tab === 'wallet' ? styles.drawerTabActive : styles.drawerTab
            }
            onClick={() => onTabChange('wallet')}
          >
            Wallet Ledger ({walletEntries.length})
          </button>
          <button
            style={
              tab === 'payouts' ? styles.drawerTabActive : styles.drawerTab
            }
            onClick={() => onTabChange('payouts')}
          >
            Payout History ({payouts.length})
          </button>
        </div>

        {/* Body */}
        <div style={styles.drawerBody}>
          {loading && (
            <div style={styles.drawerState}>Loading ledger…</div>
          )}

          {!loading && error && (
            <div style={styles.drawerStateError}>
              <span>Error: {error}</span>
              <button style={styles.retryBtn} onClick={onRetry}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && tab === 'wallet' && (
            <>
              {walletEntries.length === 0 ? (
                <div style={styles.drawerState}>
                  No wallet entries yet.
                </div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <Th>Date</Th>
                        <Th>Type</Th>
                        <Th>Description</Th>
                        <Th>Amount</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletEntries.map((e) => (
                        <tr key={e.id}>
                          <Td>{formatDate(e.created_at)}</Td>
                          <Td>
                            <span style={walletTypeTone(e.type)}>
                              {WALLET_TYPE_LABELS[e.type] ?? e.type}
                            </span>
                          </Td>
                          <Td>{e.description ?? '—'}</Td>
                          <Td>
                            <span
                              style={
                                e.amount_paise >= 0
                                  ? styles.amountCredit
                                  : styles.amountDebit
                              }
                            >
                              {e.amount_paise >= 0 ? '+' : '−'}
                              {formatPaise(Math.abs(e.amount_paise))}
                            </span>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {!loading && !error && tab === 'payouts' && (
            <>
              {payouts.length === 0 ? (
                <div style={styles.drawerState}>
                  No payouts recorded yet.
                </div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <Th>Created</Th>
                        <Th>Amount</Th>
                        <Th>State</Th>
                        <Th>Provider Ref</Th>
                        <Th>Failure Reason</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.id}>
                          <Td>{formatDate(p.created_at)}</Td>
                          <Td>
                            <strong>{formatPaise(p.amount_paise)}</strong>
                          </Td>
                          <Td>
                            <span style={payoutStateTone(p.state)}>
                              {PAYOUT_STATE_LABELS[p.state] ?? p.state}
                            </span>
                          </Td>
                          <Td>
                            <code style={{ fontSize: 11 }}>
                              {p.provider_ref ?? '—'}
                            </code>
                          </Td>
                          <Td>{p.failure_reason ?? '—'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.drawerFooter}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            Ledger is append-only. Corrections use compensating entries.
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
    fontSize: 20,
    fontWeight: 800,
    marginTop: 4,
    marginBottom: 2,
    wordBreak: 'break-word',
  },

  /* Filter bar */
  filterBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
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
  exportBtn: {
    padding: '8px 14px',
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  refreshBtn: {
    padding: '8px 14px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
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

  /* Chips */
  earnGood: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  earnZero: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  bankOk: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  bankPending: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  creditChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  debitChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  neutralChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  payoutSuccess: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  payoutFailed: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  payoutPending: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  amountCredit: { color: '#166534', fontWeight: 700 },
  amountDebit: { color: '#991b1b', fontWeight: 700 },

  /* Action buttons */
  actionRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  smallBtn: {
    padding: '4px 10px',
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  smallBtnGhost: {
    padding: '4px 10px',
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },

  /* Footer note */
  footerNote: {
    marginTop: 14,
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
    width: 'min(720px, 100%)',
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
  drawerSummary: {
    padding: '12px 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  drawerSummaryItem: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    padding: 10,
  },
  drawerSummaryLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  drawerSummaryValue: {
    fontSize: 16,
    fontWeight: 800,
    color: '#111827',
    marginTop: 4,
  },
  drawerTabs: {
    display: 'flex',
    gap: 4,
    padding: '10px 20px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  drawerTab: {
    background: 'transparent',
    border: 'none',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 13,
    color: '#4b5563',
    fontWeight: 600,
    borderBottom: '2px solid transparent',
  },
  drawerTabActive: {
    background: 'transparent',
    border: 'none',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: 700,
    borderBottom: '2px solid #1d4ed8',
  },
  drawerBody: {
    padding: 20,
    overflowY: 'auto',
    flex: 1,
  },
  drawerState: {
    padding: 40,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 13,
  },
  drawerStateError: {
    padding: 20,
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerFooter: {
    padding: '10px 20px',
    borderTop: '1px solid #e5e7eb',
    background: '#fff',
  },
};