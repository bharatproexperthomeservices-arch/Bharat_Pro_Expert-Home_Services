import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type {
  PartnerRow,
  PartnerService,
  ServiceStatus,
  SkillLevel,
} from '../../../../types/partner';

import {
  fetchPartners,
  fetchPartnerServices,
} from '../../../../services/partnerApi';

/* ============================================================
   SERVICES & SKILLS TAB — COMPLETE
   - Partner × Category skill matrix
   - Service status (PENDING_TRAINING, PENDING_KIT, READY, ACTIVE, etc.)
   - Skill levels (BEGINNER / INTERMEDIATE / EXPERT)
   - Certificate expiry tracking
   - Add-category wizard (3 steps)
   - Category-wise summary view
   - Partner service detail drawer
   ============================================================ */

export interface ServicesTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

type ViewMode = 'matrix' | 'by-category';
type SortKey = 'name' | 'code' | 'categories' | 'rating';

/* -------------------- Labels -------------------- */

const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  PENDING_TRAINING: 'Pending Training',
  PENDING_KIT: 'Pending Kit',
  READY: 'Ready',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  REVOKED: 'Revoked',
};

const LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  EXPERT: 'Expert',
};

/* -------------------- Tone helpers -------------------- */

function serviceStatusTone(status: ServiceStatus): CSSProperties {
  switch (status) {
    case 'ACTIVE':
      return styles.statusActive;
    case 'READY':
      return styles.statusReady;
    case 'PENDING_TRAINING':
    case 'PENDING_KIT':
      return styles.statusPending;
    case 'PAUSED':
      return styles.statusPaused;
    case 'REVOKED':
      return styles.statusRevoked;
    default:
      return styles.statusPending;
  }
}

