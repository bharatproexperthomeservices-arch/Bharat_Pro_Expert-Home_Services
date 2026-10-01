/* ============================================================
   BHARAT PRO EXPERTS — HUB API SERVICE (FULL PRODUCTION)
   Leaflet + OpenStreetMap · Real backend only
   ------------------------------------------------------------
   SECTIONS:
   1.  Base config + error class
   2.  Generic request (retry + timeout + abort)
   3.  Cache layer
   4.  Hub CRUD (list, get, create, update, delete, archive)
   5.  Hub status toggles (activate / deactivate / maintenance)
   6.  Hub sectors (list, add, update, delete)
   7.  Hub coverage (get, update)
   8.  Hub KPIs
   9.  Hub performance
   10. Geocoding (server-side proxy)
   11. Bulk helpers (dashboard, hub detail)
   12. Realtime (SSE)
   13. CSV export
   14. Clear cache
   ============================================================ */

import type {
  Hub,
  HubKpis,
  HubListResponse,
  HubDetailResponse,
  HubMutationResponse,
  HubSector,
  HubSectorFormPayload,
  HubSectorMutationResponse,
  HubFormPayload,
  HubFilters,
  HubGeocodeResponse,
  LatLng,
  HubCoverage,
} from '../types/hub';

/* ============================================================
   1. BASE CONFIG + ERROR CLASS
   ============================================================ */

const API_BASE_FALLBACK = '/api';
const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 800;
const CACHE_TTL_MS = 10000;

function getBase(override?: string): string {
  if (override) return override;
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return env?.VITE_API_BASE || API_BASE_FALLBACK;
}

export interface HubApiOptions {
  baseUrl?: string;
  authToken?: string | null;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryAttempts?: number;
  skipCache?: boolean;
}

export class HubApiError extends Error {
  status: number;
  detail?: string;
  code?: string;
  isNotConfigured: boolean;
  isNetwork: boolean;
  isTimeout: boolean;
  isValidation: boolean;
  isConflict: boolean;
  isForbidden: boolean;
  isNotFound: boolean;

  constructor(
    status: number,
    message: string,
    detail?: string,
    flags?: {
      code?: string;
      isNotConfigured?: boolean;
      isNetwork?: boolean;
      isTimeout?: boolean;
      isValidation?: boolean;
      isConflict?: boolean;
      isForbidden?: boolean;
      isNotFound?: boolean;
    }
  ) {
    super(message);
    this.name = 'HubApiError';
    this.status = status;
    this.detail = detail;
    this.code = flags?.code;
    this.isNotConfigured = flags?.isNotConfigured ?? false;
    this.isNetwork = flags?.isNetwork ?? false;
    this.isTimeout = flags?.isTimeout ?? false;
    this.isValidation = flags?.isValidation ?? false;
    this.isConflict = flags?.isConflict ?? false;
    this.isForbidden = flags?.isForbidden ?? false;
    this.isNotFound = flags?.isNotFound ?? false;
  }
}

/* ============================================================
   2. GENERIC REQUEST (retry + timeout + abort)
   ============================================================ */

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

