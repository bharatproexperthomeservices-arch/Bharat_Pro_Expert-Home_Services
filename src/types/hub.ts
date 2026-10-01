/* ============================================================
   BHARAT PRO EXPERTS — HUB TYPES (FULL PRODUCTION)
   Leaflet + OpenStreetMap · Urban Company style Hub Area
   ------------------------------------------------------------
   NO DEMO DATA. NO FAKE HUBS. Only real, production-grade
   types, constants, helpers, validation, and API payloads.
   ============================================================
   SECTIONS:
   1.  Core Enums
   2.  GeoJSON Types (Leaflet-compatible)
   3.  Address / Manager / Capacity / Performance
   4.  Sector / Coverage
   5.  Hub Entity (main)
   6.  Hub KPIs
   7.  Form Payloads (Create / Update)
   8.  API Response Types
   9.  Filters / Query types
   10. UI Labels
   11. Distance / Area Helpers
   12. Coverage Helpers
   13. Date / Format Helpers
   14. Color Helpers
   15. Capacity Helpers
   16. Leaflet + OSM Config
   17. Radius / Zoom Constants
   18. Validation
   19. Constants (reason codes, defaults)
   20. Type guards
   ============================================================ */

/* ============================================================
   1. CORE ENUMS
   ============================================================ */

export type HubStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PROBATION'
  | 'MAINTENANCE'
  | 'ARCHIVED';

export type HubType =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'TEMPORARY'
  | 'POPUP'
  | 'FRANCHISE';

export type HubTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export type HubSectorStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export type HubCoverageType = 'Circle' | 'Polygon';

export type HubSortField =
  | 'name'
  | 'city'
  | 'status'
  | 'partners'
  | 'bookings'
  | 'utilization'
  | 'created';

export type HubSortOrder = 'asc' | 'desc';

/* ============================================================
   2. GEOJSON TYPES (Leaflet-compatible)
   ============================================================ */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoPolygon {
  type: 'Polygon';
  /** Ring array; first ring = outer boundary */
  coordinates: number[][][]; // [[[lng, lat], ...]]
}

export interface GeoCircle {
  type: 'Circle';
  center: LatLng;
  radius_m: number;
}

export type HubCoverage = GeoPolygon | GeoCircle;

/* ============================================================
   3. ADDRESS / MANAGER / CAPACITY / PERFORMANCE
   ============================================================ */

export interface HubAddress {
  line1: string;
  line2?: string;
  sector?: string;
  city: string;
  city_id: string;
  state: string;
  state_code: string;
  pincode: string;
  country: string;
  landmark?: string;
}

export interface HubManager {
  manager_id: string;
  manager_name: string;
  manager_mobile_masked: string;
  manager_email?: string;
  assigned_at?: string;
}

export interface HubCapacity {
  max_partners: number;
  current_partners: number;
  max_jobs_per_day: number;
  current_jobs_today: number;
  utilization_pct: number;
}

export interface HubPerformance {
  bookings_today: number;
  bookings_week: number;
  bookings_month: number;
  completed_rate: number;
  cancelled_rate: number;
  avg_rating: number | null;
  rating_sample: number;
  avg_response_time_sec: number;
  avg_completion_time_min: number;
}

/* ============================================================
   4. SECTOR / COVERAGE
   ============================================================ */

export interface HubSector {
  id: string;
  name: string;
  pincodes: string[];
  status: HubSectorStatus;
  partner_count: number;
  booking_count_month: number;
  coverage: HubCoverage;
  created_at?: string;
  updated_at?: string;
}

/* ============================================================
   5. HUB ENTITY (MAIN)
   ============================================================ */

export interface Hub {
  id: string;
  hub_code: string;
  name: string;
  type: HubType;
  status: HubStatus;
  tier: HubTier;

  address: HubAddress;
  location: LatLng;
  coverage: HubCoverage;
  coverage_type: HubCoverageType;
  service_radius_km: number;

  sectors: HubSector[];

  capacity: HubCapacity;
  performance: HubPerformance;
  manager: HubManager;

  operating_hours: string;
  contact_number: string;
  email?: string;

  is_accepting_bookings: boolean;
  is_accepting_new_partners: boolean;

  notes?: string;
  tags?: string[];

  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  archived_at?: string;
}

