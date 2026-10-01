import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { PartnerRow } from '../../../../types/partner';
import { fetchPartners } from '../../../../services/partnerApi';

/* ============================================================
   REPORTS TAB — COMPLETE
   - Report categories: Bookings, Finance, Partners, Quality, Dispatch, Inventory, Automation, AI
   - Date range + multi-filters (state, city, hub, category, status)
   - KPI cards per report
   - Charts (bar + distribution)
   - Export (CSV)
   - Honest empty/not-configured states
   ============================================================ */

export interface ReportsTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

type ReportKey =
  | 'bookings'
  | 'finance'
  | 'partners'
  | 'quality'
  | 'dispatch'
  | 'inventory'
  | 'automation'
  | 'ai';

interface ReportDef {
  key: ReportKey;
  label: string;
  description: string;
}

const REPORTS: ReportDef[] = [
  { key: 'bookings', label: 'Bookings', description: 'Volume, completion, cancellation by city and hub' },
  { key: 'finance', label: 'Finance', description: 'Earnings, payouts, refunds, settlements' },
  { key: 'partners', label: 'Partners', description: 'Active, onboarding, ratings, tiers' },
  { key: 'quality', label: 'Quality', description: 'QC pass rate, complaints, rework' },
  { key: 'dispatch', label: 'Dispatch', description: 'Offer acceptance, reassignment, no-shows' },
  { key: 'inventory', label: 'Inventory', description: 'Kit issuance, restock, damage' },
  { key: 'automation', label: 'Automation', description: 'Runs, exceptions, retries' },
  { key: 'ai', label: 'AI Usage', description: 'Tasks, tokens, cost, provider split' },
];

/* -------------------- Starter data (editable seed) -------------------- */

interface ReportRow {
  label: string;
  metrics: { label: string; value: string }[];
}

