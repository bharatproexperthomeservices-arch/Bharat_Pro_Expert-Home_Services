/* ============================================================
   BHARAT PRO EXPERT — PARTNER API SERVICE
   Blueprint v2 — All partner endpoints in one place
   ============================================================ */

import type {
  PartnerRow,
  PartnerKpis,
  PartnerDocument,
  PartnerBankAccount,
  PartnerService,
  MatrixItem,
  PartnerMatrixCompliance,
  EligibilityResult,
  PartnerReadiness,
  PartnerWalletEntry,
  PartnerPayout,
  PartnerCase,
  PartnerStatusHistory,
  PaginatedResponse,
} from '../types/partner';

const API_BASE_FALLBACK = '/api';

function getBase(override?: string): string {
  if (override) return override;
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return env?.VITE_API_BASE || API_BASE_FALLBACK;
}

export interface PartnerApiOptions {
  baseUrl?: string;
  authToken?: string | null;
  signal?: AbortSignal;
}

export class PartnerApiError extends Error {
  status: number;
  detail?: string;
  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = 'PartnerApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(
  path: string,
  opts: PartnerApiOptions = {},
  init?: RequestInit
): Promise<T> {
  const base = getBase(opts.baseUrl);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (opts.authToken) headers.Authorization = `Bearer ${opts.authToken}`;
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
    signal: opts.signal,
  });

  if (res.status === 404 || res.status === 501) {
    throw new PartnerApiError(res.status, 'Not configured', path);
  }
  if (!res.ok) {
    let detail: string | undefined;
    try {
      const j = (await res.json()) as { detail?: string; message?: string };
      detail = j.detail || j.message;
    } catch {
      /* ignore */
    }
    throw new PartnerApiError(res.status, `HTTP ${res.status} on ${path}`, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* -------------------- KPI / Directory -------------------- */

export function fetchPartnerKpis(opts?: PartnerApiOptions) {
  return request<PartnerKpis>('/admin/partners/kpis', opts);
}

export function fetchPartners(
  params: { q?: string; lifecycle?: string; hub?: string; limit?: number; cursor?: string },
  opts?: PartnerApiOptions
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<PaginatedResponse<PartnerRow> | PartnerRow[]>(
    `/admin/partners${suffix}`,
    opts
  );
}

export function fetchPartner(id: string, opts?: PartnerApiOptions) {
  return request<PartnerRow>(`/admin/partners/${encodeURIComponent(id)}`, opts);
}

export interface TransitionPayload {
  action: string;
  reason_code?: string;
  note?: string;
  scope?: string;
  expires_at?: string;
}

export function transitionPartner(
  id: string,
  payload: TransitionPayload,
  opts?: PartnerApiOptions
) {
  return request<{ ok: boolean; lifecycle_status: string }>(
    `/admin/partners/${encodeURIComponent(id)}/transition`,
    opts,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export function fetchPartnerReadiness(id: string, opts?: PartnerApiOptions) {
  return request<PartnerReadiness>(
    `/admin/partners/${encodeURIComponent(id)}/readiness`,
    opts
  );
}

export function fetchPartnerEligibility(
  id: string,
  params: { category: string; bookingId?: string },
  opts?: PartnerApiOptions
) {
  const qs = new URLSearchParams({ category: params.category });
  if (params.bookingId) qs.set('bookingId', params.bookingId);
  return request<EligibilityResult>(
    `/admin/partners/${encodeURIComponent(id)}/eligibility?${qs.toString()}`,
    opts
  );
}

export function fetchPartnerDocuments(id: string, opts?: PartnerApiOptions) {
  return request<PartnerDocument[]>(
    `/admin/partners/${encodeURIComponent(id)}/documents`,
    opts
  );
}

export function fetchDocumentSignedUrl(
  partnerId: string,
  docId: string,
  opts?: PartnerApiOptions
) {
  return request<{ url: string; expires_at: string }>(
    `/admin/partners/${encodeURIComponent(partnerId)}/documents/${encodeURIComponent(docId)}/url`,
    opts
  );
}

export interface ReviewDocumentPayload {
  decision: 'VERIFY' | 'REJECT' | 'REQUEST_REUPLOAD';
  reason_code?: string;
  note?: string;
}

export function reviewDocument(
  partnerId: string,
  docId: string,
  payload: ReviewDocumentPayload,
  opts?: PartnerApiOptions
) {
  return request<{ ok: boolean; status: string }>(
    `/admin/partners/${encodeURIComponent(partnerId)}/documents/${encodeURIComponent(docId)}/review`,
    opts,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export function fetchPartnerBank(id: string, opts?: PartnerApiOptions) {
  return request<PartnerBankAccount | null>(
    `/admin/partners/${encodeURIComponent(id)}/bank`,
    opts
  );
}

export interface BankVerifyPayload {
  action: 'VERIFY' | 'OVERRIDE' | 'RETRY';
  reason?: string;
}

export function verifyPartnerBank(
  partnerId: string,
  payload: BankVerifyPayload,
  opts?: PartnerApiOptions
) {
  return request<{ ok: boolean; status: string }>(
    `/admin/partners/${encodeURIComponent(partnerId)}/bank/verify`,
    opts,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export function fetchPartnerServices(id: string, opts?: PartnerApiOptions) {
  return request<PartnerService[]>(
    `/admin/partners/${encodeURIComponent(id)}/services`,
    opts
  );
}

export function updatePartnerServices(
  id: string,
  services: Partial<PartnerService>[],
  opts?: PartnerApiOptions
) {
  return request<{ ok: boolean }>(
    `/admin/partners/${encodeURIComponent(id)}/services`,
    opts,
    { method: 'PUT', body: JSON.stringify({ services }) }
  );
}

export function fetchMatrix(categoryId: string, opts?: PartnerApiOptions) {
  return request<MatrixItem[]>(
    `/admin/matrix/${encodeURIComponent(categoryId)}`,
    opts
  );
}

export function fetchPartnerMatrixCompliance(
  partnerId: string,
  categoryId: string,
  opts?: PartnerApiOptions
) {
  return request<PartnerMatrixCompliance[]>(
    `/admin/partners/${encodeURIComponent(partnerId)}/matrix/${encodeURIComponent(categoryId)}`,
    opts
  );
}

export interface KitActionPayload {
  action: 'ISSUE' | 'RETURN' | 'MARK_MISSING' | 'REPLACE_DAMAGED' | 'RECOVER';
  item_id: string;
  note?: string;
  evidence_media_id?: string;
}

export function partnerKitAction(
  partnerId: string,
  payload: KitActionPayload,
  opts?: PartnerApiOptions
) {
  return request<{ ok: boolean }>(
    `/admin/partners/${encodeURIComponent(partnerId)}/kit/issue`,
    opts,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export function fetchPartnerWallet(id: string, opts?: PartnerApiOptions) {
  return request<{ entries: PartnerWalletEntry[]; balance_paise: number }>(
    `/admin/partners/${encodeURIComponent(id)}/wallet`,
    opts
  );
}

export function fetchPartnerPayouts(id: string, opts?: PartnerApiOptions) {
  return request<PartnerPayout[]>(
    `/admin/partners/${encodeURIComponent(id)}/payouts`,
    opts
  );
}

export interface WalletAdjustmentPayload {
  type: 'ADJUSTMENT' | 'PENALTY' | 'INCENTIVE';
  amount_paise: number;
  reason: string;
  evidence?: string;
}

export function createWalletAdjustment(
  partnerId: string,
  payload: WalletAdjustmentPayload,
  opts?: PartnerApiOptions
) {
  return request<{ id: string; status: string }>(
    `/admin/wallet/adjustments`,
    opts,
    { method: 'POST', body: JSON.stringify({ partner_id: partnerId, ...payload }) }
  );
}

export function fetchPartnerCases(id: string, opts?: PartnerApiOptions) {
  return request<PartnerCase[]>(
    `/admin/partners/${encodeURIComponent(id)}/cases`,
    opts
  );
}

export function fetchPartnerStatusHistory(id: string, opts?: PartnerApiOptions) {
  return request<PartnerStatusHistory[]>(
    `/admin/partners/${encodeURIComponent(id)}/status-history`,
    opts
  );
}

export function fetchPartnerAutomationRuns(
  params: { partner_id?: string; limit?: number },
  opts?: PartnerApiOptions
) {
  const qs = new URLSearchParams();
  if (params.partner_id) qs.set('partner_id', params.partner_id);
  if (params.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<{ items: unknown[] }>(
    `/admin/automation/partner-runs${suffix}`,
    opts
  );
}

export function fetchLegacyAudit(opts?: PartnerApiOptions) {
  return request<unknown>('/admin/legacy-audit', opts);
}