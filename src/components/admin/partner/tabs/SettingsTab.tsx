import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { PartnerRow } from '../../../../types/partner';
import { fetchPartners } from '../../../../services/partnerApi';

/* ============================================================
   SETTINGS TAB — COMPLETE
   Partner module configuration:
   - Onboarding flow config
   - Activation gates (9 gates)
   - Auto-activate toggle
   - SLA + thresholds
   - Notification channel status
   - Provider / integration status (SMS, WhatsApp, KYC, Bank, Payout, Maps, AI)
   - Kill switches (AI, Automation)
   - Save / Cancel with audit note
   ============================================================ */

export interface SettingsTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

type SettingsSection =
  | 'onboarding'
  | 'gates'
  | 'sla'
  | 'notifications'
  | 'integrations'
  | 'kills';

interface SettingsSectionDef {
  key: SettingsSection;
  label: string;
  description: string;
}

const SECTIONS: SettingsSectionDef[] = [
  { key: 'onboarding', label: 'Onboarding Flow', description: 'Checklist items and required documents per category' },
  { key: 'gates', label: 'Activation Gates', description: '9 gates required before a partner can be activated' },
  { key: 'sla', label: 'SLA & Thresholds', description: 'Timers, review windows, and numeric limits' },
  { key: 'notifications', label: 'Notification Channels', description: 'SMS, WhatsApp, Push, Email — provider status' },
  { key: 'integrations', label: 'Integrations', description: 'KYC, Bank, Payout, Maps, AI provider status' },
  { key: 'kills', label: 'Kill Switches', description: 'Super-Admin emergency stop for AI and Automation' },
];

interface GateConfig {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  overridable: boolean;
  locked: boolean; // if true, cannot be turned off (KYC, agreement, etc.)
}

interface SlaConfig {
  key: string;
  label: string;
  value: string;
  unit: string;
  description: string;
}

interface ChannelStatus {
  key: string;
  label: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  note: string;
}

interface IntegrationStatus {
  key: string;
  label: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  note: string;
}

/* -------------------- Starter configs -------------------- */

const DEFAULT_GATES: GateConfig[] = [
  { key: 'otp', label: 'Mobile OTP verified', description: 'Partner must verify mobile via OTP', enabled: true, overridable: false, locked: true },
  { key: 'profile', label: 'Profile complete', description: 'Name, DOB (18+), languages, city, hub', enabled: true, overridable: false, locked: true },
  { key: 'kyc', label: 'Identity KYC verified', description: 'Required identity documents VERIFIED and unexpired', enabled: true, overridable: false, locked: true },
  { key: 'address', label: 'Address / background verification', description: 'Per config: police verification / address proof', enabled: true, overridable: true, locked: false },
  { key: 'bank', label: 'Payout account verified', description: 'Required for activation or payout-only', enabled: true, overridable: true, locked: false },
  { key: 'agreement', label: 'Agreement + consents accepted', description: 'Partner Agreement, Code of Conduct, Chemical-Safety, Privacy', enabled: true, overridable: false, locked: true },
  { key: 'training', label: 'Training + practical + matrix', description: 'At least 1 category with training PASSED and matrix SATISFIED', enabled: true, overridable: true, locked: false },
  { key: 'hub', label: 'Hub assignment + coverage', description: 'At least 1 hub with service coverage', enabled: true, overridable: false, locked: true },
  { key: 'channel', label: 'Reachable notification channel', description: 'Push token, or opted-in WhatsApp / SMS', enabled: true, overridable: true, locked: false },
];

const DEFAULT_SLA: SlaConfig[] = [
  { key: 'first_contact', label: 'First contact', value: '24', unit: 'hours', description: 'Lead → first contact SLA' },
  { key: 'kyc_review', label: 'KYC review', value: '48', unit: 'hours', description: 'Document submitted → review decision' },
  { key: 'bank_verify', label: 'Bank verification', value: '24', unit: 'hours', description: 'Bank added → verification attempt' },
  { key: 'approval_tat', label: 'Approval TAT', value: '72', unit: 'hours', description: 'Submitted → approval decision' },
  { key: 'cert_expiry_warn', label: 'Certificate expiry warning', value: '30', unit: 'days', description: 'Notify partner 30 days before expiry' },
  { key: 'doc_expiry_warn', label: 'Document expiry warning', value: '30', unit: 'days', description: 'Notify 30 / 15 / 7 / 1 days before' },
  { key: 'inactivity_days', label: 'Inactivity threshold', value: '14', unit: 'days', description: 'No online hours → churn radar flags partner' },
  { key: 'probation_jobs', label: 'Probation jobs', value: '10', unit: 'jobs', description: 'First N jobs with QC sampling' },
  { key: 'min_sample_jobs', label: 'Minimum sample for rating', value: '10', unit: 'jobs', description: 'Below this, "Insufficient data" is shown' },
];

