import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import type { PartnerRow, PartnerTab } from '../../../../types/partner';
import { fetchPartners } from '../../../../services/partnerApi';

/* ============================================================
   ONBOARDING PIPELINE TAB
   Shows partners in REGISTERED, ONBOARDING, CHANGES_REQUESTED
   ============================================================ */

export interface OnboardingPipelineTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

const ONBOARDING_STATUSES = ['REGISTERED', 'ONBOARDING', 'CHANGES_REQUESTED'];

export default function OnboardingPipelineTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: OnboardingPipelineTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  const apiOpts = useMemo(
    () => ({ baseUrl: apiBase, authToken }),
    [apiBase, authToken]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        ONBOARDING_STATUSES.map((s) =>
          fetchPartners({ lifecycle: s, limit: 50 }, apiOpts)
        )
      );
      const merged: PartnerRow[] = [];
      results.forEach((r) => {
        const items = Array.isArray(r) ? r : r.items ?? [];
        merged.push(...items);
      });
      setPartners(merged);
      setNotConfigured(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg === 'Not configured') {
        setNotConfigured('Onboarding API not configured yet.');
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

  // Group by status for pipeline view
  const grouped = useMemo(() => {
    const g: Record<string, PartnerRow[]> = {
      REGISTERED: [],
      ONBOARDING: [],
      CHANGES_REQUESTED: [],
    };
    partners.forEach((p) => {
      if (g[p.lifecycle_status]) {
        g[p.lifecycle_status].push(p);
      }
    });
    return g;
  }, [partners]);

  if (loading) {
    return <div style={styles.state}>Loading onboarding pipeline…</div>;
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

  if (partners.length === 0) {
    return (
      <div style={styles.state}>
        <h3 style={{ margin: 0 }}>No partners in onboarding</h3>
        <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
          When new partners register, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <div style={styles.columns}>
        <PipelineColumn
          title="Registered"
          status="REGISTERED"
          rows={grouped.REGISTERED}
          onSelect={onPartnerSelect}
        />
        <PipelineColumn
          title="Onboarding"
          status="ONBOARDING"
          rows={grouped.ONBOARDING}
          onSelect={onPartnerSelect}
        />
        <PipelineColumn
          title="Changes Requested"
          status="CHANGES_REQUESTED"
          rows={grouped.CHANGES_REQUESTED}
          onSelect={onPartnerSelect}
        />
      </div>
    </div>
  );
}

function PipelineColumn({
  title,
  status,
  rows,
  onSelect,
}: {
  title: string;
  status: string;
  rows: PartnerRow[];
  onSelect?: (id: string) => void;
}) {
  return (
    <div style={styles.column}>
      <div style={styles.columnHeader}>
        <span style={styles.columnTitle}>{title}</span>
        <span style={styles.columnCount}>{rows.length}</span>
      </div>
      <div style={styles.columnBody}>
        {rows.length === 0 && (
          <div style={styles.emptyCard}>No partners</div>
        )}
        {rows.map((p) => (
          <div
            key={p.id}
            style={styles.card}
            onClick={() => onSelect?.(p.id)}
          >
            <div style={styles.cardName}>{p.legal_name}</div>
            <div style={styles.cardMeta}>{p.mobile_masked}</div>
            <div style={styles.cardMeta}>
              <code style={{ fontSize: 11 }}>{p.partner_code}</code>
            </div>
            <div style={styles.progressOuter}>
              <div
                style={{
                  ...styles.progressInner,
                  width: `${Math.max(0, Math.min(100, p.onboarding_percent))}%`,
                }}
              />
            </div>
            <div style={styles.cardMeta}>
              Onboarding: {p.onboarding_percent}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Styles -------------------- */

const styles: Record<string, CSSProperties> = {
  root: { padding: 4 },
  columns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 14,
  },
  column: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 200,
  },
  columnHeader: {
    padding: '10px 14px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  columnCount: {
    fontSize: 11,
    fontWeight: 700,
    background: '#e5e7eb',
    color: '#374151',
    padding: '2px 8px',
    borderRadius: 999,
  },
  columnBody: {
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  emptyCard: {
    padding: 16,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
    border: '1px dashed #e5e7eb',
    borderRadius: 6,
  },
  card: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 10,
    cursor: 'pointer',
    transition: 'box-shadow .15s',
  },
  cardName: { fontWeight: 600, fontSize: 13, marginBottom: 2 },
  cardMeta: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  progressOuter: {
    width: '100%',
    height: 5,
    background: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
    margin: '6px 0 4px',
  },
  progressInner: {
    height: '100%',
    background: '#2563eb',
    transition: 'width .2s',
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
};