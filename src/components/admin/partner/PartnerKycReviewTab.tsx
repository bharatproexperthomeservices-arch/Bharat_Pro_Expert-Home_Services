import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import type {
  PartnerRow,
  PartnerDocument,
  DocumentStatus,
  DocumentRejectReason,
} from '../../../types/partner';

import {
  fetchPartners,
  fetchPartnerDocuments,
  reviewDocument,
} from '../../../services/partnerApi';

/* ============================================================
   KYC & DOCUMENT REVIEW TAB
   Review queue for submitted / in-review documents
   ============================================================ */

export interface PartnerKycReviewTabProps {
  apiBase?: string;
  authToken?: string | null;
  onPartnerSelect?: (partnerId: string) => void;
}

const REVIEW_STATUSES: DocumentStatus[] = ['UPLOADED', 'IN_REVIEW'];

const REJECT_REASONS: { code: DocumentRejectReason; label: string }[] = [
  { code: 'BLURRY', label: 'Blurry' },
  { code: 'CROPPED', label: 'Cropped' },
  { code: 'EXPIRED', label: 'Expired' },
  { code: 'NAME_MISMATCH', label: 'Name mismatch' },
  { code: 'DOB_MISMATCH', label: 'DOB mismatch' },
  { code: 'PHOTO_MISMATCH', label: 'Photo mismatch' },
  { code: 'WRONG_DOC_TYPE', label: 'Wrong doc type' },
  { code: 'UNREADABLE', label: 'Unreadable' },
  { code: 'SUSPECTED_TAMPERING', label: 'Suspected tampering' },
  { code: 'DUPLICATE_IDENTITY', label: 'Duplicate identity' },
  { code: 'OTHER', label: 'Other' },
];

interface QueueItem {
  partner: PartnerRow;
  document: PartnerDocument;
}

export default function PartnerKycReviewTab({
  apiBase,
  authToken = null,
  onPartnerSelect,
}: PartnerKycReviewTabProps) {
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
          const docs = await fetchPartnerDocuments(partner.id, apiOpts);
          docs
            .filter((d) => REVIEW_STATUSES.includes(d.status))
            .forEach((document) => {
              allItems.push({ partner, document });
            });
        } catch {
          /* skip */
        }
      }
      setItems(allItems);
      setNotConfigured(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg === 'Not configured') {
        setNotConfigured('KYC review API not configured yet.');
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

  const handleDecision = async (
    decision: 'VERIFY' | 'REJECT' | 'REQUEST_REUPLOAD',
    reasonCode?: DocumentRejectReason,
    note?: string
  ) => {
    if (!selected) return;
    setActing(true);
    setActionMsg(null);
    try {
      await reviewDocument(
        selected.partner.id,
        selected.document.id,
        { decision, reason_code: reasonCode, note },
        apiOpts
      );
      setActionMsg(`Document ${decision.toLowerCase()} successfully.`);
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
    return <div style={styles.state}>Loading KYC review queue…</div>;
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
          <h3 style={{ margin: 0 }}>No documents pending review</h3>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
            Submitted and in-review documents will appear here.
          </p>
        </div>
      ) : (
        <div style={styles.layout}>
          <div style={styles.queue}>
            <div style={styles.queueHeader}>
              <span>Review Queue</span>
              <span style={styles.count}>{items.length}</span>
            </div>
            <div style={styles.queueBody}>
              {items.map((it) => (
                <button
                  key={it.document.id}
                  style={
                    selected?.document.id === it.document.id
                      ? styles.queueItemActive
                      : styles.queueItem
                  }
                  onClick={() => setSelected(it)}
                >
                  <div style={styles.queueItemName}>
                    {it.partner.legal_name}
                  </div>
                  <div style={styles.queueItemMeta}>
                    {it.document.doc_type} · v{it.document.version}
                  </div>
                  <div style={styles.queueItemMeta}>
                    <span style={styles.statusChip}>{it.document.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.detail}>
            {!selected ? (
              <div style={styles.state}>
                Select a document from the queue to review.
              </div>
            ) : (
              <DocumentReviewPanel
                item={selected}
                acting={acting}
                onDecision={handleDecision}
                onOpenPartner={() => {
                  onPartnerSelect?.(selected.partner.id);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentReviewPanel({
  item,
  acting,
  onDecision,
  onOpenPartner,
}: {
  item: QueueItem;
  acting: boolean;
  onDecision: (
    decision: 'VERIFY' | 'REJECT' | 'REQUEST_REUPLOAD',
    reasonCode?: DocumentRejectReason,
    note?: string
  ) => void;
  onOpenPartner: () => void;
}) {
  const [reasonCode, setReasonCode] = useState<DocumentRejectReason | ''>('');
  const [note, setNote] = useState('');

  const isReject = reasonCode !== '';

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <div style={styles.panelTitle}>{item.document.doc_type}</div>
          <div style={styles.panelSub}>
            {item.partner.legal_name} · {item.partner.partner_code}
          </div>
        </div>
        <button style={styles.linkBtn} onClick={onOpenPartner}>
          Open 360° →
        </button>
      </div>

      <div style={styles.panelGrid}>
        <Field label="Status" value={item.document.status} />
        <Field label="Version" value={`v${item.document.version}`} />
        <Field label="Method" value={item.document.method} />
        <Field label="Last 4" value={item.document.number_last4 ?? '—'} />
        <Field label="Issue date" value={item.document.issue_date ?? '—'} />
        <Field label="Expiry date" value={item.document.expiry_date ?? '—'} />
      </div>

      <div style={styles.placeholder}>
        <em>Document preview not available until storage is configured.</em>
      </div>

      <div style={styles.actionsBlock}>
        <div style={styles.actionsRow}>
          <button
            style={styles.verifyBtn}
            disabled={acting}
            onClick={() => onDecision('VERIFY')}
          >
            {acting ? 'Working…' : 'Verify'}
          </button>
          <button
            style={styles.reuploadBtn}
            disabled={acting}
            onClick={() =>
              onDecision('REQUEST_REUPLOAD', undefined, note || undefined)
            }
          >
            Request re-upload
          </button>
        </div>

        <div style={styles.rejectBlock}>
          <label style={styles.fieldLabel}>Reject reason</label>
          <select
            style={styles.select}
            value={reasonCode}
            onChange={(e) =>
              setReasonCode(e.target.value as DocumentRejectReason | '')
            }
          >
            <option value="">— Select reason —</option>
            {REJECT_REASONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>

          <label style={styles.fieldLabel}>Note (optional)</label>
          <textarea
            style={styles.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Add a note for the partner…"
          />

          <button
            style={styles.rejectBtn}
            disabled={acting || !isReject}
            onClick={() =>
              onDecision('REJECT', reasonCode || undefined, note || undefined)
            }
          >
            {acting ? 'Working…' : 'Reject document'}
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
  placeholder: {
    padding: 24,
    background: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: 8,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
  },
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
  reuploadBtn: {
    padding: '8px 16px',
    background: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  },
  rejectBlock: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  select: {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
  },
  textarea: {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  rejectBtn: {
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