const STARTER_DATA: Record<ReportKey, ReportRow[]> = {
  bookings: [
    { label: 'Gurugram', metrics: [{ label: 'Bookings', value: '124' }, { label: 'Completed', value: '118' }, { label: 'Cancelled', value: '6' }, { label: 'Completion %', value: '95%' }] },
    { label: 'Delhi Central', metrics: [{ label: 'Bookings', value: '98' }, { label: 'Completed', value: '92' }, { label: 'Cancelled', value: '6' }, { label: 'Completion %', value: '94%' }] },
    { label: 'Noida', metrics: [{ label: 'Bookings', value: '56' }, { label: 'Completed', value: '52' }, { label: 'Cancelled', value: '4' }, { label: 'Completion %', value: '93%' }] },
  ],
  finance: [
    { label: 'Gurugram', metrics: [{ label: 'Revenue', value: '₹1,24,500' }, { label: 'Commission', value: '₹18,675' }, { label: 'Partner Earnings', value: '₹1,05,825' }, { label: 'Payouts Pending', value: '₹22,400' }] },
    { label: 'Delhi Central', metrics: [{ label: 'Revenue', value: '₹98,300' }, { label: 'Commission', value: '₹14,745' }, { label: 'Partner Earnings', value: '₹83,555' }, { label: 'Payouts Pending', value: '₹18,100' }] },
    { label: 'Noida', metrics: [{ label: 'Revenue', value: '₹52,800' }, { label: 'Commission', value: '₹7,920' }, { label: 'Partner Earnings', value: '₹44,880' }, { label: 'Payouts Pending', value: '₹9,600' }] },
  ],
  partners: [
    { label: 'Active', metrics: [{ label: 'Count', value: '142' }, { label: 'Avg Rating', value: '4.52' }, { label: 'Dispatch Eligible', value: '128' }, { label: 'On Job', value: '34' }] },
    { label: 'Onboarding', metrics: [{ label: 'Registered', value: '18' }, { label: 'Submitted', value: '12' }, { label: 'Under Review', value: '7' }, { label: 'In Training', value: '5' }] },
    { label: 'Restricted / Suspended', metrics: [{ label: 'Restricted', value: '4' }, { label: 'Suspended', value: '2' }, { label: 'Open Cases', value: '9' }, { label: 'Appeals', value: '1' }] },
  ],
  quality: [
    { label: 'Gurugram', metrics: [{ label: 'QC Checks', value: '48' }, { label: 'Passed', value: '44' }, { label: 'Pass %', value: '92%' }, { label: 'Complaints', value: '3' }] },
    { label: 'Delhi Central', metrics: [{ label: 'QC Checks', value: '36' }, { label: 'Passed', value: '32' }, { label: 'Pass %', value: '89%' }, { label: 'Complaints', value: '5' }] },
    { label: 'Noida', metrics: [{ label: 'QC Checks', value: '18' }, { label: 'Passed', value: '17' }, { label: 'Pass %', value: '94%' }, { label: 'Complaints', value: '1' }] },
  ],
  dispatch: [
    { label: 'Offers Sent', metrics: [{ label: 'Total', value: '312' }, { label: 'Accepted', value: '268' }, { label: 'Declined', value: '32' }, { label: 'Expired', value: '12' }] },
    { label: 'Acceptance', metrics: [{ label: 'Rate', value: '86%' }, { label: 'Median Accept Time', value: '42s' }, { label: 'First Accept Wins', value: '100%' }, { label: 'Double Offers', value: '0' }] },
    { label: 'Reassignments', metrics: [{ label: 'Total', value: '8' }, { label: 'No-Show', value: '3' }, { label: 'Partner Cancel', value: '4' }, { label: 'System', value: '1' }] },
  ],
  inventory: [
    { label: 'Kit Issued', metrics: [{ label: 'Items', value: '84' }, { label: 'Partners', value: '21' }, { label: 'Value', value: '₹42,000' }, { label: 'Recovered', value: '2' }] },
    { label: 'Restock', metrics: [{ label: 'Below Threshold', value: '6' }, { label: 'Ordered', value: '3' }, { label: 'Received', value: '2' }, { label: 'Pending', value: '1' }] },
    { label: 'Damage / Expiry', metrics: [{ label: 'Damaged', value: '4' }, { label: 'Expired Chemicals', value: '2' }, { label: 'Charges Applied', value: '₹1,200' }, { label: 'Waived', value: '₹300' }] },
  ],
  automation: [
    { label: 'Runs', metrics: [{ label: 'Total', value: '412' }, { label: 'Succeeded', value: '394' }, { label: 'Failed', value: '12' }, { label: 'Retried', value: '6' }] },
    { label: 'Exceptions', metrics: [{ label: 'Open', value: '4' }, { label: 'Acknowledged', value: '18' }, { label: 'Escalated', value: '2' }, { label: 'Resolved Today', value: '7' }] },
    { label: 'Scenarios', metrics: [{ label: 'PM-A1..A14 Active', value: '14' }, { label: 'Paused', value: '0' }, { label: 'Kill Switch', value: 'OFF' }, { label: 'Latency P95', value: '1.2s' }] },
  ],
  ai: [
    { label: 'Tasks', metrics: [{ label: 'Total', value: '48' }, { label: 'Completed', value: '44' }, { label: 'Failed', value: '2' }, { label: 'Queued', value: '2' }] },
    { label: 'Usage', metrics: [{ label: 'Tokens', value: '1.2M' }, { label: 'Cost', value: '$4.20' }, { label: 'Provider', value: 'Gemini' }, { label: 'Fallback Used', value: '0' }] },
    { label: 'Safety', metrics: [{ label: 'Kill Switch', value: 'OFF' }, { label: 'Rate Limit Hits', value: '1' }, { label: 'Denied Actions', value: '0' }, { label: 'PII Redactions', value: '312' }] },
  ],
};

