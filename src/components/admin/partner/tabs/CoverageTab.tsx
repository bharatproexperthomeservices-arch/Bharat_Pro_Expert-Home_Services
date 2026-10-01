import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { PartnerRow } from '../../../../types/partner';
import { fetchPartners } from '../../../../services/partnerApi';

/* ============================================================
   COVERAGE & AVAILABILITY TAB
   Partner availability status + hub-wise coverage view
   ============================================================ */

export interface CoverageTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

const AVAILABILITY_COLORS: Record<string, string> = {
  AVAILABLE: '#16a34a',
  BUSY: '#f59e0b',
  OFFLINE: '#6b7280',
  ON_BREAK: '#8b5cf6',
  ON_LEAVE: '#dc2626',
};

export default function CoverageTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: CoverageTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);
  const [hubFilter, setHubFilter] = useState<string>('ALL');
  const [availFilter, setAvailFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

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
        setNotConfigured('Coverage API not configured yet.');
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

  /* ---------------- Derived data ---------------- */

  const hubs = useMemo(() => {
    const set = new Set<string>();
    partners.forEach((p) => {
      if (p.primary_hub) set.add(p.primary_hub);
    });
    return Array.from(set).sort();
  }, [partners]);

  const availabilityCounts = useMemo(() => {
    const c: Record<string, number> = {
      AVAILABLE: 0,
      BUSY: 0,
      OFFLINE: 0,
      ON_BREAK: 0,
      ON_LEAVE: 0,
    };
    partners.forEach((p) => {
      if (c[p.availability_status] != null) c[p.availability_status]++;
    });
    return c;
  }, [partners]);

  const hubWiseSummary = useMemo(() => {
    const map: Record<
      string,
      { total: number; available: number; busy: number; offline: number }
    > = {};
    partners.forEach((p) => {
      const hub = p.primary_hub || 'Unassigned';
      if (!map[hub]) {
        map[hub] = { total: 0, available: 0, busy: 0, offline: 0 };
      }
      map[hub].total++;
      if (p.availability_status === 'AVAILABLE') map[hub].available++;
      else if (p.availability_status === 'BUSY') map[hub].busy++;
      else map[hub].offline++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [partners]);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      if (hubFilter !== 'ALL' && p.primary_hub !== hubFilter) return false;
      if (availFilter !== 'ALL' && p.availability_status !== availFilter)
        return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !p.legal_name.toLowerCase().includes(q) &&
          !p.partner_code.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [partners, hubFilter, availFilter, search]);

  if (loading) {
    return <div style={styles.state}>Loading coverage…</div>;
  }

  if (notConfigured) {
    return (
      <div style={styles.state}>
        <strong>Not configured:</strong> {notConfigured}
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

  return (
    <div style={styles.root}>
      {/* Availability summary */}
      <div style={styles.summaryRow}>
        {Object.entries(availabilityCounts).map(([status, count]) => (
          <div key={status} style={styles.summaryCard}>
            <div
              style={{
                ...styles.statusDot,
                background: AVAILABILITY_COLORS[status] ?? '#6b7280',
              }}
            />
            <div>
              <div style={styles.summaryLabel}>
                {status.replace('_', ' ')}
              </div>
              <div style={styles.summaryValue}>{count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Hub-wise summary */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Hub-wise Coverage</div>
        {hubWiseSummary.length === 0 ? (
          <div style={styles.emptySmall}>No hubs assigned yet.</div>
        ) : (
          <div style={styles.hubGrid}>
            {hubWiseSummary.map(([hub, s]) => (
              <div key={hub} style={styles.hubCard}>
                <div style={styles.hubName}>{hub}</div>
                <div style={styles.hubStats}>
                  <span style={styles.hubStat}>
                    <strong>{s.total}</strong> total
                  </span>
                  <span style={{ ...styles.hubStat, color: '#16a34a' }}>
                    <strong>{s.available}</strong> available
                  </span>
                  <span style={{ ...styles.hubStat, color: '#f59e0b' }}>
                    <strong>{s.busy}</strong> busy
                  </span>
                  <span style={{ ...styles.hubStat, color: '#6b7280' }}>
                    <strong>{s.offline}</strong> offline
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="Search name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={hubFilter}
          onChange={(e) => setHubFilter(e.target.value)}
        >
          <option value="ALL">All Hubs</option>
          {hubs.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          style={styles.select}
          value={availFilter}
          onChange={(e) => setAvailFilter(e.target.value)}
        >
          <option value="ALL">All Availability</option>
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
          <option value="OFFLINE">Offline</option>
          <option value="ON_BREAK">On Break</option>
          <option value="ON_LEAVE">On Leave</option>
        </select>
        <button style={styles.refreshBtn} onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Partners list */}
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
                <Th>City</Th>
                <Th>Availability</Th>
                <Th>Last Active</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <strong>{p.legal_name}</strong>
                  </Td>
                  <Td>
                    <code style={{ fontSize: 12 }}>{p.partner_code}</code>
                  </Td>
                  <Td>{p.primary_hub ?? '—'}</Td>
                  <Td>{p.city ?? '—'}</Td>
                  <Td>
                    <span
                      style={{
                        ...styles.availChip,
                        background:
                          (AVAILABILITY_COLORS[p.availability_status] ??
                            '#6b7280') + '22',
                        color:
                          AVAILABILITY_COLORS[p.availability_status] ??
                          '#6b7280',
                      }}
                    >
                      {p.availability_status.replace('_', ' ')}
                    </span>
                  </Td>
                  <Td>{p.last_active_at ?? '—'}</Td>
                  <Td>
                    <button
                      style={styles.smallBtn}
                      onClick={() => onPartnerSelect?.(p.id)}
                      disabled={!onPartnerSelect}
                    >
                      View 360°
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function Th({ children }: { children: ReactNode }) {
  return <th style={styles.th}>{children}</th>;
}
function Td({ children }: { children: ReactNode }) {
  return <td style={styles.td}>{children}</td>;
}

/* -------------------- Styles -------------------- */

const styles: Record<string, CSSProperties> = {
  root: { padding: 4 },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    flexShrink: 0,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: 700,
  },
  summaryValue: { fontSize: 20, fontWeight: 700, color: '#111827' },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  emptySmall: {
    padding: 16,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
    border: '1px dashed #e5e7eb',
    borderRadius: 8,
    background: '#fff',
  },
  hubGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 10,
  },
  hubCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  hubName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 6,
  },
  hubStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    fontSize: 12,
    color: '#374151',
  },
  hubStat: { color: '#374151' },
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
  availChip: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
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
};