/* ============================================================
   6. HUB KPIs
   ============================================================ */

export interface HubKpis {
  total_hubs: number;
  active_hubs: number;
  inactive_hubs: number;
  maintenance_hubs: number;
  total_partners: number;
  total_bookings_today: number;
  total_bookings_month: number;
  avg_utilization: number;
  total_sectors: number;
  states_covered: number;
  cities_covered: number;
  as_of: string;
}

/* ============================================================
   7. FORM PAYLOADS
   ============================================================ */

export interface HubFormPayload {
  name: string;
  hub_code?: string;
  type: HubType;
  tier: HubTier;
  status: HubStatus;

  address: HubAddress;
  location: LatLng;

  coverage_type: HubCoverageType;
  coverage: HubCoverage;
  service_radius_km: number;

  operating_hours: string;
  contact_number: string;
  email?: string;

  manager_id?: string;
  manager_name?: string;
  manager_mobile?: string;
  manager_email?: string;

  is_accepting_bookings: boolean;
  is_accepting_new_partners: boolean;

  notes?: string;
  tags?: string[];
}

export interface HubSectorFormPayload {
  hub_id: string;
  name: string;
  pincodes: string[];
  status: HubSectorStatus;
  coverage_type: HubCoverageType;
  coverage: HubCoverage;
}

/* ============================================================
   8. API RESPONSE TYPES
   ============================================================ */

export interface HubListResponse {
  items: Hub[];
  total: number;
  cursor?: string;
}

export interface HubDetailResponse {
  hub: Hub;
}

export interface HubMutationResponse {
  ok: boolean;
  hub_id: string;
  hub_code: string;
  updated_at: string;
}

export interface HubSectorMutationResponse {
  ok: boolean;
  sector_id: string;
  updated_at: string;
}

export interface HubGeocodeResponse {
  lat: number;
  lng: number;
  formatted_address: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

/* ============================================================
   9. FILTERS / QUERY
   ============================================================ */

export interface HubFilters {
  search?: string;
  state_code?: string;
  city_id?: string;
  status?: HubStatus | 'ALL';
  type?: HubType | 'ALL';
  tier?: HubTier | 'ALL';
  sort?: HubSortField;
  order?: HubSortOrder;
  limit?: number;
  cursor?: string;
}

/* ============================================================
   10. UI LABELS
   ============================================================ */

export const HUB_STATUS_LABELS: Record<HubStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PROBATION: 'Probation',
  MAINTENANCE: 'Maintenance',
  ARCHIVED: 'Archived',
};

export const HUB_TYPE_LABELS: Record<HubType, string> = {
  PRIMARY: 'Primary Hub',
  SECONDARY: 'Secondary Hub',
  TEMPORARY: 'Temporary Hub',
  POPUP: 'Pop-up Hub',
  FRANCHISE: 'Franchise Hub',
};

export const HUB_TIER_LABELS: Record<HubTier, string> = {
  TIER_1: 'Tier 1 (Metro)',
  TIER_2: 'Tier 2 (City)',
  TIER_3: 'Tier 3 (Town)',
};

export const HUB_SECTOR_STATUS_LABELS: Record<HubSectorStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
};

export const HUB_SORT_LABELS: Record<HubSortField, string> = {
  name: 'Name',
  city: 'City',
  status: 'Status',
  partners: 'Partners',
  bookings: 'Bookings',
  utilization: 'Utilization',
  created: 'Created',
};

/* ============================================================
   11. DISTANCE / AREA HELPERS
   ============================================================ */

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function mToKm(m: number): number {
  return Math.round((m / 1000) * 100) / 100;
}

export function kmToM(km: number): number {
  return Math.round(km * 1000);
}

