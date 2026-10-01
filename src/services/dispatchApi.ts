/* ============================================================
   BHARAT PRO EXPERTS — DISPATCH API SERVICE
   Self-contained (no external type import)
   ============================================================ */

/* ---------- INLINE TYPES (avoid cross-file import) ---------- */

type DispatchStage =
  | 'QUEUED'
  | 'BROADCASTING'
  | 'AWAITING_ACCEPT'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'FAILED'
  | 'REASSIGNING';

type OfferOutcome =
  | 'PENDING'
  | 'SEEN'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

type ExceptionType =
  | 'NO_ELIGIBLE_PARTNER'
  | 'ALL_DECLINED'
  | 'OFFER_TIMEOUT'
  | 'CONCURRENCY_VIOLATION'
  | 'PARTNER_CANCELLED'
  | 'OTHER';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

type DispatchActionType =
  | 'RETRY'
  | 'FORCE_ASSIGN'
  | 'CANCEL_RUN'
  | 'EXTEND_OFFER'
  | 'MANUAL_ASSIGN';

interface DispatchOfferScoreComponent {
  label: string;
  value: number;
  weight: number;
  raw?: string;
}

interface DispatchOffer {
  id: string;
  booking_id: string;
  booking_code: string;
  partner_id: string;
  partner_name: string;
  partner_code: string;
  partner_mobile_masked: string;
  stage: DispatchStage;
  outcome: OfferOutcome;
  score: number;
  score_components: DispatchOfferScoreComponent[];
  distance_km: number;
  eta_min: number;
  sent_at: string;
  seen_at?: string;
  responded_at?: string;
  expires_at: string;
  decline_reason?: string;
  broadcast_stage?: number;
  delivery_status?: 'DELIVERED' | 'FAILED' | 'UNKNOWN';
}

interface DispatchRun {
  id: string;
  booking_id: string;
  booking_code: string;
  booking_status: string;
  customer_name: string;
  customer_mobile_masked: string;
  service_name: string;
  city_name: string;
  sector_name?: string;
  scheduled_at: string;
  stage: DispatchStage;
  offers_sent: number;
  offers_pending: number;
  offers_accepted: number;
  offers_declined: number;
  offers_expired: number;
  first_accept_at?: string;
  winner_partner_id?: string;
  winner_partner_name?: string;
  winner_partner_code?: string;
  reassignment_count: number;
  started_at: string;
  ended_at?: string;
  duration_sec?: number;
  exception?: string;
  exception_type?: ExceptionType;
  current_broadcast_stage?: number;
  total_broadcast_stages?: number;
  atomic_accept_confirmed?: boolean;
  atomicity_ref?: string;
}

interface DispatchException {
  id: string;
  booking_id: string;
  booking_code: string;
  type: ExceptionType;
  message: string;
  recommended_action: string;
  severity: Severity;
  created_at: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolution_code?: string;
  resolution_note?: string;
}

interface DispatchKpis {
  active_runs: number;
  awaiting_accept: number;
  broadcasting_now: number;
  accepted_today: number;
  expired_today: number;
  failed_today: number;
  avg_accept_time_sec: number;
  acceptance_rate_7d: number;
  reassignments_today: number;
  total_offers_today: number;
  total_accepted_today: number;
  total_declined_today: number;
  total_expired_today: number;
  as_of: string;
}

interface EligiblePartner {
  partner_id: string;
  partner_name: string;
  partner_code: string;
  mobile_masked: string;
  distance_km: number;
  eta_min: number;
  score: number;
  score_components: DispatchOfferScoreComponent[];
  availability: string;
  rating: number | null;
  rating_sample: number;
  recent_jobs: number;
  eligible: boolean;
  reasons_if_not: string[];
  reasons_if_not_labels?: string[];
}

interface DispatchMonitorSnapshot {
  runs: DispatchRun[];
  offers: DispatchOffer[];
  exceptions: DispatchException[];
  kpis: DispatchKpis;
  as_of: string;
}