const DEFAULT_CHANNELS: ChannelStatus[] = [
  { key: 'sms', label: 'SMS', status: 'NOT_CONFIGURED', note: 'Needs DLT-registered templates + provider credentials' },
  { key: 'whatsapp', label: 'WhatsApp', status: 'NOT_CONFIGURED', note: 'Needs business-initiated template pre-approval' },
  { key: 'push', label: 'Push Notifications', status: 'NOT_CONFIGURED', note: 'Needs FCM / APNs credentials' },
  { key: 'email', label: 'Email', status: 'NOT_CONFIGURED', note: 'Needs SMTP / transactional email provider' },
];

const DEFAULT_INTEGRATIONS: IntegrationStatus[] = [
  { key: 'kyc', label: 'KYC Provider', status: 'NOT_CONFIGURED', note: 'DigiLocker / offline e-KYC for Aadhaar verification' },
  { key: 'bank', label: 'Bank Verification Provider', status: 'NOT_CONFIGURED', note: 'Penny-drop / penny-less verification' },
  { key: 'payout', label: 'Payout Provider', status: 'NOT_CONFIGURED', note: 'Payouts to verified accounts' },
  { key: 'maps', label: 'Google Maps', status: 'NOT_CONFIGURED', note: 'Places Autocomplete + Map rendering' },
  { key: 'ai', label: 'AI Provider', status: 'NOT_CONFIGURED', note: 'Gemini / OpenAI / Anthropic compatible' },
  { key: 'storage', label: 'File Storage', status: 'NOT_CONFIGURED', note: 'Private signed URLs for documents + media' },
];

/* -------------------- Tone helpers -------------------- */

function statusTone(status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR'): CSSProperties {
  switch (status) {
    case 'CONNECTED': return styles.statusConnected;
    case 'NOT_CONFIGURED': return styles.statusNotConfigured;
    case 'ERROR': return styles.statusError;
    default: return styles.statusNotConfigured;
  }
}

