import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { PartnerRow } from '../../../../types/partner';
import { fetchPartners } from '../../../../services/partnerApi';

/* ============================================================
   TRAINING & CERTIFICATION TAB — COMPLETE
   - Training modules (SOP, safety, category-specific)
   - Partner training assignments
   - Quiz & practical assessment tracking
   - Certificate expiry ladder
   - Two view modes: by partner / by module
   - Detail drawer
   ============================================================ */

export interface TrainingTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

type ViewMode = 'by-partner' | 'by-module';
type SortKey = 'name' | 'code' | 'progress' | 'expiring';
type TrainingStatus =
  | 'NOT_ASSIGNED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PASSED'
  | 'FAILED'
  | 'EXPIRED';

interface TrainingModule {
  id: string;
  name: string;
  category: string;
  type: 'SOP' | 'SAFETY' | 'CATEGORY' | 'APP' | 'BEHAVIOUR';
  duration_min: number;
  mandatory: boolean;
  pass_mark: number;
  max_attempts: number;
  practical_required: boolean;
}

interface PartnerTraining {
  partner_id: string;
  partner_code: string;
  partner_name: string;
  module_id: string;
  module_name: string;
  status: TrainingStatus;
  score?: number;
  attempts: number;
  assigned_at?: string;
  completed_at?: string;
  cert_expires_at?: string;
  practical_passed?: boolean;
}

/* -------------------- Starter module seed -------------------- */

const STARTER_MODULES: TrainingModule[] = [
  {
    id: 'mod-1',
    name: 'Company SOP Basics',
    category: 'All',
    type: 'SOP',
    duration_min: 45,
    mandatory: true,
    pass_mark: 70,
    max_attempts: 3,
    practical_required: false,
  },
  {
    id: 'mod-2',
    name: 'Customer Behaviour & Safety',
    category: 'All',
    type: 'BEHAVIOUR',
    duration_min: 30,
    mandatory: true,
    pass_mark: 70,
    max_attempts: 3,
    practical_required: false,
  },
  {
    id: 'mod-3',
    name: 'Chemical Handling & Safety',
    category: 'All',
    type: 'SAFETY',
    duration_min: 60,
    mandatory: true,
    pass_mark: 80,
    max_attempts: 2,
    practical_required: true,
  },
  {
    id: 'mod-4',
    name: 'App Usage & Job Lifecycle',
    category: 'All',
    type: 'APP',
    duration_min: 25,
    mandatory: true,
    pass_mark: 70,
    max_attempts: 3,
    practical_required: false,
  },
  {
    id: 'mod-5',
    name: 'Home / Deep Cleaning SOP',
    category: 'Home / Deep Cleaning',
    type: 'CATEGORY',
    duration_min: 90,
    mandatory: true,
    pass_mark: 75,
    max_attempts: 2,
    practical_required: true,
  },
  {
    id: 'mod-6',
    name: 'Bathroom Cleaning SOP',
    category: 'Bathroom Cleaning',
    type: 'CATEGORY',
    duration_min: 60,
    mandatory: true,
    pass_mark: 75,
    max_attempts: 2,
    practical_required: true,
  },
  {
    id: 'mod-7',
    name: 'Kitchen Cleaning SOP',
    category: 'Kitchen Cleaning',
    type: 'CATEGORY',
    duration_min: 60,
    mandatory: true,
    pass_mark: 75,
    max_attempts: 2,
    practical_required: true,
  },
  {
    id: 'mod-8',
    name: 'Sofa & Upholstery Cleaning',
    category: 'Sofa Cleaning',
    type: 'CATEGORY',
    duration_min: 75,
    mandatory: true,
    pass_mark: 75,
    max_attempts: 2,
    practical_required: true,
  },
  {
    id: 'mod-9',
    name: 'Carpet & Extraction Cleaning',
    category: 'Carpet Cleaning',
    type: 'CATEGORY',
    duration_min: 90,
    mandatory: true,
    pass_mark: 75,
    max_attempts: 2,
    practical_required: true,
  },
  {
    id: 'mod-10',
    name: 'Single-Disc Machine Operation',
    category: 'Single-Disc Machine Cleaning',
    type: 'CATEGORY',
    duration_min: 120,
    mandatory: true,
    pass_mark: 80,
    max_attempts: 2,
    practical_required: true,
  },
];

