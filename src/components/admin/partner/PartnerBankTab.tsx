import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import type {
  PartnerRow,
  PartnerBankAccount,
  BankStatus,
} from '../../../types/partner';

import {
  fetchPartners,
  fetchPartnerBank,
  verifyPartnerBank,
} from '../../../services/partnerApi';

/* ============================================================
   BANK ACCOUNT VERIFICATION TAB
   Queue: ADDED · VERIFICATION_PENDING · MISMATCH · FAILED
   ============================================================ */

export interface PartnerBankTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

const QUEUE_STATUSES: BankStatus[] = [
  'ADDED',
  'VERIFICATION_PENDING',
  'MISMATCH',
  'FAILED',
];

interface QueueItem {
  partner: PartnerRow;
  bank: PartnerBankAccount;
}

export default function PartnerBankTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: PartnerBankTabProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const apiOpts = useMemo(
    () => ({ baseUrl: apiBase, authToken }),
    [apiBase, authToken]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionMsg(null);
    try {
      const partnerRes = await fetchPartners(
        { lifecycle: 'UNDER_REVIEW', limit: 50 },
        apiOpts
      );
      const partnerList = Array.isArray(partnerRes)
        ? partnerRes
        : partnerRes.items ?? [];

      const allItems: QueueItem[] = [];
      for (const partner of partnerList) {
        try {
          const bank = await fetchPartnerBank(partner.id, apiOpts);
          if (bank && QUEUE_STATUSES.includes(bank.status)) {
            allItems.push({ partner, bank });
          }
        } catch {
          /* skip */
        }
      }
      setItems(allItems);
      setNotConfigured(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg === 'Not configured') {
        setNotConfigured('Bank verification API not configured yet.');
        setItems([]);
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

  const handleAction = async (
    action: 'VERIFY' | 'OVERRIDE' | 'RETRY',
    reason?: string
  ) => {
    if (!selected) return;
    setActing(true);
    setActionMsg(null);
    try {
      await verifyPartnerBank(
        selected.partner.id,
        { action, reason },
        apiOpts
      );
      setActionMsg(`Bank ${action.toLowerCase()} successful.`);
      setSelected(null);
      await load();
    } catch (e) {
      setActionMsg(
        `Failed: ${e instanceof Error ? e.message : 'Unknown error'}`
      );
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <div style={styles.state}>Loading bank queue…</div>;
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
      {actionMsg && <div style={styles.infoBanner}>{actionMsg}</div>}

      {items.length === 0 ? (
        <div style={styles.state}>
          <h3 style={{ margin: 0 }}>No bank verifications pending</h3>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
            Partners with bank status ADDED, PENDING, MISMATCH or FAILED will
            appear here.
          </p>
        </div>
      ) : (
        <div style={styles.layout}>
          <div style={styles.queue}>
            <div style={styles.queueHeader}>
              <span>Bank Queue</span>
              <span style={styles.count}>{items.length}</span>
            </div>
            <div style={styles.queueBody}>
              {items.map((it) => (
                <button
                  key={it.bank.id}
                  style={
                    selected?.bank.id === it.bank.id
                      ? styles.queueItemActive
                      : styles.queueItem
                  }
                  onClick={() => setSelected(it)}
                >
                  <div style={styles.queueItemName}>
                    {it.partner.legal_name}
                  </div>
                  <div style={styles.queueItemMeta}>
                    ****{it.bank.account_last4} · {it.bank.ifsc}
                  </div>
                  <div style={styles.queueItemMeta}>
                    <span style={styles.statusChip}>{it.bank.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.detail}>
            {!selected ? (
              <div style={styles.state}>
                Select a bank record from the queue to review.
              </div>
            ) : (
              <BankReviewPanel
                item={selected}
                acting={acting}
                onAction={handleAction}
                onOpenPartner={() => onPartnerSelect?.(selected.partner.id)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BankReviewPanel({
  item,
  acting,
  onAction,
  onOpenPartner,
}: {
  item: QueueItem;
  acting: boolean;
  onAction: (action: 'VERIFY' | 'OVERRIDE' | 'RETRY', reason?: string) => void;
  onOpenPartner: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <div style={styles.panelTitle}>
            {item.bank.holder_name}
          </div>
          <div style={styles.panelSub}>
            {item.partner.legal_name} · {item.partner.partner_code}
          </div>
        </div>
        <button style={styles.linkBtn} onClick={onOpenPartner}>
          Open 360° →
        </button>
      </div>

      <div style={styles.panelGrid}>
        <Field label="Status" value={item.bank.status} />
        <Field label="Account" value={`****${item.bank.account_last4}`} />
        <Field label="IFSC" value={item.bank.ifsc} />
        <Field label="Bank" value={item.bank.bank_name} />
        <Field label="UPI" value={item.bank.upi_masked ?? '—'} />
        <Field
          label="Name match"
          value={
            item.bank.name_match_score != null
              ? `${Math.round(item.bank.name_match_score * 100)}%`
              : '—'
          }
        />
        <Field label="Method" value={item.bank.method} />
        <Field
          label="Cooldown until"
          value={item.bank.change_cooldown_until ?? '—'}
        />
      </div>

      <div style={styles.actionsBlock}>
        <div style={styles.actionsRow}>
          <button
            style={styles.verifyBtn}
            disabled={acting}
            onClick={() => onAction('VERIFY')}
          >
            {acting ? 'Working…' : 'Verify bank'}
          </button>
          <button
            style={styles.retryBtn2}
            disabled={acting}
            onClick={() => onAction('RETRY')}
          >
            Retry verification
          </button>
        </div>

        <div style={styles.overrideBlock}>
          <label style={styles.fieldLabel}>
            Manual override reason (required for MISMATCH)
          </label>
          <textarea
            style={styles.textarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Explain why this override is justified…"
          />
          <button
            style={styles.overrideBtn}
            disabled={acting || reason.trim().length < 4}
            onClick={() => onAction('OVERRIDE', reason.trim())}
          >
            {acting ? 'Working…' : 'Override as verified'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.fieldValue}>{value}</div>
    </div>
  );
}

/* -------------------- Styles -------------------- */

const styles: Record<string, CSSProperties> = {
  root: { padding: 4 },
  layout: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: 14,
    minHeight: 400,
  },
  queue: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 600,
  },
  queueHeader: {
    padding: '10px 14px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
  },
  count: {
    fontSize: 11,
    background: '#e5e7eb',
    color: '#374151',
    padding: '2px 8px',
    borderRadius: 999,
  },
  queueBody: {
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    overflowY: 'auto',
  },
  queueItem: {
    textAlign: 'left',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    padding: 10,
    cursor: 'pointer',
  },
  queueItemActive: {
    textAlign: 'left',
    background: '#eff6ff',
    border: '1px solid #93c5fd',
    borderRadius: 6,
    padding: 10,
    cursor: 'pointer',
  },
  queueItemName: { fontWeight: 600, fontSize: 13, marginBottom: 2 },
  queueItemMeta: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  statusChip: {
    display: 'inline-block',
    background: '#fef3c7',
    color: '#92400e',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  detail: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 18,
  },
  panel: { display: 'flex', flexDirection: 'column', gap: 14 },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 10,
  },
  panelTitle: { fontSize: 16, fontWeight: 700, color: '#111827' },
  panelSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  panelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 10,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 2 },
  fieldLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#6b7280',
    fontWeight: 700,
  },
  fieldValue: { fontSize: 13, color: '#111827' },
  actionsBlock: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  actionsRow: { display: 'flex', gap: 8 },
  verifyBtn: {
    padding: '8px 16px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  },
  retryBtn2: {
    padding: '8px 16px',
    background: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  },
  overrideBlock: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  textarea: {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  overrideBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    padding: '8px 16px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
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
  infoBanner: {
    background: '#e0f2fe',
    color: '#075985',
    border: '1px solid #bae6fd',
    padding: '10px 14px',
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 13,
  },
};