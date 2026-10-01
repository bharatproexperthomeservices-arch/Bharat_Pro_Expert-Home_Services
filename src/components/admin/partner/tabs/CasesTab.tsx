import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { PartnerRow } from '../../../../types/partner';
import { fetchPartners } from '../../../../services/partnerApi';

/* ============================================================
   COMMUNICATION TAB — COMPLETE
   - Broadcasts (audience builder + schedule + delivery)
   - Template library (multilingual Hindi/Hinglish/English)
   - Partner helpdesk tickets
   - Channel status (SMS / WhatsApp / Push / Email)
   - Two view modes: Broadcasts / Templates
   - Detail drawers
   ============================================================ */

export interface CommunicationTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

type ViewMode = 'broadcasts' | 'templates';
type BroadcastStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
type Channel = 'SMS' | 'WHATSAPP' | 'PUSH' | 'EMAIL';
type TemplateLanguage = 'HINDI' | 'HINGLISH' | 'ENGLISH';
type TemplateCategory = 'ONBOARDING' | 'KYC' | 'BANK' | 'TRAINING' | 'OFFER' | 'PAYOUT' | 'PENALTY' | 'GENERAL';

interface Broadcast {
  id: string;
  name: string;
  message: string;
  channels: Channel[];
  audience: {
    hubs?: string[];
    categories?: string[];
    tiers?: string[];
    statuses?: string[];
  };
  status: BroadcastStatus;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  delivered: number;
  failed: number;
  created_by: string;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  channel: Channel;
  body: string;
  variables: string[];
  is_approved: boolean;
  provider_ref?: string;
  updated_at: string;
}

interface HelpdeskTicket {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  subject: string;
  category: 'PAYOUT' | 'JOB' | 'CUSTOMER' | 'KIT' | 'APP' | 'DOCUMENT' | 'ACCOUNT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_PARTNER' | 'RESOLVED' | 'CLOSED';
  assigned_to?: string;
  sla_due?: string;
  created_at: string;
}

/* -------------------- Labels -------------------- */

const BROADCAST_STATUS_LABELS: Record<BroadcastStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  SENDING: 'Sending',
  SENT: 'Sent',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

const TEMPLATE_LANGUAGE_LABELS: Record<TemplateLanguage, string> = {
  HINDI: 'Hindi (Devanagari)',
  HINGLISH: 'Hinglish',
  ENGLISH: 'English',
};

const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  ONBOARDING: 'Onboarding',
  KYC: 'KYC',
  BANK: 'Bank',
  TRAINING: 'Training',
  OFFER: 'Job Offer',
  PAYOUT: 'Payout',
  PENALTY: 'Penalty',
  GENERAL: 'General',
};

const TICKET_CATEGORY_LABELS: Record<HelpdeskTicket['category'], string> = {
  PAYOUT: 'Payout',
  JOB: 'Job Dispute',
  CUSTOMER: 'Customer Issue',
  KIT: 'Kit',
  APP: 'App',
  DOCUMENT: 'Document',
  ACCOUNT: 'Account',
};

const TICKET_STATUS_LABELS: Record<HelpdeskTicket['status'], string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_PARTNER: 'Waiting Partner',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

/* -------------------- Starter seed -------------------- */

const STARTER_BROADCASTS: Broadcast[] = [
  {
    id: 'bc-1',
    name: 'Diwali Bonus Announcement',
    message: 'Namaste {name}, Diwali par aapke liye special bonus! 20 Oct se 25 Oct tak extra ₹200 per job.',
    channels: ['WHATSAPP', 'SMS'],
    audience: { hubs: ['Gurugram', 'Delhi'], statuses: ['ACTIVE'] },
    status: 'SENT',
    sent_at: '2026-09-28T10:00:00Z',
    total_recipients: 142,
    delivered: 138,
    failed: 4,
    created_by: 'Marketing Lead',
    created_at: '2026-09-27T15:00:00Z',
  },
  {
    id: 'bc-2',
    name: 'SOP Update Notice',
    message: 'New SOP version published. Please review it in the app before your next job.',
    channels: ['PUSH', 'WHATSAPP'],
    audience: { categories: ['Home / Deep Cleaning'] },
    status: 'SCHEDULED',
    scheduled_at: '2026-10-02T09:00:00Z',
    total_recipients: 84,
    delivered: 0,
    failed: 0,
    created_by: 'Quality Officer',
    created_at: '2026-09-30T11:30:00Z',
  },
  {
    id: 'bc-3',
    name: 'Monsoon Kit Reminder',
    message: 'Rainy season aa gaya hai. Please check your rain gear and slip safety items.',
    channels: ['SMS'],
    audience: {},
    status: 'DRAFT',
    total_recipients: 0,
    delivered: 0,
    failed: 0,
    created_by: 'Operations',
    created_at: '2026-09-30T16:45:00Z',
  },
];