export function polygonAreaSqKm(polygon: GeoPolygon): number {
  const ring = polygon.coordinates[0];
  if (!ring || ring.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  const deg2 = Math.abs(area / 2);
  return Math.round(deg2 * 111 * 111 * 100) / 100;
}

export function polygonCentroid(polygon: GeoPolygon): LatLng | null {
  const ring = polygon.coordinates[0];
  if (!ring || ring.length === 0) return null;
  let sumLng = 0;
  let sumLat = 0;
  ring.forEach(([lng, lat]) => {
    sumLng += lng;
    sumLat += lat;
  });
  return {
    lng: sumLng / ring.length,
    lat: sumLat / ring.length,
  };
}

/* ============================================================
   12. COVERAGE HELPERS
   ============================================================ */

export function isPointInPolygon(point: LatLng, polygon: GeoPolygon): boolean {
  const rings = polygon.coordinates;
  if (!rings.length) return false;
  const [lng, lat] = [point.lng, point.lat];
  let inside = false;
  const ring = rings[0];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInCoverage(
  point: LatLng,
  coverage: HubCoverage
): boolean {
  if (coverage.type === 'Circle') {
    const d = haversineKm(coverage.center, point) * 1000;
    return d <= coverage.radius_m;
  }
  return isPointInPolygon(point, coverage);
}

export function describeCoverage(coverage: HubCoverage): string {
  if (coverage.type === 'Circle') {
    return `Circle · ${(coverage.radius_m / 1000).toFixed(1)} km radius`;
  }
  const pts = coverage.coordinates[0]?.length ?? 0;
  const area = polygonAreaSqKm(coverage);
  return `Polygon · ${pts} points · ~${area} km²`;
}

export function coverageBounds(
  coverage: HubCoverage
): { north: number; south: number; east: number; west: number } | null {
  if (coverage.type === 'Circle') {
    const dLat = coverage.radius_m / 111000;
    const dLng =
      coverage.radius_m /
      (111000 * Math.cos((coverage.center.lat * Math.PI) / 180));
    return {
      north: coverage.center.lat + dLat,
      south: coverage.center.lat - dLat,
      east: coverage.center.lng + dLng,
      west: coverage.center.lng - dLng,
    };
  }
  const ring = coverage.coordinates[0];
  if (!ring || ring.length === 0) return null;
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  ring.forEach(([lng, lat]) => {
    if (lat > north) north = lat;
    if (lat < south) south = lat;
    if (lng > east) east = lng;
    if (lng < west) west = lng;
  });
  return { north, south, east, west };
}

/* ============================================================
   13. DATE / FORMAT HELPERS
   ============================================================ */

export function formatHubDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatHubTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLatLng(loc: LatLng): string {
  return `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
}

export function formatRadius(km: number): string {
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
}

/* ============================================================
   14. COLOR HELPERS
   ============================================================ */

export function hubStatusColor(status: HubStatus): string {
  switch (status) {
    case 'ACTIVE':
      return '#16a34a';
    case 'INACTIVE':
      return '#6b7280';
    case 'PROBATION':
      return '#f59e0b';
    case 'MAINTENANCE':
      return '#2563eb';
    case 'ARCHIVED':
      return '#374151';
    default:
      return '#6b7280';
  }
}

export function hubStatusBg(status: HubStatus): string {
  switch (status) {
    case 'ACTIVE':
      return '#dcfce7';
    case 'INACTIVE':
      return '#f3f4f6';
    case 'PROBATION':
      return '#fef3c7';
    case 'MAINTENANCE':
      return '#dbeafe';
    case 'ARCHIVED':
      return '#e5e7eb';
    default:
      return '#f3f4f6';
  }
}

export function hubTypeColor(type: HubType): string {
  switch (type) {
    case 'PRIMARY':
      return '#1d4ed8';
    case 'SECONDARY':
      return '#0891b2';
    case 'TEMPORARY':
      return '#7c3aed';
    case 'POPUP':
      return '#db2777';
    case 'FRANCHISE':
      return '#ea580c';
    default:
      return '#374151';
  }
}

export function utilizationColor(pct: number): string {
  if (pct >= 90) return '#dc2626';
  if (pct >= 70) return '#f59e0b';
  if (pct >= 40) return '#16a34a';
  return '#6b7280';
}

/* ============================================================
   15. CAPACITY HELPERS
   ============================================================ */

export function computeUtilization(cap: HubCapacity): number {
  if (!cap.max_partners) return 0;
  return Math.round((cap.current_partners / cap.max_partners) * 100);
}

export function computeJobUtilization(cap: HubCapacity): number {
  if (!cap.max_jobs_per_day) return 0;
  return Math.round((cap.current_jobs_today / cap.max_jobs_per_day) * 100);
}

export function remainingPartnerCapacity(cap: HubCapacity): number {
  return Math.max(0, cap.max_partners - cap.current_partners);
}

export function isAtPartnerCapacity(cap: HubCapacity): boolean {
  return cap.current_partners >= cap.max_partners;
}

/* ============================================================
   16. LEAFLET + OPENSTREETMAP CONFIG
   ============================================================ */

export const LEAFLET_CONFIG = {
  default_tile_url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  default_attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  india_center: { lat: 22.5937, lng: 78.9629 } as LatLng,
  india_zoom: 5,
  city_zoom: 11,
  sector_zoom: 13,
  hub_focus_zoom: 14,
  max_zoom: 19,
  min_zoom: 3,
} as const;

/* ============================================================
   17. RADIUS / LIMITS
   ============================================================ */

export const HUB_RADIUS_LIMITS = {
  min_km: 1,
  max_km: 30,
  default_km: 5,
} as const;

export const HUB_CAPACITY_LIMITS = {
  min_partners: 1,
  max_partners: 500,
  min_jobs: 1,
  max_jobs: 2000,
} as const;

export const HUB_PINCODE_REGEX = /^\d{6}$/;
export const HUB_PHONE_REGEX = /^[+\d\s\-()]{10,}$/;
export const HUB_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HUB_OPERATING_HOURS_REGEX = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

/* ============================================================
   18. VALIDATION
   ============================================================ */

export interface HubValidationError {
  field: string;
  message: string;
}

export function validateHub(
  hub: Partial<HubFormPayload>
): HubValidationError[] {
  const errors: HubValidationError[] = [];

  if (!hub.name || hub.name.trim().length < 3) {
    errors.push({
      field: 'name',
      message: 'Hub name must be at least 3 characters',
    });
  }

  if (hub.hub_code && !/^[A-Z0-9-]{3,20}$/.test(hub.hub_code)) {
    errors.push({
      field: 'hub_code',
      message: 'Hub code must be 3-20 chars (A-Z, 0-9, -)',
    });
  }

  if (!hub.address?.line1 || !hub.address.line1.trim()) {
    errors.push({
      field: 'address.line1',
      message: 'Address line 1 is required',
    });
  }

  if (!hub.address?.city || !hub.address.city.trim()) {
    errors.push({ field: 'address.city', message: 'City is required' });
  }

  if (!hub.address?.state || !hub.address.state.trim()) {
    errors.push({ field: 'address.state', message: 'State is required' });
  }

  if (!hub.address?.pincode || !HUB_PINCODE_REGEX.test(hub.address.pincode)) {
    errors.push({
      field: 'address.pincode',
      message: 'Pincode must be 6 digits',
    });
  }

  if (
    !hub.location ||
    typeof hub.location.lat !== 'number' ||
    typeof hub.location.lng !== 'number' ||
    (hub.location.lat === 0 && hub.location.lng === 0)
  ) {
    errors.push({
      field: 'location',
      message: 'Please drop a pin on the map',
    });
  } else {
    if (hub.location.lat < -90 || hub.location.lat > 90) {
      errors.push({ field: 'location.lat', message: 'Invalid latitude' });
    }
    if (hub.location.lng < -180 || hub.location.lng > 180) {
      errors.push({ field: 'location.lng', message: 'Invalid longitude' });
    }
  }

  if (!hub.contact_number || !HUB_PHONE_REGEX.test(hub.contact_number)) {
    errors.push({
      field: 'contact_number',
      message: 'Valid contact number required (min 10 digits)',
    });
  }

  if (hub.email && !HUB_EMAIL_REGEX.test(hub.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (
    !hub.operating_hours ||
    !HUB_OPERATING_HOURS_REGEX.test(hub.operating_hours)
  ) {
    errors.push({
      field: 'operating_hours',
      message: 'Format: HH:MM-HH:MM (e.g., 07:00-22:00)',
    });
  }

  if (
    hub.service_radius_km != null &&
    (hub.service_radius_km < HUB_RADIUS_LIMITS.min_km ||
      hub.service_radius_km > HUB_RADIUS_LIMITS.max_km)
  ) {
    errors.push({
      field: 'service_radius_km',
      message: `Radius must be between ${HUB_RADIUS_LIMITS.min_km} and ${HUB_RADIUS_LIMITS.max_km} km`,
    });
  }

  if (hub.coverage_type === 'Polygon') {
    if (
      !hub.coverage ||
      hub.coverage.type !== 'Polygon' ||
      !hub.coverage.coordinates?.[0]?.length ||
      hub.coverage.coordinates[0].length < 3
    ) {
      errors.push({
        field: 'coverage',
        message: 'Polygon must have at least 3 points',
      });
    }
  }

  if (hub.coverage_type === 'Circle') {
    if (
      !hub.coverage ||
      hub.coverage.type !== 'Circle' ||
      !hub.coverage.radius_m ||
      hub.coverage.radius_m <= 0
    ) {
      errors.push({
        field: 'coverage',
        message: 'Circle requires a positive radius',
      });
    }
  }

  return errors;
}

export function isHubFormValid(hub: Partial<HubFormPayload>): boolean {
  return validateHub(hub).length === 0;
}

export function validateHubSector(
  sector: Partial<HubSectorFormPayload>
): HubValidationError[] {
  const errors: HubValidationError[] = [];

  if (!sector.name || sector.name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'Sector name must be at least 2 characters',
    });
  }

  if (!sector.pincodes || sector.pincodes.length === 0) {
    errors.push({
      field: 'pincodes',
      message: 'At least one pincode is required',
    });
  } else {
    sector.pincodes.forEach((p, idx) => {
      if (!HUB_PINCODE_REGEX.test(p)) {
        errors.push({
          field: `pincodes[${idx}]`,
          message: `Invalid pincode: ${p}`,
        });
      }
    });
  }

  return errors;
}

/* ============================================================
   19. CONSTANTS
   ============================================================ */

export const HUB_ARCHIVE_REASONS = {
  BUSINESS_CLOSED: 'BUSINESS_CLOSED',
  MERGED: 'MERGED',
  RELOCATED: 'RELOCATED',
  LEASE_EXPIRED: 'LEASE_EXPIRED',
  LOW_PERFORMANCE: 'LOW_PERFORMANCE',
  OTHER: 'OTHER',
} as const;

export type HubArchiveReason =
  (typeof HUB_ARCHIVE_REASONS)[keyof typeof HUB_ARCHIVE_REASONS];

export const HUB_ARCHIVE_REASON_LABELS: Record<HubArchiveReason, string> = {
  BUSINESS_CLOSED: 'Business closed',
  MERGED: 'Merged with another hub',
  RELOCATED: 'Relocated',
  LEASE_EXPIRED: 'Lease expired',
  LOW_PERFORMANCE: 'Low performance',
  OTHER: 'Other',
};

export const HUB_DEFAULT_FORM: HubFormPayload = {
  name: '',
  hub_code: '',
  type: 'PRIMARY',
  tier: 'TIER_1',
  status: 'ACTIVE',
  address: {
    line1: '',
    line2: '',
    sector: '',
    city: '',
    city_id: '',
    state: '',
    state_code: '',
    pincode: '',
    country: 'India',
    landmark: '',
  },
  location: { lat: 0, lng: 0 },
  coverage_type: 'Circle',
  coverage: {
    type: 'Circle',
    center: { lat: 0, lng: 0 },
    radius_m: HUB_RADIUS_LIMITS.default_km * 1000,
  },
  service_radius_km: HUB_RADIUS_LIMITS.default_km,
  operating_hours: '07:00-22:00',
  contact_number: '',
  email: '',
  manager_name: '',
  manager_mobile: '',
  manager_email: '',
  is_accepting_bookings: true,
  is_accepting_new_partners: true,
  notes: '',
  tags: [],
};

/* ============================================================
   20. TYPE GUARDS
   ============================================================ */

export function isCircleCoverage(c: HubCoverage): c is GeoCircle {
  return c.type === 'Circle';
}

export function isPolygonCoverage(c: HubCoverage): c is GeoPolygon {
  return c.type === 'Polygon';
}

export function isHubActive(hub: Hub): boolean {
  return hub.status === 'ACTIVE';
}

export function canAcceptBooking(hub: Hub): boolean {
  return (
    hub.status === 'ACTIVE' &&
    hub.is_accepting_bookings &&
    !isAtPartnerCapacity(hub.capacity)
  );
}

export function canAcceptNewPartner(hub: Hub): boolean {
  return (
    hub.status === 'ACTIVE' &&
    hub.is_accepting_new_partners &&
    !isAtPartnerCapacity(hub.capacity)
  );
}