async function request<T>(
  path: string,
  opts: HubApiOptions = {},
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

      // Not configured
      if (res.status === 404 || res.status === 501) {
        throw new HubApiError(res.status, 'Not configured', path, {
          isNotConfigured: true,
        });
      }

      // Forbidden
      if (res.status === 403) {
        let detail: string | undefined;
        try {
          const j = (await res.json()) as { detail?: string; message?: string };
          detail = j.detail || j.message;
        } catch {
          /* ignore */
        }
        throw new HubApiError(res.status, 'Permission denied', detail, {
          isForbidden: true,
        });
      }

      // Not found
      if (res.status === 404) {
        let detail: string | undefined;
        try {
          const j = (await res.json()) as { detail?: string; message?: string };
          detail = j.detail || j.message;
        } catch {
          /* ignore */
        }
        throw new HubApiError(res.status, 'Hub not found', detail, {
          isNotFound: true,
        });
      }

      // Validation
      if (res.status === 400 || res.status === 422) {
        let detail: string | undefined;
        let code: string | undefined;
        try {
          const j = (await res.json()) as {
            detail?: string;
            message?: string;
            code?: string;
          };
          detail = j.detail || j.message;
          code = j.code;
        } catch {
          /* ignore */
        }
        throw new HubApiError(res.status, 'Validation failed', detail, {
          isValidation: true,
          code,
        });
      }

      // Conflict
      if (res.status === 409) {
        let detail: string | undefined;
        let code: string | undefined;
        try {
          const j = (await res.json()) as { code?: string; message?: string };
          detail = j.code || j.message;
          code = j.code;
        } catch {
          /* ignore */
        }
        throw new HubApiError(res.status, 'Conflict', detail, {
          isConflict: true,
          code,
        });
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

        const err = new HubApiError(
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

        const timeoutErr = new HubApiError(
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

      if (e instanceof HubApiError) throw e;

      const netErr = new HubApiError(
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
    : new HubApiError(0, 'Unknown error');
}

/* ============================================================
   3. CACHE LAYER
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

export function clearHubCache(): void {
  memoryCache.clear();
}

export function invalidateHubCache(hubId?: string): void {
  if (!hubId) {
    memoryCache.clear();
    return;
  }
  const keysToDelete: string[] = [];
  memoryCache.forEach((_, key) => {
    if (key.includes(hubId) || key.startsWith('hub:list')) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((k) => memoryCache.delete(k));
}

/* ============================================================
   4. HUB CRUD
   ============================================================ */

export function fetchHubs(
  filters: HubFilters = {},
  opts?: HubApiOptions
): Promise<HubListResponse> {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const cacheKey = `hub:list:${suffix}`;

  if (!opts?.skipCache) {
    const cached = cacheGet<HubListResponse>(cacheKey);
    if (cached) return Promise.resolve(cached);
  }

  return request<HubListResponse>(`/admin/hubs${suffix}`, opts).then((data) => {
    cacheSet(cacheKey, data);
    return data;
  });
}

export function fetchHub(
  hubId: string,
  opts?: HubApiOptions
): Promise<HubDetailResponse> {
  const cacheKey = `hub:detail:${hubId}`;
  if (!opts?.skipCache) {
    const cached = cacheGet<HubDetailResponse>(cacheKey);
    if (cached) return Promise.resolve(cached);
  }
  return request<HubDetailResponse>(
    `/admin/hubs/${encodeURIComponent(hubId)}`,
    opts
  ).then((data) => {
    cacheSet(cacheKey, data);
    return data;
  });
}

export function createHub(
  payload: HubFormPayload,
  opts?: HubApiOptions
): Promise<HubMutationResponse> {
  return request<HubMutationResponse>('/admin/hubs', opts, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((res) => {
    clearHubCache();
    return res;
  });
}

export function updateHub(
  hubId: string,
  payload: Partial<HubFormPayload>,
  opts?: HubApiOptions
): Promise<HubMutationResponse> {
  return request<HubMutationResponse>(
    `/admin/hubs/${encodeURIComponent(hubId)}`,
    opts,
    { method: 'PUT', body: JSON.stringify(payload) }
  ).then((res) => {
    invalidateHubCache(hubId);
    return res;
  });
}

export function deleteHub(
  hubId: string,
  reason: string,
  opts?: HubApiOptions
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(
    `/admin/hubs/${encodeURIComponent(hubId)}`,
    opts,
    { method: 'DELETE', body: JSON.stringify({ reason }) }
  ).then((res) => {
    invalidateHubCache(hubId);
    return res;
  });
}

export function archiveHub(
  hubId: string,
  reasonCode: string,
  note: string,
  opts?: HubApiOptions
): Promise<HubMutationResponse> {
  return request<HubMutationResponse>(
    `/admin/hubs/${encodeURIComponent(hubId)}/archive`,
    opts,
    { method: 'POST', body: JSON.stringify({ reason_code: reasonCode, note }) }
  ).then((res) => {
    invalidateHubCache(hubId);
    return res;
  });
}

export function restoreHub(
  hubId: string,
  opts?: HubApiOptions
): Promise<HubMutationResponse> {
  return request<HubMutationResponse>(
    `/admin/hubs/${encodeURIComponent(hubId)}/restore`,
    opts,
    { method: 'POST' }
  ).then((res) => {
    invalidateHubCache(hubId);
    return res;
  });
}

/* ============================================================
   5. HUB STATUS TOGGLES
   ============================================================ */

export function setHubStatus(
  hubId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'PROBATION',
  reason: string,
  opts?: HubApiOptions
): Promise<HubMutationResponse> {
  return request<HubMutationResponse>(
    `/admin/hubs/${encodeURIComponent(hubId)}/status`,
    opts,
    { method: 'POST', body: JSON.stringify({ status, reason }) }
  ).then((res) => {
    invalidateHubCache(hubId);
    return res;
  });
}

export function setBookingAcceptance(
  hubId: string,
  accepting: boolean,
  opts?: HubApiOptions
): Promise<HubMutationResponse> {
  return request<HubMutationResponse>(
    `/admin/hubs/${encodeURIComponent(hubId)}/booking-acceptance`,
    opts,
    { method: 'POST', body: JSON.stringify({ accepting }) }
  ).then((res) => {
    invalidateHubCache(hubId);
    return res;
  });
}

export function setPartnerAcceptance(
  hubId: string,
  accepting: boolean,
  opts?: HubApiOptions
): Promise<HubMutationResponse> {
  return request<HubMutationResponse>(
    `/admin/hubs/${encodeURIComponent(hubId)}/partner-acceptance`,
    opts,
    { method: 'POST', body: JSON.stringify({ accepting }) }
  ).then((res) => {
    invalidateHubCache(hubId);
    return res;
  });
}

/* ============================================================
   6. HUB SECTORS
   ============================================================ */

export function fetchHubSectors(
  hubId: string,
  opts?: HubApiOptions
): Promise<HubSector[]> {
  return request<HubSector[]>(
    `/admin/hubs/${encodeURIComponent(hubId)}/sectors`,
    opts
  );
}

export function addHubSector(
  payload: HubSectorFormPayload,
  opts?: HubApiOptions
): Promise<HubSectorMutationResponse> {
  return request<HubSectorMutationResponse>(
    `/admin/hubs/${encodeURIComponent(payload.hub_id)}/sectors`,
    opts,
    { method: 'POST', body: JSON.stringify(payload) }
  ).then((res) => {
    invalidateHubCache(payload.hub_id);
    return res;
  });
}

export function updateHubSector(
  hubId: string,
  sectorId: string,
  payload: Partial<HubSectorFormPayload>,
  opts?: HubApiOptions
): Promise<HubSectorMutationResponse> {
  return request<HubSectorMutationResponse>(
    `/admin/hubs/${encodeURIComponent(hubId)}/sectors/${encodeURIComponent(
      sectorId
    )}`,
    opts,
    { method: 'PUT', body: JSON.stringify(payload) }
  ).then((res) => {
    invalidateHubCache(hubId);
    return res;
  });
}

export function deleteHubSector(
  hubId: string,
  sectorId: string,
  opts?: HubApiOptions
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(
    `/admin/hubs/${encodeURIComponent(hubId)}/sectors/${encodeURIComponent(
      sectorId
    )}`,
    opts,
    { method: 'DELETE' }
  ).then((res) => {
    invalidateHubCache(hubId);
    return res;
  });
}

/* ============================================================
   7. HUB COVERAGE
   ============================================================ */

export function updateHubCoverage(
  hubId: string,
  coverage: HubCoverage,
  serviceRadiusKm: number,
  opts?: HubApiOptions
): Promise<HubMutationResponse> {
  return request<HubMutationResponse>(
    `/admin/hubs/${encodeURIComponent(hubId)}/coverage`,
    opts,
    {
      method: 'PUT',
      body: JSON.stringify({
        coverage,
        service_radius_km: serviceRadiusKm,
      }),
    }
  ).then((res) => {
    invalidateHubCache(hubId);
    return res;
  });
}

/* ============================================================
   8. HUB KPIs
   ============================================================ */

export function fetchHubKpis(opts?: HubApiOptions): Promise<HubKpis> {
  const cacheKey = 'hub:kpis';
  if (!opts?.skipCache) {
    const cached = cacheGet<HubKpis>(cacheKey);
    if (cached) return Promise.resolve(cached);
  }
  return request<HubKpis>('/admin/hubs/kpis', opts).then((data) => {
    cacheSet(cacheKey, data, 5000);
    return data;
  });
}

/* ============================================================
   9. HUB PERFORMANCE (per hub, time range)
   ============================================================ */

export interface HubPerformanceRange {
  from: string;
  to: string;
}

export function fetchHubPerformance(
  hubId: string,
  range: HubPerformanceRange,
  opts?: HubApiOptions
): Promise<{
  bookings: number;
  completed: number;
  cancelled: number;
  revenue_paise: number;
  avg_rating: number | null;
}> {
  const qs = new URLSearchParams({ from: range.from, to: range.to });
  return request<{
    bookings: number;
    completed: number;
    cancelled: number;
    revenue_paise: number;
    avg_rating: number | null;
  }>(`/admin/hubs/${encodeURIComponent(hubId)}/performance?${qs}`, opts);
}

/* ============================================================
   10. GEOCODING (server-side proxy)
   ============================================================ */

export function reverseGeocode(
  point: LatLng,
  opts?: HubApiOptions
): Promise<HubGeocodeResponse> {
  const qs = new URLSearchParams({
    lat: String(point.lat),
    lng: String(point.lng),
  });
  return request<HubGeocodeResponse>(
    `/admin/hubs/geocode/reverse?${qs}`,
    opts
  );
}

export function forwardGeocode(
  address: string,
  opts?: HubApiOptions
): Promise<HubGeocodeResponse[]> {
  const qs = new URLSearchParams({ q: address });
  return request<HubGeocodeResponse[]>(
    `/admin/hubs/geocode/forward?${qs}`,
    opts
  );
}

/* ============================================================
   11. BULK HELPERS
   ============================================================ */

export async function fetchHubDashboard(
  filters: HubFilters = { limit: 50 },
  opts?: HubApiOptions
): Promise<{
  kpis: HubKpis | null;
  hubs: Hub[];
  errors: string[];
}> {
  const errors: string[] = [];

  const [kpiRes, listRes] = await Promise.allSettled([
    fetchHubKpis(opts),
    fetchHubs(filters, opts),
  ]);

  let kpis: HubKpis | null = null;
  let hubs: Hub[] = [];

  if (kpiRes.status === 'fulfilled') kpis = kpiRes.value;
  else errors.push(kpiRes.reason?.message || 'KPI fetch failed');

  if (listRes.status === 'fulfilled') hubs = listRes.value.items ?? [];
  else errors.push(listRes.reason?.message || 'Hubs fetch failed');

  return { kpis, hubs, errors };
}

export async function fetchHubWithSectors(
  hubId: string,
  opts?: HubApiOptions
): Promise<{
  hub: Hub | null;
  sectors: HubSector[];
  errors: string[];
}> {
  const errors: string[] = [];
  const [hubRes, sectorRes] = await Promise.allSettled([
    fetchHub(hubId, opts),
    fetchHubSectors(hubId, opts),
  ]);

  let hub: Hub | null = null;
  let sectors: HubSector[] = [];

  if (hubRes.status === 'fulfilled') hub = hubRes.value.hub;
  else errors.push(hubRes.reason?.message || 'Hub fetch failed');

  if (sectorRes.status === 'fulfilled') sectors = sectorRes.value;
  else errors.push(sectorRes.reason?.message || 'Sectors fetch failed');

  return { hub, sectors, errors };
}

/* ============================================================
   12. REALTIME (SSE)
   ============================================================ */

export interface HubRealtimeHandlers {
  onHubCreated?: (hub: Hub) => void;
  onHubUpdated?: (hub: Hub) => void;
  onHubDeleted?: (hubId: string) => void;
  onHubStatusChanged?: (payload: {
    hub_id: string;
    status: string;
  }) => void;
  onKpiUpdated?: (kpis: HubKpis) => void;
  onError?: (err: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export interface HubRealtimeConnection {
  close: () => void;
  isConnected: () => boolean;
}

export function connectHubRealtime(
  handlers: HubRealtimeHandlers,
  opts: { baseUrl?: string; authToken?: string | null } = {}
): HubRealtimeConnection {
  const base = getBase(opts.baseUrl);
  const url = new URL(
    `${base}/admin/hubs/stream`,
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

    eventSource.addEventListener('hub.created', (e) => {
      try {
        handlers.onHubCreated?.(
          JSON.parse((e as MessageEvent).data) as Hub
        );
      } catch {
        /* ignore */
      }
    });

    eventSource.addEventListener('hub.updated', (e) => {
      try {
        handlers.onHubUpdated?.(
          JSON.parse((e as MessageEvent).data) as Hub
        );
      } catch {
        /* ignore */
      }
    });

    eventSource.addEventListener('hub.deleted', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { hub_id: string };
        handlers.onHubDeleted?.(data.hub_id);
      } catch {
        /* ignore */
      }
    });

    eventSource.addEventListener('hub.status_changed', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as {
          hub_id: string;
          status: string;
        };
        handlers.onHubStatusChanged?.(data);
      } catch {
        /* ignore */
      }
    });

    eventSource.addEventListener('hub.kpi_updated', (e) => {
      try {
        handlers.onKpiUpdated?.(
          JSON.parse((e as MessageEvent).data) as HubKpis
        );
      } catch {
        /* ignore */
      }
    });

    eventSource.onerror = () => {
      connected = false;
      handlers.onDisconnected?.();
      handlers.onError?.(new Error('Hub realtime stream error'));
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
   13. CSV EXPORT
   ============================================================ */

export function exportHubsCsv(hubs: Hub[]): void {
  const rows: string[] = [
    'Hub Code,Name,Type,Status,Tier,City,State,Pincode,Latitude,Longitude,Service Radius (km),Max Partners,Current Partners,Utilization %,Bookings Today,Bookings Month,Avg Rating,Manager,Phone,Created',
  ];
  const safe = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`;

  hubs.forEach((h) => {
    rows.push(
      [
        safe(h.hub_code),
        safe(h.name),
        safe(h.type),
        safe(h.status),
        safe(h.tier),
        safe(h.address.city),
        safe(h.address.state),
        safe(h.address.pincode),
        String(h.location.lat),
        String(h.location.lng),
        String(h.service_radius_km),
        String(h.capacity.max_partners),
        String(h.capacity.current_partners),
        String(h.capacity.utilization_pct),
        String(h.performance.bookings_today),
        String(h.performance.bookings_month),
        h.performance.avg_rating != null
          ? h.performance.avg_rating.toFixed(2)
          : '',
        safe(h.manager.manager_name),
        safe(h.contact_number),
        safe(h.created_at),
      ].join(',')
    );
  });

  downloadCsv(rows.join('\n'), 'hubs.csv');
}

export function exportHubSectorsCsv(hub: Hub, sectors: HubSector[]): void {
  const rows: string[] = [
    'Hub Code,Hub Name,Sector ID,Sector Name,Status,Pincodes,Partner Count,Bookings (Month)',
  ];
  const safe = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`;

  sectors.forEach((s) => {
    rows.push(
      [
        safe(hub.hub_code),
        safe(hub.name),
        safe(s.id),
        safe(s.name),
        safe(s.status),
        safe(s.pincodes.join('|')),
        String(s.partner_count),
        String(s.booking_count_month),
      ].join(',')
    );
  });

  downloadCsv(rows.join('\n'), `hub-${hub.hub_code}-sectors.csv`);
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