function levelTone(level: SkillLevel): CSSProperties {
  switch (level) {
    case 'EXPERT':
      return styles.levelExpert;
    case 'INTERMEDIATE':
      return styles.levelIntermediate;
    case 'BEGINNER':
      return styles.levelBeginner;
    default:
      return styles.levelBeginner;
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

export default function ServicesTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: ServicesTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [servicesByPartner, setServicesByPartner] = useState<
    Record<string, PartnerService[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>('matrix');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedPartner, setSelectedPartner] = useState<PartnerRow | null>(
    null
  );
  const [addCategoryFor, setAddCategoryFor] = useState<PartnerRow | null>(
    null
  );

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

      const map: Record<string, PartnerService[]> = {};
      for (const p of items) {
        try {
          const svcs = await fetchPartnerServices(p.id, apiOpts);
          map[p.id] = svcs ?? [];
        } catch {
          map[p.id] = [];
        }
      }
      setServicesByPartner(map);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg === 'Not configured') {
        setNotConfigured('Services API not configured yet.');
        setPartners([]);
        setServicesByPartner({});
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
    let totalServices = 0;
    let active = 0;
    let pendingTraining = 0;
    let pendingKit = 0;
    let ready = 0;
    let pausedOrRevoked = 0;
    let expiringSoon = 0;

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    Object.values(servicesByPartner).forEach((list) => {
      list.forEach((s) => {
        totalServices++;
        if (s.status === 'ACTIVE') active++;
        else if (s.status === 'PENDING_TRAINING') pendingTraining++;
        else if (s.status === 'PENDING_KIT') pendingKit++;
        else if (s.status === 'READY') ready++;
        else if (s.status === 'PAUSED' || s.status === 'REVOKED')
          pausedOrRevoked++;

        if (s.cert_expires_at) {
          const t = new Date(s.cert_expires_at).getTime();
          if (!Number.isNaN(t) && t - now < thirtyDays && t > now) {
            expiringSoon++;
          }
        }
      });
    });

    return {
      totalServices,
      active,
      pendingTraining,
      pendingKit,
      ready,
      pausedOrRevoked,
      expiringSoon,
    };
  }, [servicesByPartner]);

  /* -------------------- Category summary -------------------- */

  const categorySummary = useMemo(() => {
    const map: Record<
      string,
      {
        category_id: string;
        category_name: string;
        total: number;
        active: number;
        pending: number;
        partners: string[];
      }
    > = {};

    Object.entries(servicesByPartner).forEach(([partnerId, list]) => {
      list.forEach((s) => {
        const key = s.category_id;
        if (!map[key]) {
          map[key] = {
            category_id: s.category_id,
            category_name: s.category_name,
            total: 0,
            active: 0,
            pending: 0,
            partners: [],
          };
        }
        map[key].total++;
        if (s.status === 'ACTIVE') map[key].active++;
        if (s.status === 'PENDING_TRAINING' || s.status === 'PENDING_KIT')
          map[key].pending++;
        if (!map[key].partners.includes(partnerId))
          map[key].partners.push(partnerId);
      });
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [servicesByPartner]);

  /* -------------------- Filtered partners -------------------- */

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
        const svcs = servicesByPartner[p.id] ?? [];
        return svcs.some((s) => s.status === statusFilter);
      });
    }

    if (sortBy === 'name') {
      list.sort((a, b) => a.legal_name.localeCompare(b.legal_name));
    } else if (sortBy === 'code') {
      list.sort((a, b) => a.partner_code.localeCompare(b.partner_code));
    } else if (sortBy === 'categories') {
      list.sort(
        (a, b) => (b.categories_count ?? 0) - (a.categories_count ?? 0)
      );
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    }

    return list;
  }, [partners, search, sortBy, statusFilter, servicesByPartner]);

  /* -------------------- Render states -------------------- */

  if (loading) {
    return <div style={styles.state}>Loading services & skills…</div>;
  }

  if (notConfigured) {
    return (
      <div style={styles.state}>
        <strong>Not configured:</strong> {notConfigured}
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 12 }}>
          Connect the services API to see skill matrix.
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
          label="Total Services"
          value={String(summary.totalServices)}
          sub="partner × category"
          tone="info"
        />
        <SummaryCard
          label="Active"
          value={String(summary.active)}
          sub="dispatchable"
          tone="success"
        />
        <SummaryCard
          label="Pending Training"
          value={String(summary.pendingTraining)}
          sub="training not passed"
          tone="warning"
        />
        <SummaryCard
          label="Pending Kit"
          value={String(summary.pendingKit)}
          sub="matrix incomplete"
          tone="warning"
        />
        <SummaryCard
          label="Ready"
          value={String(summary.ready)}
          sub="awaiting activation"
          tone="info"
        />
        <SummaryCard
          label="Certs Expiring (30d)"
          value={String(summary.expiringSoon)}
          sub="needs renewal"
          tone="danger"
        />
      </div>

      {/* View toggle */}
      <div style={styles.viewBar}>
        <button
          style={view === 'matrix' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => setView('matrix')}
        >
          Skill Matrix (by partner)
        </button>
        <button
          style={view === 'by-category' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => setView('by-category')}
        >
          By Category
        </button>
        <button style={styles.refreshBtn} onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {view === 'matrix' && (
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
              <option value="ACTIVE">Active</option>
              <option value="READY">Ready</option>
              <option value="PENDING_TRAINING">Pending Training</option>
              <option value="PENDING_KIT">Pending Kit</option>
              <option value="PAUSED">Paused</option>
              <option value="REVOKED">Revoked</option>
            </select>
            <select
              style={styles.select}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
            >
              <option value="name">Sort: Name</option>
              <option value="code">Sort: Code</option>
              <option value="categories">Sort: Categories</option>
              <option value="rating">Sort: Rating</option>
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
              {filtered.map((p) => (
                <PartnerServiceCard
                  key={p.id}
                  partner={p}
                  services={servicesByPartner[p.id] ?? []}
                  onOpen={() => setSelectedPartner(p)}
                  onAddCategory={() => setAddCategoryFor(p)}
                  onView360={() => onPartnerSelect?.(p.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === 'by-category' && (
        <CategorySummaryView items={categorySummary} />
      )}

      {/* Footer note */}
      <div style={styles.footerNote}>
        <strong>Note:</strong> Category activation requires training passed,
        practical assessment passed (if configured), and Chemical & Tool Matrix
        satisfied. Status is recomputed on every gate event.
      </div>

      {/* Detail drawer */}
      {selectedPartner && (
        <PartnerServicesDrawer
          partner={selectedPartner}
          services={servicesByPartner[selectedPartner.id] ?? []}
          onClose={() => setSelectedPartner(null)}
        />
      )}

      {/* Add category wizard */}
      {addCategoryFor && (
        <AddCategoryWizard
          partner={addCategoryFor}
          existingServices={servicesByPartner[addCategoryFor.id] ?? []}
          onClose={() => setAddCategoryFor(null)}
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
   PartnerServiceCard
   ============================================================ */

function PartnerServiceCard({
  partner,
  services,
  onOpen,
  onAddCategory,
  onView360,
}: {
  partner: PartnerRow;
  services: PartnerService[];
  onOpen: () => void;
  onAddCategory: () => void;
  onView360: () => void;
}) {
  const activeCount = services.filter((s) => s.status === 'ACTIVE').length;
  const pendingCount = services.filter(
    (s) => s.status === 'PENDING_TRAINING' || s.status === 'PENDING_KIT'
  ).length;

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
            <strong>{services.length}</strong> categories
          </span>
          <span style={{ ...styles.statPill, color: '#166534' }}>
            <strong>{activeCount}</strong> active
          </span>
          <span style={{ ...styles.statPill, color: '#92400e' }}>
            <strong>{pendingCount}</strong> pending
          </span>
        </div>
      </div>

      <div style={styles.serviceChips}>
        {services.length === 0 ? (
          <span style={styles.emptyChip}>No services yet</span>
        ) : (
          services.map((s) => (
            <button key={s.id} style={styles.serviceChipBtn} onClick={onOpen}>
              <span style={serviceStatusTone(s.status)}>
                {SERVICE_STATUS_LABELS[s.status]}
              </span>
              <span style={styles.serviceChipName}>{s.category_name}</span>
              <span style={levelTone(s.level)}>{LEVEL_LABELS[s.level]}</span>
            </button>
          ))
        )}
      </div>

      <div style={styles.partnerActions}>
        <button style={styles.smallBtn} onClick={onAddCategory}>
          + Add Category
        </button>
        <button style={styles.smallBtnGhost} onClick={onOpen}>
          Open Skill Detail
        </button>
        <button style={styles.smallBtnGhost} onClick={onView360}>
          View 360°
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   CategorySummaryView
   ============================================================ */

function CategorySummaryView({
  items,
}: {
  items: {
    category_id: string;
    category_name: string;
    total: number;
    active: number;
    pending: number;
    partners: string[];
  }[];
}) {
  if (items.length === 0) {
    return (
      <div style={styles.state}>
        <h3 style={{ margin: 0 }}>No categories yet</h3>
        <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
          Partners haven't selected any categories yet.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.categoryGrid}>
      {items.map((c) => (
        <div key={c.category_id} style={styles.categoryCard}>
          <div style={styles.categoryTitle}>{c.category_name}</div>
          <div style={styles.categoryStats}>
            <div>
              <div style={styles.categoryStatLabel}>Total</div>
              <div style={styles.categoryStatValue}>{c.total}</div>
            </div>
            <div>
              <div style={styles.categoryStatLabel}>Active</div>
              <div style={{ ...styles.categoryStatValue, color: '#166534' }}>
                {c.active}
              </div>
            </div>
            <div>
              <div style={styles.categoryStatLabel}>Pending</div>
              <div style={{ ...styles.categoryStatValue, color: '#92400e' }}>
                {c.pending}
              </div>
            </div>
            <div>
              <div style={styles.categoryStatLabel}>Partners</div>
              <div style={styles.categoryStatValue}>
                {c.partners.length}
              </div>
            </div>
          </div>
          <div style={styles.categoryBar}>
            <div
              style={{
                ...styles.categoryBarFill,
                width: c.total
                  ? `${Math.round((c.active / c.total) * 100)}%`
                  : '0%',
              }}
            />
          </div>
          <div style={styles.categoryBarLabel}>
            {c.total
              ? `${Math.round((c.active / c.total) * 100)}% active`
              : 'No data'}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   PartnerServicesDrawer
   ============================================================ */

function PartnerServicesDrawer({
  partner,
  services,
  onClose,
}: {
  partner: PartnerRow;
  services: PartnerService[];
  onClose: () => void;
}) {
  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{partner.legal_name}</div>
            <div style={styles.drawerSub}>
              {partner.partner_code} · {services.length} categories
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.drawerBody}>
          {services.length === 0 ? (
            <div style={styles.drawerState}>
              No services yet. Click "+ Add Category" to begin.
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <Th>Category</Th>
                    <Th>Level</Th>
                    <Th>Status</Th>
                    <Th>Certified</Th>
                    <Th>Expires</Th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id}>
                      <Td>
                        <strong>{s.category_name}</strong>
                        {s.service_name && (
                          <div style={{ fontSize: 11, color: '#6b7280' }}>
                            {s.service_name}
                          </div>
                        )}
                      </Td>
                      <Td>
                        <span style={levelTone(s.level)}>
                          {LEVEL_LABELS[s.level]}
                        </span>
                      </Td>
                      <Td>
                        <span style={serviceStatusTone(s.status)}>
                          {SERVICE_STATUS_LABELS[s.status]}
                        </span>
                      </Td>
                      <Td>{formatDate(s.certified_at)}</Td>
                      <Td>{formatDate(s.cert_expires_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.drawerFooter}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            Category activation requires training + practical + matrix
            compliance.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   AddCategoryWizard
   ============================================================ */

function AddCategoryWizard({
  partner,
  existingServices,
  onClose,
}: {
  partner: PartnerRow;
  existingServices: PartnerService[];
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('BEGINNER');

  const existingCategoryIds = existingServices.map((s) => s.category_id);

  const availableCategories = [
    { id: 'home-deep', name: 'Home / Deep Cleaning' },
    { id: 'bathroom', name: 'Bathroom Cleaning' },
    { id: 'kitchen', name: 'Kitchen Cleaning' },
    { id: 'sofa', name: 'Sofa Cleaning' },
    { id: 'carpet', name: 'Carpet Cleaning' },
    { id: 'floor', name: 'Floor Cleaning' },
    { id: 'single-disc', name: 'Single-Disc Machine Cleaning' },
    { id: 'shampoo-extraction', name: 'Shampoo / Extraction Cleaning' },
    { id: 'chimney', name: 'Chimney Cleaning' },
    { id: 'mattress', name: 'Mattress Cleaning' },
    { id: 'water-tank', name: 'Water Tank Cleaning' },
    { id: 'pest-control', name: 'Pest Control' },
  ].filter((c) => !existingCategoryIds.includes(c.id));

  const checks = [
    { key: 'docs', label: 'Required documents verified' },
    { key: 'training', label: 'Training module assigned' },
    { key: 'practical', label: 'Practical assessment scheduled' },
    { key: 'matrix', label: 'Chemical & Tool Matrix items identified' },
  ];

  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div
        style={{ ...styles.drawer, width: 'min(560px, 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>Add Category</div>
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
              1. Select Category
            </span>
            <span style={step >= 2 ? styles.stepActive : styles.step}>
              2. Set Level
            </span>
            <span style={step >= 3 ? styles.stepActive : styles.step}>
              3. Requirements
            </span>
          </div>

          {step === 1 && (
            <div>
              <div style={styles.fieldLabel}>Available Categories</div>
              {availableCategories.length === 0 ? (
                <div style={styles.drawerState}>
                  This partner already has all available categories.
                </div>
              ) : (
                <div style={styles.categoryPickGrid}>
                  {availableCategories.map((c) => (
                    <button
                      key={c.id}
                      style={
                        selectedCategory === c.id
                          ? styles.categoryPickActive
                          : styles.categoryPick
                      }
                      onClick={() => setSelectedCategory(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              <div style={styles.wizardActions}>
                <button
                  style={styles.primaryBtn}
                  disabled={!selectedCategory}
                  onClick={() => setStep(2)}
                >
                  Next: Set Level
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={styles.fieldLabel}>Self-declared Skill Level</div>
              <div style={styles.levelPickRow}>
                {(['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as SkillLevel[]).map(
                  (lv) => (
                    <button
                      key={lv}
                      style={
                        selectedLevel === lv
                          ? styles.levelPickActive
                          : styles.levelPick
                      }
                      onClick={() => setSelectedLevel(lv)}
                    >
                      {LEVEL_LABELS[lv]}
                    </button>
                  )
                )}
              </div>
              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(1)}>
                  Back
                </button>
                <button style={styles.primaryBtn} onClick={() => setStep(3)}>
                  Next: Requirements
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={styles.fieldLabel}>Requirement Checklist</div>
              <div style={styles.checkList}>
                {checks.map((c) => (
                  <div key={c.key} style={styles.checkRow}>
                    <span style={styles.checkDot} />
                    <span>{c.label}</span>
                    <span style={styles.checkPending}>Will be tracked</span>
                  </div>
                ))}
              </div>

              <div style={styles.infoBox}>
                <strong>Note:</strong> Submitting this creates the category
                request. Training, practical assessment, and Chemical & Tool
                Matrix must be completed before the category becomes ACTIVE for
                dispatch.
              </div>

              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(2)}>
                  Back
                </button>
                <button
                  style={styles.primaryBtn}
                  onClick={onClose}
                  disabled
                  title="Save API not wired yet"
                >
                  Submit (API not configured)
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={styles.drawerFooter}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            Add-category API call requires backend wiring.
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

  /* Service chips */
  serviceChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  serviceChipBtn: {
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
  serviceChipName: {
    fontWeight: 700,
    color: '#111827',
    fontSize: 12,
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
  statusReady: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusPending: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusPaused: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#e5e7eb',
    color: '#374151',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusRevoked: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },

  /* Level chips */
  levelExpert: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#ede9fe',
    color: '#5b21b6',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  levelIntermediate: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  levelBeginner: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
  },

  /* Category grid */
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12,
  },
  categoryCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 14,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#111827',
    marginBottom: 10,
  },
  categoryStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 10,
  },
  categoryStatLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  categoryStatValue: {
    fontSize: 18,
    fontWeight: 800,
    color: '#111827',
    marginTop: 2,
  },
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
  categoryPickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 8,
    marginBottom: 16,
  },
  categoryPick: {
    padding: '10px 12px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left',
    fontWeight: 600,
    color: '#374151',
  },
  categoryPickActive: {
    padding: '10px 12px',
    background: '#eff6ff',
    border: '1px solid #93c5fd',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left',
    fontWeight: 700,
    color: '#1d4ed8',
  },
  levelPickRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  levelPick: {
    padding: '10px 16px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  levelPickActive: {
    padding: '10px 16px',
    background: '#eff6ff',
    border: '1px solid #93c5fd',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    color: '#1d4ed8',
  },
  checkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 13,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#f59e0b',
    flexShrink: 0,
  },
  checkPending: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#92400e',
    fontWeight: 700,
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
  wizardActions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
};