interface DispatchRuleConfig {
  broadcast_stages: number;
  offer_timeout_sec: number;
  max_concurrent_offers: number;
  min_score_threshold: number;
  auto_reassign_on_no_accept: boolean;
  reassign_delay_sec: number;
  crew_travel_buffer_min: number;
  initial_radius_km: number;
  widened_radius_km: number;
  escalate_to_hub_min: number;
}

interface DispatchRunFilters {
  stage?: DispatchStage | 'ALL';
  city?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

interface DispatchExceptionFilters {
  acknowledged?: boolean;
  severity?: Severity;
  limit?: number;
}

interface DispatchActionPayload {
  action: DispatchActionType;
  partner_id?: string;
  reason?: string;
  extend_sec?: number;
}

interface ManualAssignPayload {
  booking_id: string;
  partner_id: string;
  reason: string;
}

interface AcknowledgeExceptionPayload {
  resolution_code?: string;
  resolution_note?: string;
}

/* ============================================================
   1. BASE CONFIG + ERROR CLASS
   ============================================================ */

const API_BASE_FALLBACK = '/api';
const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 800;
const CACHE_TTL_MS = 5000;

function getBase(override?: string): string {
  if (override) return override;
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return env?.VITE_API_BASE || API_BASE_FALLBACK;
}

export interface DispatchApiOptions {
  baseUrl?: string;
  authToken?: string | null;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryAttempts?: number;
  skipCache?: boolean;
}

export class DispatchApiError extends Error {
  status: number;
  detail?: string;
  isNotConfigured: boolean;
  isNetwork: boolean;
  isTimeout: boolean;
  isConcurrencyConflict: boolean;

  constructor(
    status: number,
    message: string,
    detail?: string,
    flags?: {
      isNotConfigured?: boolean;
      isNetwork?: boolean;
      isTimeout?: boolean;
      isConcurrencyConflict?: boolean;
    }
  ) {
    super(message);
    this.name = 'DispatchApiError';
    this.status = status;
    this.detail = detail;
    this.isNotConfigured = flags?.isNotConfigured ?? false;
    this.isNetwork = flags?.isNetwork ?? false;
    this.isTimeout = flags?.isTimeout ?? false;
    this.isConcurrencyConflict = flags?.isConcurrencyConflict ?? false;
  }
}

/* ============================================================
   2. GENERIC REQUEST
   ============================================================ */

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

async function request<T>(
  path: string,
  opts: DispatchApiOptions = {},
  init?: RequestInit
): Promise<T> {
  const base = getBase(opts.baseUrl);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = Math.max(1, opts.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS);

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener('abort', () => controller.abort());
    }

    try {
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
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.status === 404 || res.status === 501) {
        throw new DispatchApiError(res.status, 'Not configured', path, {
          isNotConfigured: true,
        });
      }

      if (res.status === 409) {
        let detail: string | undefined;
        try {
          const j = (await res.json()) as { code?: string; message?: string };
          detail = j.code || j.message;
        } catch {
          /* ignore */
        }
        throw new DispatchApiError(
          res.status,
          'Booking already assigned',
          detail,
          { isConcurrencyConflict: true }
        );
      }

