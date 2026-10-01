import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { PartnerRow } from '../../../../types/partner';
import { fetchPartners } from '../../../../services/partnerApi';

/* ============================================================
   PERFORMANCE & QUALITY TAB
   Live performance metrics per partner
   ============================================================ */

export interface PerformanceTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

type SortKey = 'rating' | 'jobs' | 'acceptance' | 'name';

export default function PerformanceTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: PerformanceTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('rating');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');

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
        setNotConfigured('Performance API not configured yet.');
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

  /* ---------------- Derived ---------------- */

  const summary = useMemo(() => {
    const rated = partners.filter((p) => p.rating != null && p.rating_count);
    const avg =
      rated.length > 0
        ? rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length
        : null;
    const totalRatings = rated.reduce(
      (s, p) => s + (p.rating_count ?? 0),
      0
    );
    const below35 = rated.filter((p) => (p.rating ?? 5) < 3.5).length;
    const topPerformers = rated.filter((p) => (p.rating ?? 0) >= 4.5).length;
    return {
      avg: avg != null ? Number(avg.toFixed(2)) : null,
      totalRatings,
      ratedCount: rated.length,
      below35,
      topPerformers,
    };
  }, [partners]);

  const filtered = useMemo(() => {
    let list = [...partners];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.legal_name.toLowerCase().includes(q) ||
          p.partner_code.toLowerCase().includes(q)
      );
    }

    if (ratingFilter === 'BELOW_3_5') {
      list = list.filter((p) => p.rating != null && p.rating < 3.5);
    } else if (ratingFilter === 'TOP') {
      list = list.filter((p) => p.rating != null && p.rating >= 4.5);
    } else if (ratingFilter === 'INSUFFICIENT') {
      list = list.filter((p) => p.rating == null || !p.rating_count);
    }

    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    } else if (sortBy === 'acceptance') {
      list.sort(
        (a, b) => (b.rating_count ?? 0) - (a.rating_count ?? 0)
      );
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.legal_name.localeCompare(b.legal_name));
    }

    return list;
  }, [partners, search, sortBy, ratingFilter]);

  if (loading) {
    return <div style={styles.state}>Loading performance…</div>;
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
      {/* Summary cards */}
      <div style={styles.summaryRow}>
        <SummaryCard
          label="Avg Rating"
          value={
            summary.avg != null
              ? summary.avg.toFixed(2)
              : 'Insufficient data'
          }
          sub={`${summary.ratedCount} rated partners`}
          tone="info"
        />
        <SummaryCard
          label="Total Ratings"
          value={String(summary.totalRatings)}
          sub="sample size"
          tone="info"
        />
        <SummaryCard
          label="Top Performers (≥4.5)"
          value={String(summary.topPerformers)}
          sub="last 30 days"
          tone="success"
        />
        <SummaryCard
          label="Below 3.5"
          value={String(summary.below35)}
          sub="needs attention"
          tone="danger"
        />
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
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
        >
          <option value="ALL">All Partners</option>
          <option value="TOP">Top (≥4.5)</option>
          <option value="BELOW_3_5">Below 3.5</option>
          <option value="INSUFFICIENT">Insufficient data</option>
        </select>
        <select
          style={styles.select}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
        >
          <option value="rating">Sort: Rating</option>
          <option value="acceptance">Sort: Rating Count</option>
          <option value="name">Sort: Name</option>
        </select>
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
                <Th>Rating</Th>
                <Th>Sample</Th>
                <Th>Categories</Th>
                <Th>Onboarding</Th>
                <Th>Lifecycle</Th>
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
                  <Td>
                    {p.rating != null && p.rating_count ? (
                      <span style={ratingChip(p.rating)}>
                        {p.rating.toFixed(1)} ★
                      </span>
                    ) : (
                      <span style={styles.insufficientChip}>
                        Insufficient
                      </span>
                    )}
                  </Td>
                  <Td>{p.rating_count ?? 0}</Td>
                  <Td>{p.categories_count}</Td>
                  <Td>
                    <div style={styles.progressOuter}>
                      <div
                        style={{
                          ...styles.progressInner,
                          width: `${Math.max(
                            0,
                            Math.min(100, p.onboarding_percent)
                          )}%`,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {p.onboarding_percent}%
                    </div>
                  </Td>
                  <Td>
                    <span style={styles.lifecycleChip}>
                      {p.lifecycle_status.replace(/_/g, ' ')}
                    </span>
                  </Td>
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

/* -------------------- Sub-components -------------------- */

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: 'info' | 'success' | 'danger';
}) {
  const bg =
    tone === 'success'
      ? '#f0fdf4'
      : tone === 'danger'
      ? '#fef2f2'
      : '#eff6ff';
  const color =
    tone === 'success'
      ? '#166534'
      : tone === 'danger'
      ? '#991b1b'
      : '#1d4ed8';

  return (
    <div style={{ ...styles.summaryCard, background: bg, borderColor: color + '33' }}>
      <div style={{ ...styles.summaryLabel, color }}>{label}</div>
      <div style={{ ...styles.summaryValue, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color, opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}

function ratingChip(rating: number): CSSProperties {
  if (rating >= 4.5) return styles.ratingGood;
  if (rating >= 3.5) return styles.ratingMid;
  return styles.ratingBad;
}

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
    fontSize: 22,
    fontWeight: 800,
    marginTop: 4,
    marginBottom: 2,
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
  ratingGood: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  ratingMid: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  ratingBad: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  insufficientChip: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },
  lifecycleChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  progressOuter: {
    width: 80,
    height: 6,
    background: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    background: '#2563eb',
    transition: 'width .2s',
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