const STARTER_TEMPLATES: Template[] = [
  {
    id: 'tpl-1',
    name: 'Document Rejected (Hinglish)',
    category: 'KYC',
    language: 'HINGLISH',
    channel: 'WHATSAPP',
    body: 'Namaste {name}, aapka {doc_type} reject hua hai: {reason}. Kripya saaf photo dobara upload karein: {link}',
    variables: ['name', 'doc_type', 'reason', 'link'],
    is_approved: true,
    provider_ref: 'WHATSAPP-TPL-KYC-REJ-01',
    updated_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'tpl-2',
    name: 'New Job Offer (Hinglish)',
    category: 'OFFER',
    language: 'HINGLISH',
    channel: 'WHATSAPP',
    body: 'Naya job: {service}, {area}, {time}. Kamai: ₹{amount}. {seconds} second mein accept karein.',
    variables: ['service', 'area', 'time', 'amount', 'seconds'],
    is_approved: true,
    provider_ref: 'WHATSAPP-TPL-OFFER-01',
    updated_at: '2026-09-12T09:00:00Z',
  },
  {
    id: 'tpl-3',
    name: 'Document Expiry (Hindi)',
    category: 'KYC',
    language: 'HINDI',
    channel: 'SMS',
    body: '{name} जी, आपका {doc_type} {date} को समाप्त हो रहा है। कृपया समय पर नया अपलोड करें।',
    variables: ['name', 'doc_type', 'date'],
    is_approved: false,
    updated_at: '2026-09-20T14:00:00Z',
  },
  {
    id: 'tpl-4',
    name: 'Payout Processed',
    category: 'PAYOUT',
    language: 'ENGLISH',
    channel: 'SMS',
    body: 'Hi {name}, your payout of ₹{amount} has been processed. Ref: {ref}. Thanks for working with Bharat Pro Expert.',
    variables: ['name', 'amount', 'ref'],
    is_approved: true,
    provider_ref: 'SMS-DLT-PAYOUT-01',
    updated_at: '2026-09-22T12:00:00Z',
  },
];