/* -------------------- Labels + tones -------------------- */

const STATUS_LABELS: Record<TrainingStatus, string> = {
  NOT_ASSIGNED: 'Not Assigned',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  PASSED: 'Passed',
  FAILED: 'Failed',
  EXPIRED: 'Expired',
};

function statusTone(status: TrainingStatus): CSSProperties {
  switch (status) {
    case 'PASSED':
      return styles.statusPassed;
    case 'IN_PROGRESS':
    case 'ASSIGNED':
      return styles.statusProgress;
    case 'FAILED':
      return styles.statusFailed;
    case 'EXPIRED':
      return styles.statusExpired;
    case 'NOT_ASSIGNED':
    default:
      return styles.statusNotAssigned;
  }
}

function moduleTypeTone(type: TrainingModule['type']): CSSProperties {
  switch (type) {
    case 'SOP':
      return styles.typeSop;
    case 'SAFETY':
      return styles.typeSafety;
    case 'CATEGORY':
      return styles.typeCategory;
    case 'APP':
      return styles.typeApp;
    case 'BEHAVIOUR':
      return styles.typeBehaviour;
    default:
      return styles.typeSop;
  }
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function TrainingTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: TrainingTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>('by-partner');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [moduleTypeFilter, setModuleTypeFilter] = useState<string>('ALL');

  const [selectedPartner, setSelectedPartner] = useState<PartnerRow | null>(
    null
  );
  const [assignFor, setAssignFor] = useState<PartnerRow | null>(null);

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
        setNotConfigured('Training API not configured yet.');
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

  /* -------------------- Derived: per-partner training (seed) -------------------- */

  const partnerTrainings = useMemo<Record<string, PartnerTraining[]>>(() => {
    const map: Record<string, PartnerTraining[]> = {};
    partners.forEach((p, idx) => {
      // Deterministic seed based on partner index for visual consistency
      const modules = STARTER_MODULES.slice(0, 6 + (idx % 4));
      const rows: PartnerTraining[] = modules.map((m, i) => {
        const status: TrainingStatus =
          i < 2 ? 'PASSED' : i < 3 ? 'IN_PROGRESS' : i < 4 ? 'ASSIGNED' : 'NOT_ASSIGNED';
        return {
          partner_id: p.id,
          partner_code: p.partner_code,
          partner_name: p.legal_name,
          module_id: m.id,
          module_name: m.name,
          status,
          score: status === 'PASSED' ? 80 + (i % 15) : undefined,
          attempts: status === 'PASSED' ? 1 : status === 'IN_PROGRESS' ? 1 : 0,
          practical_passed: m.practical_required && status === 'PASSED',
          cert_expires_at:
            status === 'PASSED'
              ? new Date(Date.now() + 300 * 86400000).toISOString()
              : undefined,
        };
      });
      map[p.id] = rows;
    });
    return map;
  }, [partners]);

  /* -------------------- Derived: Summary -------------------- */

  const summary = useMemo(() => {
    let total = 0;
    let passed = 0;
    let inProgress = 0;
    let assigned = 0;
    let notAssigned = 0;
    let failed = 0;
    let expired = 0;
    let certsExpiring30d = 0;

    const now = Date.now();
    const thirty = 30 * 86400000;

    Object.values(partnerTrainings).forEach((rows) => {
      rows.forEach((r) => {
        total++;
        if (r.status === 'PASSED') passed++;
        else if (r.status === 'IN_PROGRESS') inProgress++;
        else if (r.status === 'ASSIGNED') assigned++;
        else if (r.status === 'NOT_ASSIGNED') notAssigned++;
        else if (r.status === 'FAILED') failed++;
        else if (r.status === 'EXPIRED') expired++;

        if (r.cert_expires_at) {
          const t = new Date(r.cert_expires_at).getTime();
          if (!Number.isNaN(t) && t - now < thirty && t > now) {
            certsExpiring30d++;
          }
        }
      });
    });

    const compliance = total > 0 ? Math.round((passed / total) * 100) : 0;

    return {
      total,
      passed,
      inProgress,
      assigned,
      notAssigned,
      failed,
      expired,
      certsExpiring30d,
      compliance,
    };
  }, [partnerTrainings]);

  /* -------------------- Derived: Module-wise summary -------------------- */

  const moduleSummary = useMemo(() => {
    const map: Record<
      string,
      {
        module: TrainingModule;
        total: number;
        passed: number;
        inProgress: number;
        assigned: number;
        notAssigned: number;
        failed: number;
        expired: number;
      }
    > = {};

    STARTER_MODULES.forEach((m) => {
      map[m.id] = {
        module: m,
        total: 0,
        passed: 0,
        inProgress: 0,
        assigned: 0,
        notAssigned: 0,
        failed: 0,
        expired: 0,
      };
    });

    Object.values(partnerTrainings).forEach((rows) => {
      rows.forEach((r) => {
        const bucket = map[r.module_id];
        if (!bucket) return;
        bucket.total++;
        if (r.status === 'PASSED') bucket.passed++;
        else if (r.status === 'IN_PROGRESS') bucket.inProgress++;
        else if (r.status === 'ASSIGNED') bucket.assigned++;
        else if (r.status === 'NOT_ASSIGNED') bucket.notAssigned++;
        else if (r.status === 'FAILED') bucket.failed++;
        else if (r.status === 'EXPIRED') bucket.expired++;
      });
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [partnerTrainings]);

  /* -------------------- Derived: Filtered partners -------------------- */

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

    if (statusFilter !== 'ALL') {
      list = list.filter((p) => {
        const rows = partnerTrainings[p.id] ?? [];
        return rows.some((r) => r.status === statusFilter);
      });
    }

    if (sortBy === 'name') {
      list.sort((a, b) => a.legal_name.localeCompare(b.legal_name));
    } else if (sortBy === 'code') {
      list.sort((a, b) => a.partner_code.localeCompare(b.partner_code));
    } else if (sortBy === 'progress') {
      list.sort((a, b) => {
        const ra = partnerTrainings[a.id] ?? [];
        const rb = partnerTrainings[b.id] ?? [];
        const pa = ra.length ? ra.filter((x) => x.status === 'PASSED').length / ra.length : 0;
        const pb = rb.length ? rb.filter((x) => x.status === 'PASSED').length / rb.length : 0;
        return pb - pa;
      });
    } else if (sortBy === 'expiring') {
      list.sort((a, b) => {
        const ra = partnerTrainings[a.id] ?? [];
        const rb = partnerTrainings[b.id] ?? [];
        const ca = ra.filter((x) => x.cert_expires_at).length;
        const cb = rb.filter((x) => x.cert_expires_at).length;
        return cb - ca;
      });
    }

    return list;
  }, [partners, search, sortBy, statusFilter, partnerTrainings]);

  /* -------------------- Filtered modules -------------------- */

  const filteredModules = useMemo(() => {
    if (moduleTypeFilter === 'ALL') return moduleSummary;
    return moduleSummary.filter((m) => m.module.type === moduleTypeFilter);
  }, [moduleSummary, moduleTypeFilter]);

  /* -------------------- Render states -------------------- */

  if (loading) {
    return <div style={styles.state}>Loading training & certification…</div>;
  }

  if (notConfigured) {
    return (
      <div style={styles.state}>
        <strong>Not configured:</strong> {notConfigured}
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 12 }}>
          Connect the training API to see live module assignments.
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
          label="Total Assignments"
          value={String(summary.total)}
          sub="partner × module"
          tone="info"
        />
        <SummaryCard
          label="Passed"
          value={String(summary.passed)}
          sub={`${summary.compliance}% compliance`}
          tone="success"
        />
        <SummaryCard
          label="In Progress"
          value={String(summary.inProgress)}
          sub="learning"
          tone="info"
        />
        <SummaryCard
          label="Assigned"
          value={String(summary.assigned)}
          sub="not started"
          tone="warning"
        />
        <SummaryCard
          label="Not Assigned"
          value={String(summary.notAssigned)}
          sub="gap"
          tone="warning"
        />
        <SummaryCard
          label="Failed / Expired"
          value={String(summary.failed + summary.expired)}
          sub="needs action"
          tone="danger"
        />
        <SummaryCard
          label="Certs Expiring (30d)"
          value={String(summary.certsExpiring30d)}
          sub="renewal window"
          tone="danger"
        />
      </div>

      {/* View toggle */}
      <div style={styles.viewBar}>
        <button
          style={view === 'by-partner' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => setView('by-partner')}
        >
          By Partner
        </button>
        <button
          style={view === 'by-module' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => setView('by-module')}
        >
          By Module
        </button>
        <button style={styles.refreshBtn} onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {view === 'by-partner' && (
        <>
          <div style={styles.filterBar}>
            <input
              style={styles.searchInput}
              placeholder="Search name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              style={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PASSED">Passed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="NOT_ASSIGNED">Not Assigned</option>
              <option value="FAILED">Failed</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <select
              style={styles.select}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
            >
              <option value="name">Sort: Name</option>
              <option value="code">Sort: Code</option>
              <option value="progress">Sort: Progress</option>
              <option value="expiring">Sort: Certs Expiring</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={styles.state}>
              <h3 style={{ margin: 0 }}>No partners match</h3>
              <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
                Try changing filters or search.
              </p>
            </div>
          ) : (
            <div style={styles.partnerList}>
              {filtered.map((p) => {
                const rows = partnerTrainings[p.id] ?? [];
                return (
                  <PartnerTrainingCard
                    key={p.id}
                    partner={p}
                    rows={rows}
                    onOpen={() => setSelectedPartner(p)}
                    onAssign={() => setAssignFor(p)}
                    onView360={() => onPartnerSelect?.(p.id)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {view === 'by-module' && (
        <>
          <div style={styles.filterBar}>
            <select
              style={styles.select}
              value={moduleTypeFilter}
              onChange={(e) => setModuleTypeFilter(e.target.value)}
            >
              <option value="ALL">All Module Types</option>
              <option value="SOP">SOP</option>
              <option value="SAFETY">Safety</option>
              <option value="CATEGORY">Category</option>
              <option value="APP">App</option>
              <option value="BEHAVIOUR">Behaviour</option>
            </select>
          </div>

          <ModuleSummaryView items={filteredModules} />
        </>
      )}

      {/* Footer note */}
      <div style={styles.footerNote}>
        <strong>Note:</strong> Training compliance feeds dispatch eligibility.
        Overdue training escalates automatically via the Automation Agent
        (PM-A5). Certificates have a validity period and re-certification date.
      </div>

      {/* Detail drawer */}
      {selectedPartner && (
        <PartnerTrainingDrawer
          partner={selectedPartner}
          rows={partnerTrainings[selectedPartner.id] ?? []}
          onClose={() => setSelectedPartner(null)}
        />
      )}

      {/* Assign module wizard */}
      {assignFor && (
        <AssignModuleWizard
          partner={assignFor}
          existing={partnerTrainings[assignFor.id] ?? []}
          onClose={() => setAssignFor(null)}
        />
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
   PartnerTrainingCard
   ============================================================ */

function PartnerTrainingCard({
  partner,
  rows,
  onOpen,
  onAssign,
  onView360,
}: {
  partner: PartnerRow;
  rows: PartnerTraining[];
  onOpen: () => void;
  onAssign: () => void;
  onView360: () => void;
}) {
  const passed = rows.filter((r) => r.status === 'PASSED').length;
  const inProgress = rows.filter(
    (r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED'
  ).length;
  const pending = rows.filter((r) => r.status === 'NOT_ASSIGNED').length;
  const compliance = rows.length
    ? Math.round((passed / rows.length) * 100)
    : 0;

  return (
    <div style={styles.partnerCard}>
      <div style={styles.partnerHeader}>
        <div>
          <div style={styles.partnerName}>{partner.legal_name}</div>
          <div style={styles.partnerMeta}>
            {partner.partner_code} · {partner.primary_hub ?? 'No hub'}
          </div>
        </div>
        <div style={styles.partnerStats}>
          <span style={styles.statPill}>
            <strong>{rows.length}</strong> modules
          </span>
          <span style={{ ...styles.statPill, color: '#166534' }}>
            <strong>{passed}</strong> passed
          </span>
          <span style={{ ...styles.statPill, color: '#1d4ed8' }}>
            <strong>{inProgress}</strong> active
          </span>
          <span style={{ ...styles.statPill, color: '#92400e' }}>
            <strong>{pending}</strong> pending
          </span>
        </div>
      </div>

      <div style={styles.progressLine}>
        <div style={styles.progressOuter}>
          <div
            style={{
              ...styles.progressInner,
              width: `${compliance}%`,
              background:
                compliance >= 75
                  ? '#16a34a'
                  : compliance >= 50
                  ? '#f59e0b'
                  : '#dc2626',
            }}
          />
        </div>
        <span style={styles.progressLabel}>{compliance}% compliance</span>
      </div>

      <div style={styles.serviceChips}>
        {rows.length === 0 ? (
          <span style={styles.emptyChip}>No modules assigned yet</span>
        ) : (
          rows.map((r) => (
            <button key={r.module_id} style={styles.moduleChipBtn} onClick={onOpen}>
              <span style={statusTone(r.status)}>{STATUS_LABELS[r.status]}</span>
              <span style={styles.moduleChipName}>{r.module_name}</span>
              {r.score != null && (
                <span style={styles.scoreChip}>{r.score}%</span>
              )}
            </button>
          ))
        )}
      </div>

      <div style={styles.partnerActions}>
        <button style={styles.smallBtn} onClick={onAssign}>
          + Assign Module
        </button>
        <button style={styles.smallBtnGhost} onClick={onOpen}>
          Open Detail
        </button>
        <button style={styles.smallBtnGhost} onClick={onView360}>
          View 360°
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   ModuleSummaryView
   ============================================================ */

function ModuleSummaryView({
  items,
}: {
  items: {
    module: TrainingModule;
    total: number;
    passed: number;
    inProgress: number;
    assigned: number;
    notAssigned: number;
    failed: number;
    expired: number;
  }[];
}) {
  if (items.length === 0) {
    return (
      <div style={styles.state}>
        <h3 style={{ margin: 0 }}>No modules</h3>
        <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
          Configure training modules first.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.moduleGrid}>
      {items.map((m) => {
        const compliance = m.total
          ? Math.round((m.passed / m.total) * 100)
          : 0;
        return (
          <div key={m.module.id} style={styles.moduleCard}>
            <div style={styles.moduleHeader}>
              <div style={styles.moduleTitle}>{m.module.name}</div>
              <span style={moduleTypeTone(m.module.type)}>
                {m.module.type}
              </span>
            </div>
            <div style={styles.moduleMeta}>
              {m.module.category} · {m.module.duration_min} min · pass{' '}
              {m.module.pass_mark}% · attempts {m.module.max_attempts}
              {m.module.practical_required && ' · practical required'}
            </div>

            <div style={styles.moduleStats}>
              <div>
                <div style={styles.moduleStatLabel}>Total</div>
                <div style={styles.moduleStatValue}>{m.total}</div>
              </div>
              <div>
                <div style={styles.moduleStatLabel}>Passed</div>
                <div style={{ ...styles.moduleStatValue, color: '#166534' }}>
                  {m.passed}
                </div>
              </div>
              <div>
                <div style={styles.moduleStatLabel}>Active</div>
                <div style={{ ...styles.moduleStatValue, color: '#1d4ed8' }}>
                  {m.inProgress + m.assigned}
                </div>
              </div>
              <div>
                <div style={styles.moduleStatLabel}>Pending</div>
                <div style={{ ...styles.moduleStatValue, color: '#92400e' }}>
                  {m.notAssigned}
                </div>
              </div>
              <div>
                <div style={styles.moduleStatLabel}>Failed/Exp</div>
                <div style={{ ...styles.moduleStatValue, color: '#991b1b' }}>
                  {m.failed + m.expired}
                </div>
              </div>
            </div>

            <div style={styles.categoryBar}>
              <div
                style={{
                  ...styles.categoryBarFill,
                  width: `${compliance}%`,
                  background:
                    compliance >= 75
                      ? '#16a34a'
                      : compliance >= 50
                      ? '#f59e0b'
                      : '#dc2626',
                }}
              />
            </div>
            <div style={styles.categoryBarLabel}>
              {compliance}% compliance
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   PartnerTrainingDrawer
   ============================================================ */

function PartnerTrainingDrawer({
  partner,
  rows,
  onClose,
}: {
  partner: PartnerRow;
  rows: PartnerTraining[];
  onClose: () => void;
}) {
  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{partner.legal_name}</div>
            <div style={styles.drawerSub}>
              {partner.partner_code} · {rows.length} modules
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.drawerBody}>
          {rows.length === 0 ? (
            <div style={styles.drawerState}>
              No training modules assigned yet.
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <Th>Module</Th>
                    <Th>Status</Th>
                    <Th>Score</Th>
                    <Th>Attempts</Th>
                    <Th>Completed</Th>
                    <Th>Cert Expires</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.module_id}>
                      <Td>
                        <strong>{r.module_name}</strong>
                        {r.practical_passed != null && (
                          <div style={{ fontSize: 11, color: '#6b7280' }}>
                            Practical:{' '}
                            {r.practical_passed ? 'Passed' : 'Pending'}
                          </div>
                        )}
                      </Td>
                      <Td>
                        <span style={statusTone(r.status)}>
                          {STATUS_LABELS[r.status]}
                        </span>
                      </Td>
                      <Td>{r.score != null ? `${r.score}%` : '—'}</Td>
                      <Td>{r.attempts}</Td>
                      <Td>{formatDate(r.completed_at)}</Td>
                      <Td>{formatDate(r.cert_expires_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.drawerFooter}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            New SOP versions auto-assign delta modules. Overdue training
            escalates to hub lead.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   AssignModuleWizard
   ============================================================ */

function AssignModuleWizard({
  partner,
  existing,
  onClose,
}: {
  partner: PartnerRow;
  existing: PartnerTraining[];
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  const existingIds = existing.map((r) => r.module_id);

  const availableModules = STARTER_MODULES.filter(
    (m) => !existingIds.includes(m.id)
  );

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div
        style={{ ...styles.drawer, width: 'min(600px, 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>Assign Training Modules</div>
            <div style={styles.drawerSub}>
              {partner.legal_name} · {partner.partner_code}
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.stepRow}>
            <span style={step >= 1 ? styles.stepActive : styles.step}>
              1. Select Modules
            </span>
            <span style={step >= 2 ? styles.stepActive : styles.step}>
              2. Set Due Date
            </span>
            <span style={step >= 3 ? styles.stepActive : styles.step}>
              3. Confirm
            </span>
          </div>

          {step === 1 && (
            <div>
              <div style={styles.fieldLabel}>
                Available Modules ({availableModules.length})
              </div>
              {availableModules.length === 0 ? (
                <div style={styles.drawerState}>
                  All modules already assigned to this partner.
                </div>
              ) : (
                <div style={styles.modulePickList}>
                  {availableModules.map((m) => (
                    <label key={m.id} style={styles.modulePickRow}>
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(m.id)}
                        onChange={() => toggleModule(m.id)}
                        style={{ marginRight: 10 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={styles.modulePickName}>{m.name}</div>
                        <div style={styles.modulePickMeta}>
                          {m.category} · {m.type} · {m.duration_min} min · pass{' '}
                          {m.pass_mark}%
                        </div>
                      </div>
                      <span style={moduleTypeTone(m.type)}>{m.type}</span>
                    </label>
                  ))}
                </div>
              )}
              <div style={styles.wizardActions}>
                <button
                  style={styles.primaryBtn}
                  disabled={selectedModules.length === 0}
                  onClick={() => setStep(2)}
                >
                  Next: Set Due Date
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={styles.fieldLabel}>Due Date (optional)</div>
              <input
                type="date"
                style={styles.dateInput}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <div style={styles.infoBox}>
                If no due date is set, the default SOP-recommended timeline will
                be used. Reminders and escalations follow PM-A5 rule.
              </div>
              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(1)}>
                  Back
                </button>
                <button style={styles.primaryBtn} onClick={() => setStep(3)}>
                  Next: Confirm
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={styles.fieldLabel}>Confirm Assignment</div>
              <div style={styles.confirmBox}>
                <div>
                  <strong>Partner:</strong> {partner.legal_name}
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Modules:</strong> {selectedModules.length}
                </div>
                <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 13 }}>
                  {selectedModules.map((id) => {
                    const m = STARTER_MODULES.find((x) => x.id === id);
                    return <li key={id}>{m?.name}</li>;
                  })}
                </ul>
                {dueDate && (
                  <div style={{ marginTop: 6 }}>
                    <strong>Due:</strong> {dueDate}
                  </div>
                )}
              </div>

              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(2)}>
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
            Assignment will trigger a notification once API is wired.
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
    fontSize: 20,
    fontWeight: 800,
    marginTop: 4,
    marginBottom: 2,
  },

  /* View toggle */
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
  dateInput: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
    marginBottom: 16,
    width: '100%',
  },

  /* Partner list */
  partnerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  partnerCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 14,
  },
  partnerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  partnerName: { fontSize: 15, fontWeight: 700, color: '#111827' },
  partnerMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  partnerStats: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    fontSize: 11,
    background: '#f3f4f6',
    color: '#374151',
    padding: '3px 10px',
    borderRadius: 999,
    fontWeight: 700,
  },

  /* Progress line */
  progressLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  progressOuter: {
    flex: 1,
    height: 6,
    background: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    transition: 'width .3s',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },

  /* Module chips */
  serviceChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  moduleChipBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 12,
  },
  moduleChipName: {
    fontWeight: 700,
    color: '#111827',
    fontSize: 12,
  },
  scoreChip: {
    fontSize: 10,
    fontWeight: 800,
    background: '#111827',
    color: '#fff',
    padding: '1px 6px',
    borderRadius: 4,
  },
  emptyChip: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },

  /* Actions */
  partnerActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  smallBtn: {
    padding: '6px 12px',
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
  },
  smallBtnGhost: {
    padding: '6px 12px',
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
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

  /* Status chips */
  statusPassed: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusProgress: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusFailed: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusExpired: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusNotAssigned: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },

  /* Module types */
  typeSop: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#ede9fe',
    color: '#5b21b6',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  typeSafety: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  typeCategory: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  typeApp: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  typeBehaviour: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },

  /* Module summary grid */
  moduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
  },
  moduleCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 14,
  },
  moduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#111827',
    flex: 1,
  },
  moduleMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 10,
  },
  moduleStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
    marginBottom: 10,
  },
  moduleStatLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  moduleStatValue: {
    fontSize: 16,
    fontWeight: 800,
    color: '#111827',
    marginTop: 2,
  },

  /* Bars */
  categoryBar: {
    height: 6,
    background: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    background: '#16a34a',
    transition: 'width .3s',
  },
  categoryBarLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
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
    marginTop: 14,
    padding: '10px 14px',
    background: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: 6,
    fontSize: 12,
    color: '#6b7280',
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
  drawerFooter: {
    padding: '10px 20px',
    borderTop: '1px solid #e5e7eb',
    background: '#fff',
  },

  /* Wizard */
  stepRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    fontSize: 12,
  },
  step: { color: '#9ca3af', fontWeight: 600 },
  stepActive: { color: '#1d4ed8', fontWeight: 800 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  modulePickList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  modulePickRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    background: '#fff',
  },
  modulePickName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
  },
  modulePickMeta: {
    fontSize: 11,
    color: '#6b7280',
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
  },
};