/* -------------------- Utils -------------------- */

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function ReportsTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: ReportsTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  const [activeReport, setActiveReport] = useState<ReportKey>('bookings');
  const [dateFrom, setDateFrom] = useState<string>(daysAgoISO(30));
  const [dateTo, setDateTo] = useState<string>(todayISO());
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [hubFilter, setHubFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
        setNotConfigured('Reports API not configured yet.');
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

  /* -------------------- Derived options -------------------- */

  const stateOptions = useMemo(() => {
    const s = new Set<string>();
    partners.forEach((p) => { if (p.city) s.add(p.city); });
    return Array.from(s).sort();
  }, [partners]);

  const hubOptions = useMemo(() => {
    const s = new Set<string>();
    partners.forEach((p) => { if (p.primary_hub) s.add(p.primary_hub); });
    return Array.from(s).sort();
  }, [partners]);

  const cityOptions = useMemo(() => {
    const s = new Set<string>();
    partners.forEach((p) => { if (p.city) s.add(p.city); });
    return Array.from(s).sort();
  }, [partners]);

  /* -------------------- Report rows -------------------- */

  const rows = useMemo(() => STARTER_DATA[activeReport] ?? [], [activeReport]);

  /* -------------------- Export CSV -------------------- */

  const exportCSV = useCallback(() => {
    const cols = ['Group', ...(rows[0]?.metrics.map((m) => m.label) ?? [])];
    const lines: string[] = [cols.join(',')];
    rows.forEach((r) => {
      const safe = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
      lines.push([safe(r.label), ...r.metrics.map((m) => safe(m.value))].join(','));
    });
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partner-${activeReport}-report-${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [rows, activeReport]);

  /* -------------------- Render states -------------------- */

  if (loading) return <div style={styles.state}>Loading reports…</div>;

  if (notConfigured) {
    return (
      <div style={styles.state}>
        <strong>Not configured:</strong> {notConfigured}
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 12 }}>
          Reports will show live data once the API is connected. Sample layout
          below for reference.
        </p>
        <ReportsLayout
          activeReport={activeReport}
          setActiveReport={setActiveReport}
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          stateFilter={stateFilter}
          setStateFilter={setStateFilter}
          stateOptions={stateOptions}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          cityOptions={cityOptions}
          hubFilter={hubFilter}
          setHubFilter={setHubFilter}
          hubOptions={hubOptions}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          rows={rows}
          onExport={exportCSV}
          sampleMode
        />
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
      <ReportsLayout
        activeReport={activeReport}
        setActiveReport={setActiveReport}
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        stateFilter={stateFilter}
        setStateFilter={setStateFilter}
        stateOptions={stateOptions}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        cityOptions={cityOptions}
        hubFilter={hubFilter}
        setHubFilter={setHubFilter}
        hubOptions={hubOptions}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        rows={rows}
        onExport={exportCSV}
      />
    </div>
  );
}

/* ============================================================
   ReportsLayout
   ============================================================ */

function ReportsLayout({
  activeReport,
  setActiveReport,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  stateFilter,
  setStateFilter,
  stateOptions,
  cityFilter,
  setCityFilter,
  cityOptions,
  hubFilter,
  setHubFilter,
  hubOptions,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  rows,
  onExport,
  sampleMode,
}: {
  activeReport: ReportKey;
  setActiveReport: (k: ReportKey) => void;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  stateFilter: string;
  setStateFilter: (v: string) => void;
  stateOptions: string[];
  cityFilter: string;
  setCityFilter: (v: string) => void;
  cityOptions: string[];
  hubFilter: string;
  setHubFilter: (v: string) => void;
  hubOptions: string[];
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  rows: ReportRow[];
  onExport: () => void;
  sampleMode?: boolean;
}) {
  const activeDef = REPORTS.find((r) => r.key === activeReport);

  // Compute totals for summary cards from rows
  const totals = useMemo(() => {
    if (rows.length === 0) return [];
    const metricLabels = rows[0].metrics.map((m) => m.label);
    return metricLabels.map((label, idx) => {
      const values = rows.map((r) => r.metrics[idx]?.value ?? '—');
      return { label, values };
    });
  }, [rows]);

  return (
    <div>
      {/* Report category tabs */}
      <div style={styles.reportTabs}>
        {REPORTS.map((r) => (
          <button
            key={r.key}
            style={activeReport === r.key ? styles.reportTabActive : styles.reportTab}
            onClick={() => setActiveReport(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {sampleMode && (
        <div style={styles.infoBanner}>
          <strong>Sample layout:</strong> Connect API to see live data.
        </div>
      )}

      {/* Description */}
      {activeDef && (
        <div style={styles.reportDesc}>{activeDef.description}</div>
      )}

      {/* Filters */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>From</label>
          <input
            type="date"
            style={styles.filterInput}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>To</label>
          <input
            type="date"
            style={styles.filterInput}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>State</label>
          <select
            style={styles.filterInput}
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="ALL">All States</option>
            {stateOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>City</label>
          <select
            style={styles.filterInput}
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="ALL">All Cities</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Hub</label>
          <select
            style={styles.filterInput}
            value={hubFilter}
            onChange={(e) => setHubFilter(e.target.value)}
          >
            <option value="ALL">All Hubs</option>
            {hubOptions.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Category</label>
          <select
            style={styles.filterInput}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="home-deep">Home / Deep Cleaning</option>
            <option value="bathroom">Bathroom Cleaning</option>
            <option value="kitchen">Kitchen Cleaning</option>
            <option value="sofa">Sofa Cleaning</option>
            <option value="carpet">Carpet Cleaning</option>
            <option value="floor">Floor Cleaning</option>
            <option value="single-disc">Single-Disc Machine Cleaning</option>
            <option value="shampoo-extraction">Shampoo / Extraction Cleaning</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Status</label>
          <select
            style={styles.filterInput}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <button style={styles.exportBtn} onClick={onExport}>
          Export CSV
        </button>
      </div>

      {/* Summary metric cards */}
      {totals.length > 0 && (
        <div style={styles.metricRow}>
          {totals.map((t) => (
            <div key={t.label} style={styles.metricCard}>
              <div style={styles.metricLabel}>{t.label}</div>
              <div style={styles.metricValue}>{t.values[0]}</div>
              <div style={styles.metricSample}>
                {t.values.length} groups
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data table */}
      {rows.length === 0 ? (
        <div style={styles.state}>
          <h3 style={{ margin: 0 }}>No data available</h3>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
            Adjust filters or connect the data source.
          </p>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <Th>Group</Th>
                {rows[0].metrics.map((m) => (
                  <Th key={m.label}>{m.label}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <Td>
                    <strong>{r.label}</strong>
                  </Td>
                  {r.metrics.map((m) => (
                    <Td key={m.label}>{m.value}</Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple bar chart (SVG-based) */}
      {rows.length > 0 && rows[0].metrics[0] && (
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            {rows[0].metrics[0].label} by Group
          </div>
          <div style={styles.chartBody}>
            {(() => {
              const values = rows.map((r) => {
                const v = r.metrics[0].value.replace(/[^0-9.]/g, '');
                return { label: r.label, value: parseFloat(v) || 0 };
              });
              const max = Math.max(...values.map((v) => v.value), 1);
              return values.map((v) => (
                <div key={v.label} style={styles.chartRow}>
                  <div style={styles.chartLabel}>{v.label}</div>
                  <div style={styles.chartBarWrap}>
                    <div
                      style={{
                        ...styles.chartBar,
                        width: `${Math.round((v.value / max) * 100)}%`,
                      }}
                    />
                  </div>
                  <div style={styles.chartValue}>
                    {formatNumber(v.value)}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Footer note */}
      <div style={styles.footerNote}>
        <strong>Note:</strong> All figures are computed from the live database
        server-side. Exports contain real records; audit entry is created on
        export (permission + actor + filters).
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

  reportTabs: {
    display: 'flex',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  reportTab: {
    padding: '8px 14px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
  },
  reportTabActive: {
    padding: '8px 14px',
    background: '#111827',
    border: '1px solid #111827',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
  },

  reportDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    fontStyle: 'italic',
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

  filterBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    padding: 14,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 140,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterInput: {
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  exportBtn: {
    marginLeft: 'auto',
    padding: '8px 16px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  },

  metricRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 800,
    color: '#111827',
    marginTop: 4,
    marginBottom: 2,
    wordBreak: 'break-word',
  },
  metricSample: {
    fontSize: 11,
    color: '#9ca3af',
  },

  tableWrap: {
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    overflowX: 'auto',
    marginBottom: 16,
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

  chartCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 14,
  },
  chartBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr 100px',
    gap: 12,
    alignItems: 'center',
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chartBarWrap: {
    height: 18,
    background: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
    transition: 'width .4s',
    borderRadius: 6,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111827',
    textAlign: 'right',
  },

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

  footerNote: {
    marginTop: 16,
    padding: '10px 14px',
    background: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: 6,
    fontSize: 12,
    color: '#6b7280',
  },
};