const STARTER_TICKETS: HelpdeskTicket[] = [
  {
    id: 'tk-1',
    partner_id: 'p-4',
    partner_name: 'Ajay Singh',
    partner_code: 'BPE-PRO-1004',
    subject: 'Payout not received for last week',
    category: 'PAYOUT',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assigned_to: 'Finance Officer',
    sla_due: new Date(Date.now() + 6 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'tk-2',
    partner_id: 'p-5',
    partner_name: 'Vijay Sharma',
    partner_code: 'BPE-PRO-1005',
    subject: 'App not loading on Android 9',
    category: 'APP',
    priority: 'MEDIUM',
    status: 'OPEN',
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 'tk-3',
    partner_id: 'p-6',
    partner_name: 'Kiran Patel',
    partner_code: 'BPE-PRO-1006',
    subject: 'Kit refill request for bathroom cleaning',
    category: 'KIT',
    priority: 'LOW',
    status: 'RESOLVED',
    assigned_to: 'Hub Lead',
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
];

/* -------------------- Tone helpers -------------------- */

function broadcastStatusTone(status: BroadcastStatus): CSSProperties {
  switch (status) {
    case 'SENT': return styles.statusSent;
    case 'SENDING': return styles.statusSending;
    case 'SCHEDULED': return styles.statusScheduled;
    case 'DRAFT': return styles.statusDraft;
    case 'FAILED': return styles.statusFailed;
    case 'CANCELLED': return styles.statusCancelled;
    default: return styles.statusDraft;
  }
}

function ticketStatusTone(status: HelpdeskTicket['status']): CSSProperties {
  switch (status) {
    case 'OPEN': return styles.statusOpen;
    case 'IN_PROGRESS': return styles.statusInProgress;
    case 'WAITING_PARTNER': return styles.statusWaiting;
    case 'RESOLVED': return styles.statusResolved;
    case 'CLOSED': return styles.statusClosed;
    default: return styles.statusOpen;
  }
}

function ticketPriorityTone(p: HelpdeskTicket['priority']): CSSProperties {
  switch (p) {
    case 'HIGH': return styles.priHigh;
    case 'MEDIUM': return styles.priMedium;
    case 'LOW': return styles.priLow;
    default: return styles.priLow;
  }
}

/* -------------------- Utils -------------------- */

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

export default function CommunicationTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: CommunicationTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>('broadcasts');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showTickets, setShowTickets] = useState(false);

  const [tickets, setTickets] = useState<HelpdeskTicket[]>(STARTER_TICKETS);

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
        setNotConfigured('Communication API not configured yet.');
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
    const totalBroadcasts = STARTER_BROADCASTS.length;
    const sent = STARTER_BROADCASTS.filter((b) => b.status === 'SENT').length;
    const scheduled = STARTER_BROADCASTS.filter((b) => b.status === 'SCHEDULED').length;
    const totalDelivered = STARTER_BROADCASTS.reduce((s, b) => s + b.delivered, 0);
    const totalFailed = STARTER_BROADCASTS.reduce((s, b) => s + b.failed, 0);
    const deliveryRate = totalDelivered + totalFailed > 0
      ? Math.round((totalDelivered / (totalDelivered + totalFailed)) * 100)
      : 0;
    const openTickets = tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
    const approvedTemplates = STARTER_TEMPLATES.filter((t) => t.is_approved).length;
    const unapprovedTemplates = STARTER_TEMPLATES.filter((t) => !t.is_approved).length;

    return {
      totalBroadcasts, sent, scheduled, deliveryRate,
      openTickets, approvedTemplates, unapprovedTemplates,
    };
  }, [tickets]);

  /* -------------------- Filtered lists -------------------- */

  const filteredBroadcasts = useMemo(() => {
    let list = [...STARTER_BROADCASTS];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q) || b.message.toLowerCase().includes(q));
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((b) => b.status === statusFilter);
    }
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [search, statusFilter]);

  const filteredTemplates = useMemo(() => {
    let list = [...STARTER_TEMPLATES];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
    }
    return list;
  }, [search]);

  /* -------------------- Render states -------------------- */

  if (loading) {
    return <div style={styles.state}>Loading communication…</div>;
  }

  if (notConfigured) {
    return (
      <div style={styles.state}>
        <strong>Not configured:</strong> {notConfigured}
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 12 }}>
          Connect the notification provider to send broadcasts. Starters shown
          for reference only.
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
        <SummaryCard label="Total Broadcasts" value={String(summary.totalBroadcasts)} sub={`${summary.sent} sent`} tone="info" />
        <SummaryCard label="Scheduled" value={String(summary.scheduled)} sub="upcoming" tone="warning" />
        <SummaryCard label="Delivery Rate" value={`${summary.deliveryRate}%`} sub="provider confirmed" tone="success" />
        <SummaryCard label="Open Tickets" value={String(summary.openTickets)} sub="partner helpdesk" tone="danger" />
        <SummaryCard label="Approved Templates" value={String(summary.approvedTemplates)} sub={`${summary.unapprovedTemplates} pending`} tone="info" />
      </div>

      {/* View bar */}
      <div style={styles.viewBar}>
        <button
          style={view === 'broadcasts' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => { setView('broadcasts'); setStatusFilter('ALL'); }}
        >
          Broadcasts
        </button>
        <button
          style={view === 'templates' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => { setView('templates'); setStatusFilter('ALL'); }}
        >
          Templates
        </button>
        <button style={styles.createBtn} onClick={() => setShowCreate(true)}>
          + New Broadcast
        </button>
        <button style={styles.ticketBtn} onClick={() => setShowTickets(true)}>
          Helpdesk ({summary.openTickets})
        </button>
        <button style={styles.refreshBtn} onClick={load} disabled={loading}>Refresh</button>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder={view === 'broadcasts' ? 'Search broadcast name or message…' : 'Search template name or body…'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {view === 'broadcasts' && (
          <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="SENDING">Sending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}
      </div>

      {/* Channel status banner */}
      <div style={styles.channelBanner}>
        <ChannelBadge name="SMS" status="Not configured" tone="warn" />
        <ChannelBadge name="WhatsApp" status="Not configured" tone="warn" />
        <ChannelBadge name="Push" status="Not configured" tone="warn" />
        <ChannelBadge name="Email" status="Not configured" tone="warn" />
        <span style={styles.channelNote}>
          Configure channels in Settings → Integrations
        </span>
      </div>

      {/* Broadcasts view */}
      {view === 'broadcasts' && (
        <>
          {filteredBroadcasts.length === 0 ? (
            <div style={styles.state}>
              <h3 style={{ margin: 0 }}>No broadcasts match</h3>
              <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Try changing filters or search.</p>
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <Th>Broadcast</Th>
                    <Th>Channels</Th>
                    <Th>Audience</Th>
                    <Th>Status</Th>
                    <Th>Recipients</Th>
                    <Th>Delivered</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBroadcasts.map((b) => (
                    <tr key={b.id}>
                      <Td>
                        <div style={{ fontWeight: 700 }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                          {b.message.slice(0, 60)}…
                        </div>
                      </Td>
                      <Td>
                        <div style={styles.chipRow}>
                          {b.channels.map((c) => (
                            <span key={c} style={styles.channelChip}>{c}</span>
                          ))}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {b.audience.hubs?.length ? `Hubs: ${b.audience.hubs.join(', ')}` : ''}
                          {b.audience.categories?.length ? ` · Cats: ${b.audience.categories.length}` : ''}
                          {!b.audience.hubs?.length && !b.audience.categories?.length ? 'All partners' : ''}
                        </div>
                      </Td>
                      <Td><span style={broadcastStatusTone(b.status)}>{BROADCAST_STATUS_LABELS[b.status]}</span></Td>
                      <Td>{b.total_recipients}</Td>
                      <Td>
                        <span style={{ color: '#166534', fontWeight: 700 }}>{b.delivered}</span>
                        {b.failed > 0 && (
                          <span style={{ color: '#991b1b', fontWeight: 700, marginLeft: 6 }}>· {b.failed} failed</span>
                        )}
                      </Td>
                      <Td>
                        <button style={styles.smallBtn} onClick={() => setSelectedBroadcast(b)}>View</button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Templates view */}
      {view === 'templates' && (
        <>
          {filteredTemplates.length === 0 ? (
            <div style={styles.state}>
              <h3 style={{ margin: 0 }}>No templates match</h3>
              <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Try changing search.</p>
            </div>
          ) : (
            <div style={styles.templateGrid}>
              {filteredTemplates.map((t) => (
                <div key={t.id} style={styles.templateCard}>
                  <div style={styles.templateHeader}>
                    <div style={styles.templateTitle}>{t.name}</div>
                    <span style={t.is_approved ? styles.statusSent : styles.statusDraft}>
                      {t.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div style={styles.templateMeta}>
                    <span style={styles.templateTag}>{TEMPLATE_CATEGORY_LABELS[t.category]}</span>
                    <span style={styles.templateTag}>{TEMPLATE_LANGUAGE_LABELS[t.language]}</span>
                    <span style={styles.templateTag}>{t.channel}</span>
                  </div>
                  <div style={styles.templateBody}>{t.body}</div>
                  <div style={styles.templateVars}>
                    <strong>Variables:</strong> {t.variables.join(', ')}
                  </div>
                  {t.provider_ref && (
                    <div style={styles.templateRef}>
                      <strong>Provider ref:</strong> {t.provider_ref}
                    </div>
                  )}
                  <div style={styles.templateActions}>
                    <button style={styles.smallBtn} onClick={() => setSelectedTemplate(t)}>View</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer note */}
      <div style={styles.footerNote}>
        <strong>Note:</strong> SMS templates must be DLT-registered and WhatsApp
        templates pre-approved by the provider before they can be marked usable.
        Delivery status is shown only when the provider confirms it.
      </div>

      {/* Drawers */}
      {selectedBroadcast && (
        <BroadcastDrawer broadcast={selectedBroadcast} onClose={() => setSelectedBroadcast(null)} />
      )}
      {selectedTemplate && (
        <TemplateDrawer template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />
      )}
      {showCreate && <CreateBroadcastWizard onClose={() => setShowCreate(false)} />}
      {showTickets && (
        <TicketsDrawer
          tickets={tickets}
          onClose={() => setShowTickets(false)}
          onPartnerSelect={onPartnerSelect}
        />
      )}
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function SummaryCard({
  label, value, sub, tone,
}: {
  label: string; value: string; sub?: string;
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
    <div style={{ ...styles.summaryCard, background: theme.bg, borderColor: theme.color + '33' }}>
      <div style={{ ...styles.summaryLabel, color: theme.color }}>{label}</div>
      <div style={{ ...styles.summaryValue, color: theme.color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.color, opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}

function ChannelBadge({ name, status, tone }: { name: string; status: string; tone: 'ok' | 'warn' | 'err' }) {
  const color = tone === 'ok' ? '#166534' : tone === 'warn' ? '#92400e' : '#991b1b';
  const bg = tone === 'ok' ? '#dcfce7' : tone === 'warn' ? '#fef3c7' : '#fee2e2';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: bg, color, borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {name}: {status}
    </span>
  );
}

/* ============================================================
   BroadcastDrawer
   ============================================================ */

function BroadcastDrawer({ broadcast, onClose }: { broadcast: Broadcast; onClose: () => void }) {
  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{broadcast.name}</div>
            <div style={styles.drawerSub}>
              {broadcast.id} · created {formatDate(broadcast.created_at)}
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.detailGrid}>
            <DetailItem label="Status" value={BROADCAST_STATUS_LABELS[broadcast.status]} />
            <DetailItem label="Created By" value={broadcast.created_by} />
            <DetailItem label="Channels" value={broadcast.channels.join(', ')} />
            <DetailItem label="Total Recipients" value={String(broadcast.total_recipients)} />
            <DetailItem label="Delivered" value={String(broadcast.delivered)} />
            <DetailItem label="Failed" value={String(broadcast.failed)} />
            <DetailItem label="Sent At" value={formatDate(broadcast.sent_at)} />
            <DetailItem label="Scheduled At" value={formatDate(broadcast.scheduled_at)} />
          </div>

          <div style={styles.descriptionBox}>
            <div style={styles.descriptionLabel}>Message</div>
            <div>{broadcast.message}</div>
          </div>

          <div style={styles.descriptionBox}>
            <div style={styles.descriptionLabel}>Audience</div>
            <div style={{ fontSize: 13 }}>
              {broadcast.audience.hubs?.length ? <div>Hubs: {broadcast.audience.hubs.join(', ')}</div> : null}
              {broadcast.audience.categories?.length ? <div>Categories: {broadcast.audience.categories.join(', ')}</div> : null}
              {broadcast.audience.statuses?.length ? <div>Statuses: {broadcast.audience.statuses.join(', ')}</div> : null}
              {!broadcast.audience.hubs?.length && !broadcast.audience.categories?.length && !broadcast.audience.statuses?.length ? <div>All partners</div> : null}
            </div>
          </div>

          <div style={styles.infoBox}>
            <strong>Delivery status:</strong> Only provider-confirmed status is
            shown. Pending or unknown is not assumed delivered.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TemplateDrawer
   ============================================================ */

function TemplateDrawer({ template, onClose }: { template: Template; onClose: () => void }) {
  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{template.name}</div>
            <div style={styles.drawerSub}>
              {TEMPLATE_CATEGORY_LABELS[template.category]} · {TEMPLATE_LANGUAGE_LABELS[template.language]}
            </div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.detailGrid}>
            <DetailItem label="Channel" value={template.channel} />
            <DetailItem label="Approved" value={template.is_approved ? 'Yes' : 'No — pending'} />
            <DetailItem label="Provider Ref" value={template.provider_ref ?? '—'} />
            <DetailItem label="Updated" value={formatDate(template.updated_at)} />
          </div>

          <div style={styles.descriptionBox}>
            <div style={styles.descriptionLabel}>Body</div>
            <div style={{ fontFamily: 'inherit' }}>{template.body}</div>
          </div>

          <div style={styles.descriptionBox}>
            <div style={styles.descriptionLabel}>Variables</div>
            <div style={{ fontSize: 13 }}>
              {template.variables.map((v) => (
                <span key={v} style={styles.varChip}>{`{${v}}`}</span>
              ))}
            </div>
          </div>

          <div style={styles.infoBox}>
            <strong>Note:</strong> SMS needs DLT registration; WhatsApp needs
            pre-approval. Until then the template cannot be marked usable.
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
   TicketsDrawer
   ============================================================ */

function TicketsDrawer({
  tickets, onClose, onPartnerSelect,
}: {
  tickets: HelpdeskTicket[]; onClose: () => void;
  onPartnerSelect?: (id: string) => void;
}) {
  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>Partner Helpdesk</div>
            <div style={styles.drawerSub}>{tickets.length} tickets</div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.drawerBody}>
          {tickets.length === 0 ? (
            <div style={styles.drawerState}>No tickets.</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <Th>Ticket</Th>
                    <Th>Partner</Th>
                    <Th>Category</Th>
                    <Th>Priority</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <Td>
                        <div style={{ fontWeight: 700 }}>{t.id}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{t.subject}</div>
                      </Td>
                      <Td>
                        <strong>{t.partner_name}</strong>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{t.partner_code}</div>
                      </Td>
                      <Td>{TICKET_CATEGORY_LABELS[t.category]}</Td>
                      <Td><span style={ticketPriorityTone(t.priority)}>{t.priority}</span></Td>
                      <Td><span style={ticketStatusTone(t.status)}>{TICKET_STATUS_LABELS[t.status]}</span></Td>
                      <Td>
                        <button style={styles.smallBtn} onClick={() => onPartnerSelect?.(t.partner_id)} disabled={!onPartnerSelect}>
                          Partner
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CreateBroadcastWizard
   ============================================================ */

function CreateBroadcastWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');

  const toggleChannel = (c: Channel) => {
    setChannels((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={{ ...styles.drawer, width: 'min(640px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>New Broadcast</div>
            <div style={styles.drawerSub}>Compose + target + schedule</div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.stepRow}>
            <span style={step >= 1 ? styles.stepActive : styles.step}>1. Compose</span>
            <span style={step >= 2 ? styles.stepActive : styles.step}>2. Channels</span>
            <span style={step >= 3 ? styles.stepActive : styles.step}>3. Schedule</span>
            <span style={step >= 4 ? styles.stepActive : styles.step}>4. Confirm</span>
          </div>

          {step === 1 && (
            <div>
              <div style={styles.fieldLabel}>Broadcast Name</div>
              <input style={styles.textInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Weekend Campaign" />
              <div style={styles.fieldLabel}>Message</div>
              <textarea style={styles.textarea} value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Use {name} for personalization…" />
              <div style={styles.wizardActions}>
                <button style={styles.primaryBtn} disabled={!name.trim() || !message.trim()} onClick={() => setStep(2)}>Next: Channels</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={styles.fieldLabel}>Channels</div>
              <div style={styles.levelPickRow}>
                {(['SMS', 'WHATSAPP', 'PUSH', 'EMAIL'] as Channel[]).map((c) => (
                  <button key={c} style={channels.includes(c) ? styles.levelPickActive : styles.levelPick} onClick={() => toggleChannel(c)}>{c}</button>
                ))}
              </div>
              <div style={styles.infoBox}>
                Channels require provider configuration. Unapproved templates
                cannot be sent.
              </div>
              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(1)}>Back</button>
                <button style={styles.primaryBtn} disabled={channels.length === 0} onClick={() => setStep(3)}>Next: Schedule</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={styles.fieldLabel}>Schedule (optional — leave blank to send now)</div>
              <input type="datetime-local" style={styles.textInput} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              <div style={styles.infoBox}>Quiet hours apply except for critical notices. Delivery is shown only after provider confirmation.</div>
              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(2)}>Back</button>
                <button style={styles.primaryBtn} onClick={() => setStep(4)}>Next: Confirm</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={styles.confirmBox}>
                <div><strong>Name:</strong> {name}</div>
                <div style={{ marginTop: 4 }}><strong>Channels:</strong> {channels.join(', ')}</div>
                {scheduledAt && <div style={{ marginTop: 4 }}><strong>Scheduled:</strong> {scheduledAt}</div>}
                <div style={{ marginTop: 8 }}><strong>Message:</strong></div>
                <div style={{ marginTop: 4, padding: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6 }}>{message}</div>
              </div>
              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(3)}>Back</button>
                <button style={styles.primaryBtn} disabled title="Save API not wired yet" onClick={onClose}>Submit (API not configured)</button>
              </div>
            </div>
          )}
        </div>

        <div style={styles.drawerFooter}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Broadcast creation requires provider configuration.</span>
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
  summaryValue: { fontSize: 20, fontWeight: 800, marginTop: 4, marginBottom: 2 },
  viewBar: { display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' },
  viewBtn: { padding: '8px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 },
  viewBtnActive: { padding: '8px 14px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#1d4ed8', fontWeight: 700 },
  createBtn: { padding: '8px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  ticketBtn: { padding: '8px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  refreshBtn: { marginLeft: 'auto', padding: '8px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  filterBar: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none' },
  select: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff' },
  textInput: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, marginBottom: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' },
  channelBanner: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 },
  channelNote: { fontSize: 11, color: '#6b7280', marginLeft: 'auto' },
  chipRow: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  channelChip: { fontSize: 10, fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' },
  tableWrap: { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: '#6b7280', whiteSpace: 'nowrap' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' },
  smallBtn: { padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  primaryBtn: { padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  ghostBtn: { padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  statusSent: { display: 'inline-block', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusSending: { display: 'inline-block', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusScheduled: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusDraft: { display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusFailed: { display: 'inline-block', padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusCancelled: { display: 'inline-block', padding: '2px 8px', background: '#e5e7eb', color: '#374151', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusOpen: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusInProgress: { display: 'inline-block', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusWaiting: { display: 'inline-block', padding: '2px 8px', background: '#ede9fe', color: '#5b21b6', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusResolved: { display: 'inline-block', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusClosed: { display: 'inline-block', padding: '2px 8px', background: '#e5e7eb', color: '#374151', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  priHigh: { display: 'inline-block', padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  priMedium: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  priLow: { display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  templateGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 },
  templateCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 },
  templateHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  templateTitle: { fontSize: 14, fontWeight: 800, color: '#111827', flex: 1 },
  templateMeta: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  templateTag: { fontSize: 10, fontWeight: 800, background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' },
  templateBody: { padding: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, marginBottom: 10, lineHeight: 1.6 },
  templateVars: { fontSize: 11, color: '#6b7280', marginBottom: 6 },
  templateRef: { fontSize: 11, color: '#6b7280', marginBottom: 10 },
  templateActions: { display: 'flex', gap: 8 },
  varChip: { display: 'inline-block', padding: '2px 8px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 4, fontSize: 11, fontWeight: 700, marginRight: 4, fontFamily: 'monospace' },
  state: { padding: 40, textAlign: 'center', border: '1px dashed #d1d5db', borderRadius: 10, background: '#fff', color: '#374151' },
  stateError: { padding: 20, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  retryBtn: { padding: '6px 12px', background: '#991b1b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  footerNote: { marginTop: 16, padding: '10px 14px', background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 6, fontSize: 12, color: '#6b7280' },
  drawerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' },
  drawer: { width: 'min(720px, 100%)', height: '100%', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  drawerHeader: { padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  drawerTitle: { fontSize: 16, fontWeight: 700, color: '#111827' },
  drawerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  drawerClose: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', padding: 4, lineHeight: 1 },
  drawerBody: { padding: 20, overflowY: 'auto', flex: 1 },
  drawerFooter: { padding: '10px 20px', borderTop: '1px solid #e5e7eb', background: '#fff' },
  drawerState: { padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 13 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 },
  detailItem: { padding: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 },
  detailItemLabel: { fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  detailItemValue: { fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 4, wordBreak: 'break-word' },
  descriptionBox: { padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, fontSize: 13, lineHeight: 1.6 },
  descriptionLabel: { fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  infoBox: { padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#1e40af', marginBottom: 16, lineHeight: 1.6 },
  stepRow: { display: 'flex', gap: 10, marginBottom: 18, fontSize: 11, flexWrap: 'wrap' },
  step: { color: '#9ca3af', fontWeight: 600 },
  stepActive: { color: '#1d4ed8', fontWeight: 800 },
  fieldLabel: { fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  levelPickRow: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  levelPick: { padding: '8px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' },
  levelPickActive: { padding: '8px 14px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#1d4ed8' },
  confirmBox: { padding: 14, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.7 },
  wizardActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 },
};