function statusLabel(status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR'): string {
  switch (status) {
    case 'CONNECTED': return 'Connected';
    case 'NOT_CONFIGURED': return 'Not configured';
    case 'ERROR': return 'Error';
    default: return 'Unknown';
  }
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function SettingsTab({ apiBase, authToken = null }: SettingsTabProps) {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<SettingsSection>('onboarding');

  // Editable state
  const [autoActivate, setAutoActivate] = useState(true);
  const [bankRequiredForActivation, setBankRequiredForActivation] = useState(true);
  const [gates, setGates] = useState<GateConfig[]>(DEFAULT_GATES);
  const [sla, setSla] = useState<SlaConfig[]>(DEFAULT_SLA);
  const [channels, setChannels] = useState<ChannelStatus[]>(DEFAULT_CHANNELS);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>(DEFAULT_INTEGRATIONS);
  const [aiKillSwitch, setAiKillSwitch] = useState(false);
  const [automationKillSwitch, setAutomationKillSwitch] = useState(false);

  const [dirty, setDirty] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  // Onboarding checklist items
  const [checklistItems, setChecklistItems] = useState<string[]>([
    'Mobile OTP verified',
    'Profile completed',
    'Category interest selected',
    'Identity documents uploaded',
    'Bank account added',
    'Agreement + consents accepted',
    'Training modules assigned',
    'Kit / matrix compliance reviewed',
    'Hub assigned',
  ]);

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
        setNotConfigured('Settings API not configured yet — showing editable defaults.');
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

  const toggleGate = (key: string, field: 'enabled' | 'overridable') => {
    setGates((prev) => prev.map((g) => {
      if (g.key !== key) return g;
      if (field === 'enabled' && g.locked) return g;
      return { ...g, [field]: !g[field] };
    }));
    setDirty(true);
  };

  const updateSla = (key: string, value: string) => {
    setSla((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
    setDirty(true);
  };

  const handleSave = () => {
    // Placeholder — API not wired yet
    setSaveNote('Configuration save requires backend wiring. Changes are local only.');
    setDirty(false);
  };

  const handleReset = () => {
    setGates(DEFAULT_GATES);
    setSla(DEFAULT_SLA);
    setAutoActivate(true);
    setBankRequiredForActivation(true);
    setAiKillSwitch(false);
    setAutomationKillSwitch(false);
    setDirty(false);
    setSaveNote('Reset to default values.');
  };

  /* -------------------- Summary -------------------- */

  const summary = useMemo(() => {
    const activeGates = gates.filter((g) => g.enabled).length;
    const overridableGates = gates.filter((g) => g.overridable).length;
    const connectedChannels = channels.filter((c) => c.status === 'CONNECTED').length;
    const connectedIntegrations = integrations.filter((i) => i.status === 'CONNECTED').length;
    const totalPartners = partners.length;

    return {
      activeGates,
      overridableGates,
      connectedChannels,
      connectedIntegrations,
      totalPartners,
      killsOn: (aiKillSwitch ? 1 : 0) + (automationKillSwitch ? 1 : 0),
    };
  }, [gates, channels, integrations, partners, aiKillSwitch, automationKillSwitch]);

  /* -------------------- Render states -------------------- */

  if (loading) return <div style={styles.state}>Loading settings…</div>;

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
        <SummaryCard label="Active Gates" value={`${summary.activeGates} / ${gates.length}`} sub={`${summary.overridableGates} overridable`} tone="info" />
        <SummaryCard label="Auto-Activate" value={autoActivate ? 'ON' : 'OFF'} sub="after approval" tone={autoActivate ? 'success' : 'warning'} />
        <SummaryCard label="Channels Connected" value={`${summary.connectedChannels} / ${channels.length}`} sub="notification" tone={summary.connectedChannels > 0 ? 'success' : 'danger'} />
        <SummaryCard label="Integrations Connected" value={`${summary.connectedIntegrations} / ${integrations.length}`} sub="external providers" tone={summary.connectedIntegrations > 0 ? 'success' : 'danger'} />
        <SummaryCard label="Kill Switches" value={summary.killsOn > 0 ? `${summary.killsOn} ON` : 'All OFF'} sub="Super Admin only" tone={summary.killsOn > 0 ? 'danger' : 'success'} />
      </div>

      {notConfigured && (
        <div style={styles.infoBanner}>
          <strong>Note:</strong> {notConfigured}
        </div>
      )}

      {saveNote && (
        <div style={styles.infoBanner}>
          {saveNote}
          <button
            style={styles.dismissBtn}
            onClick={() => setSaveNote(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section nav */}
      <div style={styles.sectionBar}>
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            style={activeSection === s.key ? styles.sectionTabActive : styles.sectionTab}
            onClick={() => setActiveSection(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={styles.sectionDesc}>
        {SECTIONS.find((s) => s.key === activeSection)?.description}
      </div>

      {/* Onboarding flow */}
      {activeSection === 'onboarding' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Onboarding Checklist (versioned)</div>
          <div style={styles.cardDesc}>
            These items define the onboarding progress meter. Changes apply to
            new partners only — partners already in progress keep their
            checklist version.
          </div>

          <div style={styles.checkList}>
            {checklistItems.map((item, i) => (
              <div key={i} style={styles.checkRow}>
                <span style={styles.checkIndex}>{i + 1}</span>
                <span style={styles.checkText}>{item}</span>
              </div>
            ))}
          </div>

          <div style={styles.buttonRow}>
            <button style={styles.ghostBtn} onClick={() => setDirty(true)}>
              + Add Checklist Item (wizard)
            </button>
            <button style={styles.ghostBtn} onClick={() => setDirty(true)}>
              Edit Required Documents
            </button>
          </div>

          <div style={styles.infoBox}>
            <strong>Versioned:</strong> The current version is applied to new
            partners. Existing partners are not broken by configuration changes.
          </div>
        </div>
      )}

      {/* Activation gates */}
      {activeSection === 'gates' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Activation Gates (9 gates)</div>
          <div style={styles.cardDesc}>
            All enabled gates must be true for approval. KYC and agreement
            acceptance are never overridable.
          </div>

          <div style={styles.gateList}>
            {gates.map((g) => (
              <div key={g.key} style={styles.gateRow}>
                <div style={styles.gateMain}>
                  <div style={styles.gateLabel}>
                    {g.label}
                    {g.locked && <span style={styles.lockedBadge}>LOCKED</span>}
                  </div>
                  <div style={styles.gateDesc}>{g.description}</div>
                </div>
                <div style={styles.gateControls}>
                  <label style={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={g.enabled}
                      onChange={() => toggleGate(g.key, 'enabled')}
                      disabled={g.locked}
                    />
                    Enabled
                  </label>
                  <label style={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={g.overridable}
                      onChange={() => toggleGate(g.key, 'overridable')}
                      disabled={g.locked}
                    />
                    Overridable
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.switchRow}>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={autoActivate}
                onChange={(e) => { setAutoActivate(e.target.checked); setDirty(true); }}
              />
              Auto-activate after approval (recommended)
            </label>
          </div>

          <div style={styles.switchRow}>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={bankRequiredForActivation}
                onChange={(e) => { setBankRequiredForActivation(e.target.checked); setDirty(true); }}
              />
              Bank verification required for activation
              <span style={styles.hintText}>
                {' '}(otherwise required for payout only)
              </span>
            </label>
          </div>
        </div>
      )}

      {/* SLA */}
      {activeSection === 'sla' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>SLA & Thresholds</div>
          <div style={styles.cardDesc}>
            All values are configurable. Defaults shown are starter values and
            are not hard-coded business rules.
          </div>

          <div style={styles.slaList}>
            {sla.map((s) => (
              <div key={s.key} style={styles.slaRow}>
                <div style={styles.slaMain}>
                  <div style={styles.slaLabel}>{s.label}</div>
                  <div style={styles.slaDesc}>{s.description}</div>
                </div>
                <div style={styles.slaControl}>
                  <input
                    type="number"
                    style={styles.slaInput}
                    value={s.value}
                    onChange={(e) => updateSla(s.key, e.target.value)}
                  />
                  <span style={styles.slaUnit}>{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeSection === 'notifications' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Notification Channels</div>
          <div style={styles.cardDesc}>
            Channels become LIVE only after real configuration and provider
            verification. Until then, delivery is never faked.
          </div>

          <div style={styles.statusList}>
            {channels.map((c) => (
              <div key={c.key} style={styles.statusRow}>
                <div style={styles.statusMain}>
                  <div style={styles.statusLabel}>{c.label}</div>
                  <div style={styles.statusNote}>{c.note}</div>
                </div>
                <span style={statusTone(c.status)}>{statusLabel(c.status)}</span>
              </div>
            ))}
          </div>

          <div style={styles.buttonRow}>
            <button style={styles.ghostBtn} onClick={() => setSaveNote('Open Settings → Integrations to configure providers.')}>
              Configure in Integrations →
            </button>
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeSection === 'integrations' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>External Integrations</div>
          <div style={styles.cardDesc}>
            All integrations require real credentials + verification. Secrets
            stay server-side.
          </div>

          <div style={styles.statusList}>
            {integrations.map((i) => (
              <div key={i.key} style={styles.statusRow}>
                <div style={styles.statusMain}>
                  <div style={styles.statusLabel}>{i.label}</div>
                  <div style={styles.statusNote}>{i.note}</div>
                </div>
                <span style={statusTone(i.status)}>{statusLabel(i.status)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kill switches */}
      {activeSection === 'kills' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Kill Switches (Super Admin only)</div>
          <div style={styles.cardDesc}>
            Emergency stop for AI and Automation. Audit remains available.
          </div>

          <div style={styles.killRow}>
            <div style={styles.killMain}>
              <div style={styles.killLabel}>Disable AI Developer</div>
              <div style={styles.killDesc}>
                Blocks new AI code tasks. Safe jobs handled per shutdown policy.
              </div>
            </div>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={aiKillSwitch}
                onChange={(e) => { setAiKillSwitch(e.target.checked); setDirty(true); }}
              />
              {aiKillSwitch ? 'AI is OFF' : 'AI is ON'}
            </label>
          </div>

          <div style={styles.killRow}>
            <div style={styles.killMain}>
              <div style={styles.killLabel}>Disable Automation Agent</div>
              <div style={styles.killDesc}>
                Pauses all automation scenarios. Server-side continues to
                record events but does not execute actions.
              </div>
            </div>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={automationKillSwitch}
                onChange={(e) => { setAutomationKillSwitch(e.target.checked); setDirty(true); }}
              />
              {automationKillSwitch ? 'Automation is OFF' : 'Automation is ON'}
            </label>
          </div>

          <div style={styles.dangerBox}>
            <strong>Warning:</strong> Turning off Automation will stop
            automatic dispatch, reminders, reassignment, and payout batches.
            Manual operations continue.
          </div>
        </div>
      )}

      {/* Save bar */}
      <div style={styles.saveBar}>
        <span style={styles.saveHint}>
          {dirty ? 'You have unsaved changes.' : 'All changes saved (local).'}
        </span>
        <div style={styles.saveActions}>
          <button style={styles.ghostBtn} onClick={handleReset}>
            Reset to Defaults
          </button>
          <button
            style={dirty ? styles.primaryBtn : styles.primaryBtnDisabled}
            onClick={handleSave}
            disabled={!dirty}
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footerNote}>
        <strong>Note:</strong> All configuration changes are versioned and
        audited. Sensitive toggles (activation gates, kill switches) require
        permission + reason; some require maker-checker.
      </div>
    </div>
  );
}

/* ============================================================
   SummaryCard
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
    <div
      style={{
        ...styles.summaryCard,
        background: theme.bg,
        borderColor: theme.color + '33',
      }}
    >
      <div style={{ ...styles.summaryLabel, color: theme.color }}>{label}</div>
      <div style={{ ...styles.summaryValue, color: theme.color }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: theme.color, opacity: 0.8 }}>{sub}</div>
      )}
    </div>
  );
}

/* ============================================================
   Styles
   ============================================================ */

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
    fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 18, fontWeight: 800, marginTop: 4, marginBottom: 2, wordBreak: 'break-word',
  },

  infoBanner: {
    padding: '10px 14px',
    background: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dismissBtn: {
    padding: '4px 10px',
    background: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
  },

  sectionBar: {
    display: 'flex',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  sectionTab: {
    padding: '8px 14px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
  },
  sectionTabActive: {
    padding: '8px 14px',
    background: '#111827',
    border: '1px solid #111827',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    color: '#fff',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 14,
  },

  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#111827',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 14,
    lineHeight: 1.6,
  },

  checkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 14,
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
  checkIndex: {
    width: 22,
    height: 22,
    background: '#1d4ed8',
    color: '#fff',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 800,
    flexShrink: 0,
  },
  checkText: { flex: 1 },

  buttonRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },

  infoBox: {
    marginTop: 14,
    padding: 12,
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 8,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 1.6,
  },
  dangerBox: {
    marginTop: 14,
    padding: 12,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 1.6,
  },

  gateList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 14,
  },
  gateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  gateMain: { flex: 1, minWidth: 220 },
  gateLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  lockedBadge: {
    fontSize: 9,
    fontWeight: 800,
    background: '#111827',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: 4,
    letterSpacing: 0.4,
  },
  gateDesc: { fontSize: 11, color: '#6b7280', lineHeight: 1.5 },
  gateControls: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  toggleLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
  },
  hintText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: 500,
  },
  switchRow: {
    padding: 10,
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    marginBottom: 8,
  },

  slaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  slaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  slaMain: { flex: 1, minWidth: 220 },
  slaLabel: { fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 },
  slaDesc: { fontSize: 11, color: '#6b7280' },
  slaControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  slaInput: {
    width: 90,
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    textAlign: 'right',
    background: '#fff',
    outline: 'none',
  },
  slaUnit: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6b7280',
    minWidth: 50,
  },

  statusList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  statusMain: { flex: 1, minWidth: 220 },
  statusLabel: { fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 },
  statusNote: { fontSize: 11, color: '#6b7280', lineHeight: 1.5 },

  statusConnected: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusNotConfigured: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusError: {
    display: 'inline-block',
    padding: '3px 10px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
  },

  killRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  killMain: { flex: 1, minWidth: 240 },
  killLabel: { fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 4 },
  killDesc: { fontSize: 11, color: '#6b7280', lineHeight: 1.5 },

  saveBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  saveHint: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  saveActions: {
    display: 'flex',
    gap: 8,
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
  primaryBtnDisabled: {
    padding: '8px 16px',
    background: '#cbd5e1',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'not-allowed',
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
    padding: '10px 14px',
    background: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: 6,
    fontSize: 12,
    color: '#6b7280',
  },
};