      if (!res.ok) {
        let detail: string | undefined;
        try {
          const j = (await res.json()) as {
            detail?: string;
            message?: string;
          };
          detail = j.detail || j.message;
        } catch {
          /* ignore */
        }

        const err = new DispatchApiError(
          res.status,
          `HTTP ${res.status} on ${path}`,
          detail
        );

        if (
          isRetryableStatus(res.status) &&
          attempt < maxAttempts &&
          !opts.signal?.aborted
        ) {
          lastError = err;
          await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
          continue;
        }
        throw err;
      }

      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    } catch (e) {
      clearTimeout(timer);

      if (e instanceof DOMException && e.name === 'AbortError') {
        const isUserAbort = opts.signal?.aborted;
        if (isUserAbort) throw e;

        const timeoutErr = new DispatchApiError(
          0,
          `Request timed out after ${timeoutMs}ms`,
          path,
          { isTimeout: true }
        );

        if (attempt < maxAttempts) {
          lastError = timeoutErr;
          await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
          continue;
        }
        throw timeoutErr;
      }

      if (e instanceof DispatchApiError) throw e;

      const netErr = new DispatchApiError(
        0,
        e instanceof Error ? e.message : 'Network error',
        path,
        { isNetwork: true }
      );

      if (attempt < maxAttempts && !opts.signal?.aborted) {
        lastError = netErr;
        await sleep(DEFAULT_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw netErr;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new DispatchApiError(0, 'Unknown error');
}

/* ============================================================
   3. CACHE
   ============================================================ */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet<T>(key: string, value: T, ttlMs = CACHE_TTL_MS): void {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearDispatchCache(): void {
  memoryCache.clear();
}

/* ============================================================
   4-10. API FUNCTIONS
   ============================================================ */

export function fetchDispatchKpis(opts?: DispatchApiOptions) {
  const key = 'dispatch:kpis';
  if (!opts?.skipCache) {
    const cached = cacheGet<DispatchKpis>(key);
    if (cached) return Promise.resolve(cached);
  }
  return request<DispatchKpis>('/admin/dispatch/kpis', opts).then((data) => {
    cacheSet(key, data, 3000);
    return data;
  });
}

export function fetchDispatchSnapshot(opts?: DispatchApiOptions) {
  return request<DispatchMonitorSnapshot>('/admin/dispatch/monitor', opts);
}

export function fetchDispatchRuns(
  filters: DispatchRunFilters,
  opts?: DispatchApiOptions
) {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<{ items: DispatchRun[]; total: number; cursor?: string }>(
    `/admin/dispatch/runs${suffix}`,
    opts
  );
}

export function fetchDispatchRun(id: string, opts?: DispatchApiOptions) {
  return request<DispatchRun>(
    `/admin/dispatch/runs/${encodeURIComponent(id)}`,
    opts
  );
}

export function fetchDispatchRunOffers(
  runId: string,
  opts?: DispatchApiOptions
) {
  return request<DispatchOffer[]>(
    `/admin/dispatch/runs/${encodeURIComponent(runId)}/offers`,
    opts
  );
}

export function fetchEligiblePartners(
  bookingId: string,
  opts?: DispatchApiOptions
) {
  return request<EligiblePartner[]>(
    `/admin/dispatch/bookings/${encodeURIComponent(
      bookingId
    )}/eligible-partners`,
    opts
  );
}

export function fetchDispatchExceptions(
  filters: DispatchExceptionFilters = {},
  opts?: DispatchApiOptions
) {
  const qs = new URLSearchParams();
  if (filters.acknowledged !== undefined)
    qs.set('acknowledged', String(filters.acknowledged));
  if (filters.severity) qs.set('severity', filters.severity);
  if (filters.limit) qs.set('limit', String(filters.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<{ items: DispatchException[] }>(
    `/admin/dispatch/exceptions${suffix}`,
    opts
  );
}

export function acknowledgeException(
  id: string,
  payload: AcknowledgeExceptionPayload = {},
  opts?: DispatchApiOptions
) {
  return request<{ ok: boolean; acknowledged_at: string }>(
    `/admin/dispatch/exceptions/${encodeURIComponent(id)}/acknowledge`,
    opts,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export function dispatchAction(
  runId: string,
  payload: DispatchActionPayload,
  opts?: DispatchApiOptions
) {
  return request<{ ok: boolean; stage: string }>(
    `/admin/dispatch/runs/${encodeURIComponent(runId)}/action`,
    opts,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export function manualAssign(
  payload: ManualAssignPayload,
  opts?: DispatchApiOptions
) {
  return request<{ ok: boolean; run_id: string }>(
    '/admin/dispatch/manual-assign',
    opts,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export function fetchDispatchRules(opts?: DispatchApiOptions) {
  return request<DispatchRuleConfig>('/admin/dispatch/rules', opts);
}

export function updateDispatchRules(
  config: DispatchRuleConfig,
  opts?: DispatchApiOptions
) {
  return request<{ ok: boolean; updated_at: string }>(
    '/admin/dispatch/rules',
    opts,
    { method: 'PUT', body: JSON.stringify(config) }
  );
}

export function resetDispatchRules(opts?: DispatchApiOptions) {
  return request<DispatchRuleConfig>('/admin/dispatch/rules/reset', opts, {
    method: 'POST',
  });
}

/* ============================================================
   11. REALTIME (SSE)
   ============================================================ */

export interface DispatchRealtimeHandlers {
  onRun?: (run: DispatchRun) => void;
  onOffer?: (offer: DispatchOffer) => void;
  onException?: (ex: DispatchException) => void;
  onKpi?: (kpis: DispatchKpis) => void;
  onError?: (err: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export interface DispatchRealtimeConnection {
  close: () => void;
  isConnected: () => boolean;
}

export function connectDispatchRealtime(
  handlers: DispatchRealtimeHandlers,
  opts: { baseUrl?: string; authToken?: string | null } = {}
): DispatchRealtimeConnection {
  const base = getBase(opts.baseUrl);
  const url = new URL(
    `${base}/admin/dispatch/stream`,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
  );
  if (opts.authToken) url.searchParams.set('token', opts.authToken);

  let connected = false;
  let eventSource: EventSource | null = null;
  let heartbeatTimer: number | null = null;

  try {
    eventSource = new EventSource(url.toString());

    eventSource.onopen = () => {
      connected = true;
      handlers.onConnected?.();
    };

    eventSource.addEventListener('run', (e) => {
      try {
        handlers.onRun?.(JSON.parse((e as MessageEvent).data) as DispatchRun);
      } catch {
        /* ignore */
      }
    });

    eventSource.addEventListener('offer', (e) => {
      try {
        handlers.onOffer?.(
          JSON.parse((e as MessageEvent).data) as DispatchOffer
        );
      } catch {
        /* ignore */
      }
    });

    eventSource.addEventListener('exception', (e) => {
      try {
        handlers.onException?.(
          JSON.parse((e as MessageEvent).data) as DispatchException
        );
      } catch {
        /* ignore */
      }
    });

    eventSource.addEventListener('kpi', (e) => {
      try {
        handlers.onKpi?.(JSON.parse((e as MessageEvent).data) as DispatchKpis);
      } catch {
        /* ignore */
      }
    });

    eventSource.onerror = () => {
      connected = false;
      handlers.onDisconnected?.();
      handlers.onError?.(new Error('Realtime stream error'));
    };

    heartbeatTimer = window.setInterval(() => {
      if (eventSource?.readyState !== EventSource.OPEN && connected) {
        connected = false;
        handlers.onDisconnected?.();
      }
    }, 30000);
  } catch (e) {
    handlers.onError?.(e instanceof Error ? e : new Error('Realtime failed'));
  }

  return {
    close: () => {
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      eventSource?.close();
      eventSource = null;
      connected = false;
    },
    isConnected: () => connected,
  };
}

/* ============================================================
   12. BULK HELPERS
   ============================================================ */

export async function fetchDispatchDashboard(
  filters: DispatchRunFilters = { limit: 100 },
  opts?: DispatchApiOptions
): Promise<{
  kpis: DispatchKpis | null;
  runs: DispatchRun[];
  exceptions: DispatchException[];
  errors: string[];
}> {
  const errors: string[] = [];

  const [kpiRes, runsRes, exRes] = await Promise.allSettled([
    fetchDispatchKpis(opts),
    fetchDispatchRuns(filters, opts),
    fetchDispatchExceptions({ limit: 50 }, opts),
  ]);

  let kpis: DispatchKpis | null = null;
  let runs: DispatchRun[] = [];
  let exceptions: DispatchException[] = [];

  if (kpiRes.status === 'fulfilled') kpis = kpiRes.value;
  else errors.push(kpiRes.reason?.message || 'KPI fetch failed');

  if (runsRes.status === 'fulfilled') runs = runsRes.value.items ?? [];
  else errors.push(runsRes.reason?.message || 'Runs fetch failed');

  if (exRes.status === 'fulfilled') exceptions = exRes.value.items ?? [];
  else errors.push(exRes.reason?.message || 'Exceptions fetch failed');

  return { kpis, runs, exceptions, errors };
}

export async function fetchRunWithOffers(
  runId: string,
  opts?: DispatchApiOptions
): Promise<{
  run: DispatchRun | null;
  offers: DispatchOffer[];
  eligible: EligiblePartner[];
  errors: string[];
}> {
  const errors: string[] = [];
  const [runRes, offerRes] = await Promise.allSettled([
    fetchDispatchRun(runId, opts),
    fetchDispatchRunOffers(runId, opts),
  ]);

  let run: DispatchRun | null = null;
  let offers: DispatchOffer[] = [];

  if (runRes.status === 'fulfilled') run = runRes.value;
  else errors.push(runRes.reason?.message || 'Run fetch failed');

  if (offerRes.status === 'fulfilled') offers = offerRes.value;
  else errors.push(offerRes.reason?.message || 'Offers fetch failed');

  let eligible: EligiblePartner[] = [];
  if (run) {
    try {
      eligible = await fetchEligiblePartners(run.booking_id, opts);
    } catch (e) {
      errors.push(
        e instanceof Error ? e.message : 'Eligible partners fetch failed'
      );
    }
  }

  return { run, offers, eligible, errors };
}

/* ============================================================
   13. CSV EXPORT
   ============================================================ */

export function exportDispatchRunsCsv(runs: DispatchRun[]): void {
  const rows: string[] = [
    'Run ID,Booking Code,Customer,Service,City,Sector,Stage,Offers Sent,Pending,Accepted,Declined,Expired,Winner,Duration (sec),Started,Ended,Exception',
  ];
  const safe = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

  runs.forEach((r) => {
    rows.push(
      [
        safe(r.id),
        safe(r.booking_code),
        safe(r.customer_name),
        safe(r.service_name),
        safe(r.city_name),
        safe(r.sector_name ?? ''),
        safe(r.stage),
        String(r.offers_sent),
        String(r.offers_pending),
        String(r.offers_accepted),
        String(r.offers_declined),
        String(r.offers_expired),
        safe(r.winner_partner_name ?? ''),
        String(r.duration_sec ?? ''),
        safe(r.started_at),
        safe(r.ended_at ?? ''),
        safe(r.exception ?? ''),
      ].join(',')
    );
  });

  downloadCsv(rows.join('\n'), 'dispatch-runs.csv');
}

export function exportDispatchExceptionsCsv(
  exceptions: DispatchException[]
): void {
  const rows: string[] = [
    'Exception ID,Booking Code,Type,Severity,Message,Recommended Action,Created,Acknowledged,Acknowledged By',
  ];
  const safe = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

  exceptions.forEach((ex) => {
    rows.push(
      [
        safe(ex.id),
        safe(ex.booking_code),
        safe(ex.type),
        safe(ex.severity),
        safe(ex.message),
        safe(ex.recommended_action),
        safe(ex.created_at),
        ex.acknowledged ? 'YES' : 'NO',
        safe(ex.acknowledged_by ?? ''),
      ].join(',')
    );
  });

  downloadCsv(rows.join('\n'), 'dispatch-exceptions.csv');
}

function downloadCsv(content: string, filename: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}