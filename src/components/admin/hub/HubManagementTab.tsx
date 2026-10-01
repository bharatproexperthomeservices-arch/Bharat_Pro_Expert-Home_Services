import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/* ============================================================
   BHARAT PRO EXPERTS — HUB MANAGEMENT TAB
   Leaflet + OpenStreetMap · Self-contained · No cross imports
   ============================================================ */

type HubStatus = 'ACTIVE' | 'INACTIVE' | 'PROBATION' | 'MAINTENANCE' | 'ARCHIVED';
type HubType = 'PRIMARY' | 'SECONDARY' | 'TEMPORARY' | 'POPUP' | 'FRANCHISE';
type HubTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

interface LatLng {
  lat: number;
  lng: number;
}

interface GeoCircle {
  type: 'Circle';
  center: LatLng;
  radius_m: number;
}

interface HubCoverage {
  type: 'Circle';
  center: LatLng;
  radius_m: number;
}

interface HubAddress {
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface HubSector {
  id: string;
  name: string;
  pincodes: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  partner_count: number;
  booking_count_month: number;
}

interface Hub {
  id: string;
  hub_code: string;
  name: string;
  type: HubType;
  status: HubStatus;
  tier: HubTier;
  address: HubAddress;
  location: LatLng;
  coverage: HubCoverage;
  service_radius_km: number;
  sectors: HubSector[];
  capacity: {
    max_partners: number;
    current_partners: number;
    max_jobs_per_day: number;
    current_jobs_today: number;
    utilization_pct: number;
  };
  performance: {
    bookings_today: number;
    bookings_month: number;
    avg_rating: number | null;
    rating_sample: number;
  };
  manager: {
    manager_name: string;
    manager_mobile_masked: string;
  };
  operating_hours: string;
  contact_number: string;
  is_accepting_bookings: boolean;
  is_accepting_new_partners: boolean;
  created_at: string;
}

const HUB_STATUS_LABELS: Record<HubStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PROBATION: 'Probation',
  MAINTENANCE: 'Maintenance',
  ARCHIVED: 'Archived',
};

const HUB_TYPE_LABELS: Record<HubType, string> = {
  PRIMARY: 'Primary Hub',
  SECONDARY: 'Secondary Hub',
  TEMPORARY: 'Temporary Hub',
  POPUP: 'Pop-up Hub',
  FRANCHISE: 'Franchise Hub',
};

const HUB_TIER_LABELS: Record<HubTier, string> = {
  TIER_1: 'Tier 1 (Metro)',
  TIER_2: 'Tier 2 (City)',
  TIER_3: 'Tier 3 (Town)',
};

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/* ============================================================
   LEAFLET TYPES (minimal)
   ============================================================ */

interface LMapInstance {
  setView: (latlng: [number, number], zoom: number) => LMapInstance;
  fitBounds: (bounds: [number, number][], opts?: { padding?: [number, number] }) => LMapInstance;
  removeLayer: (layer: LMarkerInstance | LCircleInstance | LPolygonInstance) => LMapInstance;
  remove: () => void;
  on: (evt: string, fn: (e: LMapClickEvent) => void) => LMapInstance;
  invalidateSize: () => void;
}

interface LMapClickEvent {
  latlng: { lat: number; lng: number };
}

interface LMarkerInstance {
  addTo: (map: LMapInstance) => LMarkerInstance;
  bindPopup: (html: string) => LMarkerInstance;
  on: (evt: string, fn: () => void) => LMarkerInstance;
  setLatLng: (latlng: [number, number]) => LMarkerInstance;
}

interface LCircleInstance {
  addTo: (map: LMapInstance) => LCircleInstance;
}

interface LPolygonInstance {
  addTo: (map: LMapInstance) => LPolygonInstance;
}

interface LeafletNamespace {
  map: (el: HTMLElement, opts?: { zoomControl?: boolean; attributionControl?: boolean }) => LMapInstance;
  tileLayer: (url: string, opts?: { attribution?: string; maxZoom?: number; minZoom?: number }) => { addTo: (m: LMapInstance) => unknown };
  marker: (latlng: [number, number], opts?: { draggable?: boolean }) => LMarkerInstance;
  circle: (latlng: [number, number], opts?: { radius?: number; color?: string; fillColor?: string; fillOpacity?: number; weight?: number }) => LCircleInstance;
  polygon: (latlngs: [number, number][], opts?: { color?: string; fillColor?: string; fillOpacity?: number; weight?: number }) => LPolygonInstance;
}

function requireLeaflet(): LeafletNamespace {
  const w = window as unknown as { L?: LeafletNamespace };
  if (typeof window === 'undefined' || !w.L) {
    throw new Error('Leaflet not loaded');
  }
  return w.L;
}

let leafletLoadPromise: Promise<LeafletNamespace> | null = null;

function loadLeaflet(): Promise<LeafletNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Leaflet requires browser'));
  }
  const w = window as unknown as { L?: LeafletNamespace };
  if (w.L) return Promise.resolve(w.L);
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise<LeafletNamespace>((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS_URL;
      document.head.appendChild(link);
    }

    const existing = document.querySelector(
      `script[src="${LEAFLET_JS_URL}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener('load', () => {
        const w2 = window as unknown as { L?: LeafletNamespace };
        if (w2.L) resolve(w2.L);
        else reject(new Error('Leaflet loaded but namespace missing'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS_URL;
    script.async = true;
    script.onload = () => {
      const w2 = window as unknown as { L?: LeafletNamespace };
      if (w2.L) resolve(w2.L);
      else reject(new Error('Leaflet failed to initialize'));
    };
    script.onerror = () => reject(new Error('Leaflet failed to load'));
    document.head.appendChild(script);
  });

  return leafletLoadPromise;
}

/* ============================================================
   HELPERS
   ============================================================ */

function formatDate(iso?: string | null): string {
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

function hubStatusColor(status: HubStatus): string {
  switch (status) {
    case 'ACTIVE': return '#16a34a';
    case 'INACTIVE': return '#6b7280';
    case 'PROBATION': return '#f59e0b';
    case 'MAINTENANCE': return '#2563eb';
    case 'ARCHIVED': return '#374151';
    default: return '#6b7280';
  }
}

function hubStatusBg(status: HubStatus): string {
  switch (status) {
    case 'ACTIVE': return '#dcfce7';
    case 'INACTIVE': return '#f3f4f6';
    case 'PROBATION': return '#fef3c7';
    case 'MAINTENANCE': return '#dbeafe';
    case 'ARCHIVED': return '#e5e7eb';
    default: return '#f3f4f6';
  }
}

function hubTypeColor(type: HubType): string {
  switch (type) {
    case 'PRIMARY': return '#1d4ed8';
    case 'SECONDARY': return '#0891b2';
    case 'TEMPORARY': return '#7c3aed';
    case 'POPUP': return '#db2777';
    case 'FRANCHISE': return '#ea580c';
    default: return '#374151';
  }
}

function utilizationColor(pct: number): string {
  if (pct >= 90) return '#dc2626';
  if (pct >= 70) return '#f59e0b';
  if (pct >= 40) return '#16a34a';
  return '#6b7280';
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export interface HubManagementTabProps {
  apiBase?: string;
  authToken?: string | null;
  onHubSelect?: (hubId: string) => void;
}

export default function HubManagementTab({
  onHubSelect,
}: HubManagementTabProps) {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'list' | 'map'>('list');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | HubStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | HubType>('ALL');

  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [editingHub, setEditingHub] = useState<Hub | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHubs([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stateOptions = useMemo(() => {
    const s = new Set<string>();
    hubs.forEach((h) => {
      if (h.address.state) s.add(h.address.state);
    });
    return Array.from(s).sort();
  }, [hubs]);

  const cityOptions = useMemo(() => {
    const s = new Set<string>();
    hubs.forEach((h) => {
      if (h.address.city) s.add(h.address.city);
    });
    return Array.from(s).sort();
  }, [hubs]);

  const filtered = useMemo(() => {
    let list = [...hubs];
    if (stateFilter !== 'ALL') list = list.filter((h) => h.address.state === stateFilter);
    if (cityFilter !== 'ALL') list = list.filter((h) => h.address.city === cityFilter);
    if (statusFilter !== 'ALL') list = list.filter((h) => h.status === statusFilter);
    if (typeFilter !== 'ALL') list = list.filter((h) => h.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.hub_code.toLowerCase().includes(q) ||
          h.address.city.toLowerCase().includes(q) ||
          h.address.pincode.includes(q)
      );
    }
    return list;
  }, [hubs, search, stateFilter, cityFilter, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    const total = hubs.length;
    const active = hubs.filter((h) => h.status === 'ACTIVE').length;
    const totalPartners = hubs.reduce((s, h) => s + h.capacity.current_partners, 0);
    const bookingsToday = hubs.reduce((s, h) => s + h.performance.bookings_today, 0);
    const avgUtilization =
      total > 0
        ? Math.round(hubs.reduce((s, h) => s + h.capacity.utilization_pct, 0) / total)
        : 0;
    return { total, active, totalPartners, bookingsToday, avgUtilization };
  }, [hubs]);

  const handleCreate = () => {
    setEditingHub(null);
    setShowWizard(true);
  };

  const handleEdit = (hub: Hub) => {
    setEditingHub(hub);
    setSelectedHub(null);
    setShowWizard(true);
  };

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.title}>Hub Management</div>
          <div style={styles.subtitle}>
            Leaflet + OpenStreetMap · Urban Company style hub areas
          </div>
        </div>
        <div style={styles.topActions}>
          <button
            style={view === 'list' ? styles.viewBtnActive : styles.viewBtn}
            onClick={() => setView('list')}
          >
            List View
          </button>
          <button
            style={view === 'map' ? styles.viewBtnActive : styles.viewBtn}
            onClick={() => setView('map')}
          >
            Map View
          </button>
          <button style={styles.createBtn} onClick={handleCreate}>
            + Create Hub
          </button>
          <button style={styles.refreshBtn} onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <span>Error: {error}</span>
          <button style={styles.retryBtn} onClick={load}>Retry</button>
        </div>
      )}

      <div style={styles.infoBanner}>
        <strong>Not configured:</strong> Hub API not connected. Connect the
        backend to load real hubs, or create hubs manually.
      </div>

      <div style={styles.kpiRow}>
        <KpiCard label="Total Hubs" value={String(summary.total)} sub="all states" tone="info" />
        <KpiCard label="Active Hubs" value={String(summary.active)} sub="accepting bookings" tone="success" />
        <KpiCard label="Total Partners" value={String(summary.totalPartners)} sub="across hubs" tone="info" />
        <KpiCard label="Bookings Today" value={String(summary.bookingsToday)} sub="all hubs combined" tone="warning" />
        <KpiCard
          label="Avg Utilization"
          value={`${summary.avgUtilization}%`}
          sub="capacity used"
          tone={summary.avgUtilization > 80 ? 'danger' : 'success'}
        />
      </div>

      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="Search hub name, code, city, pincode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={styles.select} value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="ALL">All States</option>
          {stateOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <select style={styles.select} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option value="ALL">All Cities</option>
          {cityOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | HubStatus)}>
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PROBATION">Probation</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select style={styles.select} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'ALL' | HubType)}>
          <option value="ALL">All Types</option>
          <option value="PRIMARY">Primary</option>
          <option value="SECONDARY">Secondary</option>
          <option value="TEMPORARY">Temporary</option>
          <option value="POPUP">Pop-up</option>
          <option value="FRANCHISE">Franchise</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyTitle}>No hubs yet</div>
          <div style={styles.emptySub}>
            Connect the backend API to load real hubs, or create your first hub
            manually.
          </div>
          <button style={styles.emptyCreateBtn} onClick={handleCreate}>
            + Create First Hub
          </button>
        </div>
      )}

      {view === 'list' && filtered.length > 0 && (
        <div style={styles.hubGrid}>
          {filtered.map((hub) => (
            <HubCard
              key={hub.id}
              hub={hub}
              onOpen={() => { setSelectedHub(hub); onHubSelect?.(hub.id); }}
              onEdit={() => handleEdit(hub)}
            />
          ))}
        </div>
      )}

      {view === 'map' && (
        <HubMapView hubs={filtered} onHubClick={(h) => setSelectedHub(h)} />
      )}

      {selectedHub && (
        <HubDetailDrawer
          hub={selectedHub}
          onClose={() => setSelectedHub(null)}
          onEdit={() => handleEdit(selectedHub)}
        />
      )}

      {showWizard && (
        <HubFormWizard
          initialHub={editingHub}
          onClose={() => { setShowWizard(false); setEditingHub(null); }}
          onSaved={() => { setShowWizard(false); setEditingHub(null); load(); }}
        />
      )}
    </div>
  );
}

/* ---------------- KPI CARD ---------------- */

function KpiCard({
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
    <div style={{ ...styles.kpiCard, background: theme.bg, borderColor: theme.color + '33' }}>
      <div style={{ ...styles.kpiLabel, color: theme.color }}>{label}</div>
      <div style={{ ...styles.kpiValue, color: theme.color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.color, opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}

/* ---------------- HUB CARD ---------------- */

function HubCard({ hub, onOpen, onEdit }: { hub: Hub; onOpen: () => void; onEdit: () => void; }) {
  const util = hub.capacity.utilization_pct;
  return (
    <div style={styles.hubCard}>
      <div style={styles.hubCardHeader}>
        <div style={{ flex: 1 }}>
          <div style={styles.hubName}>{hub.name}</div>
          <div style={styles.hubCode}>{hub.hub_code}</div>
        </div>
        <span style={{ ...styles.statusPill, background: hubStatusBg(hub.status), color: hubStatusColor(hub.status) }}>
          {HUB_STATUS_LABELS[hub.status]}
        </span>
      </div>

      <div style={styles.hubTypeRow}>
        <span style={{ ...styles.typePill, background: hubTypeColor(hub.type) + '22', color: hubTypeColor(hub.type) }}>
          {HUB_TYPE_LABELS[hub.type]}
        </span>
        <span style={styles.tierPill}>{HUB_TIER_LABELS[hub.tier]}</span>
      </div>

      <div style={styles.hubAddress}>
        <div>{hub.address.line1}</div>
        <div style={{ color: '#6b7280', fontSize: 12 }}>
          {hub.address.city}, {hub.address.state} — {hub.address.pincode}
        </div>
      </div>

      <div style={styles.hubStats}>
        <div>
          <div style={styles.hubStatLabel}>Partners</div>
          <div style={styles.hubStatValue}>
            {hub.capacity.current_partners}
            <span style={{ fontSize: 11, color: '#6b7280' }}>/{hub.capacity.max_partners}</span>
          </div>
        </div>
        <div>
          <div style={styles.hubStatLabel}>Bookings</div>
          <div style={styles.hubStatValue}>{hub.performance.bookings_today}</div>
        </div>
        <div>
          <div style={styles.hubStatLabel}>Sectors</div>
          <div style={styles.hubStatValue}>{hub.sectors.length}</div>
        </div>
        <div>
          <div style={styles.hubStatLabel}>Rating</div>
          <div style={styles.hubStatValue}>
            {hub.performance.avg_rating != null && hub.performance.rating_sample
              ? `${hub.performance.avg_rating.toFixed(1)} ★` : '—'}
          </div>
        </div>
      </div>

      <div style={styles.utilRow}>
        <div style={styles.utilLabel}>Utilization</div>
        <div style={styles.utilTrack}>
          <div style={{ ...styles.utilFill, width: `${Math.min(100, util)}%`, background: utilizationColor(util) }} />
        </div>
        <div style={styles.utilValue}>{util}%</div>
      </div>

      <div style={styles.hubActions}>
        <button style={styles.smallBtnPrimary} onClick={onOpen}>View Details</button>
        <button style={styles.smallBtnGhost} onClick={onEdit}>Edit</button>
      </div>
    </div>
  );
}

/* ---------------- MAP VIEW ---------------- */

function HubMapView({ hubs, onHubClick }: { hubs: Hub[]; onHubClick: (hub: Hub) => void; }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LMapInstance | null>(null);
  const layersRef = useRef<(LMarkerInstance | LCircleInstance | LPolygonInstance)[]>([]);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadLeaflet()
      .then((L) => {
        if (!mounted || !mapRef.current) return;
        if (!mapInstanceRef.current) {
          const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true })
            .setView([22.5937, 78.9629], 5);
          L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19, minZoom: 3 }).addTo(map);
          mapInstanceRef.current = map;
        }
        setReady(true);
      })
      .catch((e) => {
        if (mounted) setMapError(e instanceof Error ? e.message : 'Leaflet failed to load');
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let L: LeafletNamespace;
    try {
      L = requireLeaflet();
    } catch {
      return;
    }
    const map = mapInstanceRef.current;
    if (!map) return;

    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    hubs.forEach((hub) => {
      const marker = L.marker([hub.location.lat, hub.location.lng])
        .addTo(map)
        .bindPopup(
          `<div style="font-family:system-ui">
            <strong>${hub.name}</strong><br/>
            <span style="font-size:12px;color:#666">${hub.hub_code}</span><br/>
            <span style="font-size:12px">${hub.address.city}, ${hub.address.state}</span>
          </div>`
        );
      marker.on('click', () => onHubClick(hub));
      layersRef.current.push(marker);

      const circle = L.circle(
        [hub.coverage.center.lat, hub.coverage.center.lng],
        {
          radius: hub.coverage.radius_m,
          color: hubStatusColor(hub.status),
          fillColor: hubStatusColor(hub.status),
          fillOpacity: 0.15,
          weight: 2,
        }
      ).addTo(map);
      layersRef.current.push(circle);
    });

    if (hubs.length === 1) {
      map.setView([hubs[0].location.lat, hubs[0].location.lng], 12);
    } else if (hubs.length > 1) {
      const lats = hubs.map((h) => h.location.lat);
      const lngs = hubs.map((h) => h.location.lng);
      map.fitBounds(
        [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
        { padding: [40, 40] }
      );
    }
  }, [hubs, ready, onHubClick]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (mapError) {
    return <div style={styles.mapError}><strong>Map failed to load:</strong> {mapError}</div>;
  }

  return (
    <div style={styles.mapWrapper}>
      <div ref={mapRef} style={styles.mapCanvas} />
      {!ready && <div style={styles.mapLoading}>Loading map…</div>}
    </div>
  );
}

/* ---------------- DETAIL DRAWER ---------------- */

function HubDetailDrawer({ hub, onClose, onEdit }: { hub: Hub; onClose: () => void; onEdit: () => void; }) {
  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{hub.name}</div>
            <div style={styles.drawerSub}>{hub.hub_code} · {hub.address.city}, {hub.address.state}</div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.drawerBody}>
          <div style={styles.detailGrid}>
            <DetailItem label="Status" value={HUB_STATUS_LABELS[hub.status]} />
            <DetailItem label="Type" value={HUB_TYPE_LABELS[hub.type]} />
            <DetailItem label="Tier" value={HUB_TIER_LABELS[hub.tier]} />
            <DetailItem label="Radius" value={`${hub.service_radius_km} km`} />
            <DetailItem label="Location" value={`${hub.location.lat.toFixed(4)}, ${hub.location.lng.toFixed(4)}`} />
            <DetailItem label="Contact" value={hub.contact_number} />
            <DetailItem label="Operating Hours" value={hub.operating_hours} />
            <DetailItem label="Manager" value={`${hub.manager.manager_name} (${hub.manager.manager_mobile_masked})`} />
            <DetailItem label="Bookings Today" value={String(hub.performance.bookings_today)} />
            <DetailItem label="Bookings Month" value={String(hub.performance.bookings_month)} />
            <DetailItem label="Partner Capacity" value={`${hub.capacity.current_partners} / ${hub.capacity.max_partners}`} />
            <DetailItem label="Utilization" value={`${hub.capacity.utilization_pct}%`} />
            <DetailItem label="Created" value={formatDate(hub.created_at)} />
          </div>

          <div style={styles.descriptionBox}>
            <div style={styles.descriptionLabel}>Address</div>
            <div>{hub.address.line1}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              {hub.address.city}, {hub.address.state} — {hub.address.pincode}
            </div>
          </div>

          <div style={styles.descriptionBox}>
            <div style={styles.descriptionLabel}>Sectors Served ({hub.sectors.length})</div>
            {hub.sectors.length === 0 ? (
              <div style={{ fontSize: 13, color: '#6b7280' }}>No sectors configured yet.</div>
            ) : (
              <div style={styles.sectorList}>
                {hub.sectors.map((s) => (
                  <div key={s.id} style={styles.sectorRow}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        Pincodes: {s.pincodes.join(', ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{s.partner_count} partners</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{s.booking_count_month} bookings/mo</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.linkRow}>
            <button style={styles.primaryBtn} onClick={onEdit}>Edit Hub</button>
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

/* ---------------- FORM WIZARD ---------------- */

function HubFormWizard({
  initialHub, onClose, onSaved,
}: {
  initialHub: Hub | null; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!initialHub;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const [name, setName] = useState(initialHub?.name ?? '');
  const [type, setType] = useState<HubType>(initialHub?.type ?? 'PRIMARY');
  const [tier, setTier] = useState<HubTier>(initialHub?.tier ?? 'TIER_1');
  const [status, setStatus] = useState<HubStatus>(initialHub?.status ?? 'ACTIVE');
  const [line1, setLine1] = useState(initialHub?.address.line1 ?? '');
  const [city, setCity] = useState(initialHub?.address.city ?? '');
  const [stateName, setStateName] = useState(initialHub?.address.state ?? '');
  const [pincode, setPincode] = useState(initialHub?.address.pincode ?? '');
  const [location, setLocation] = useState<LatLng>(initialHub?.location ?? { lat: 0, lng: 0 });
  const [radiusKm, setRadiusKm] = useState(initialHub?.service_radius_km ?? 5);
  const [operatingHours, setOperatingHours] = useState(initialHub?.operating_hours ?? '07:00-22:00');
  const [contactNumber, setContactNumber] = useState(initialHub?.contact_number ?? '');
  const [managerName, setManagerName] = useState(initialHub?.manager.manager_name ?? '');
  const [managerMobile, setManagerMobile] = useState('');
  const [notes, setNotes] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LMapInstance | null>(null);
  const markerRef = useRef<LMarkerInstance | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadLeaflet()
      .then((L) => {
        if (!mounted || !mapRef.current || mapInstanceRef.current) return;
        const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true })
          .setView([location.lat || 22.5937, location.lng || 78.9629], location.lat ? 12 : 5);
        L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);

        map.on('click', (e) => {
          const ll: LatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
          setLocation(ll);
          if (markerRef.current) markerRef.current.setLatLng([ll.lat, ll.lng]);
          else markerRef.current = L.marker([ll.lat, ll.lng]).addTo(map);
        });

        if (location.lat && location.lng) {
          markerRef.current = L.marker([location.lat, location.lng]).addTo(map);
        }

        mapInstanceRef.current = map;
        setMapReady(true);
      })
      .catch(() => {});
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    let L: LeafletNamespace;
    try { L = requireLeaflet(); } catch { return; }
    const map = mapInstanceRef.current;
    if (!map) return;
    if (location.lat && location.lng) {
      if (markerRef.current) markerRef.current.setLatLng([location.lat, location.lng]);
      else markerRef.current = L.marker([location.lat, location.lng]).addTo(map);
      map.setView([location.lat, location.lng], 14);
    }
  }, [location, mapReady]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      setSubmitMsg('Save requires backend API configuration. Connect the API and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isStep1Valid = name.trim().length >= 3;
  const isStep2Valid =
    line1.trim().length > 0 &&
    city.trim().length > 0 &&
    stateName.trim().length > 0 &&
    /^\d{6}$/.test(pincode) &&
    location.lat !== 0 &&
    location.lng !== 0;
  const isStep3Valid =
    /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(operatingHours) &&
    contactNumber.trim().length >= 10;

  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={{ ...styles.drawer, width: 'min(720px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{isEdit ? 'Edit Hub' : 'Create New Hub'}</div>
            <div style={styles.drawerSub}>Pin a location, set radius, add details</div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.drawerBody}>
          {submitMsg && <div style={styles.infoBanner}>{submitMsg}</div>}

          <div style={styles.stepRow}>
            <span style={step >= 1 ? styles.stepActive : styles.step}>1. Basics</span>
            <span style={step >= 2 ? styles.stepActive : styles.step}>2. Location</span>
            <span style={step >= 3 ? styles.stepActive : styles.step}>3. Contact</span>
            <span style={step >= 4 ? styles.stepActive : styles.step}>4. Confirm</span>
          </div>

          {step === 1 && (
            <div>
              <div style={styles.fieldLabel}>Hub Name *</div>
              <input style={styles.textInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Gurugram North" />

              <div style={styles.fieldLabel}>Hub Type</div>
              <div style={styles.pillRow}>
                {(Object.keys(HUB_TYPE_LABELS) as HubType[]).map((t) => (
                  <button key={t} style={type === t ? styles.pillActive : styles.pill} onClick={() => setType(t)}>
                    {HUB_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              <div style={styles.fieldLabel}>Tier</div>
              <div style={styles.pillRow}>
                {(Object.keys(HUB_TIER_LABELS) as HubTier[]).map((t) => (
                  <button key={t} style={tier === t ? styles.pillActive : styles.pill} onClick={() => setTier(t)}>
                    {HUB_TIER_LABELS[t]}
                  </button>
                ))}
              </div>

              <div style={styles.fieldLabel}>Status</div>
              <div style={styles.pillRow}>
                {(['ACTIVE', 'INACTIVE', 'PROBATION'] as HubStatus[]).map((s) => (
                  <button key={s} style={status === s ? styles.pillActive : styles.pill} onClick={() => setStatus(s)}>
                    {HUB_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>

              <div style={styles.wizardActions}>
                <button style={styles.primaryBtn} disabled={!isStep1Valid} onClick={() => setStep(2)}>
                  Next: Location
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={styles.fieldLabel}>Address Line *</div>
              <input style={styles.textInput} value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Building, street, sector" />

              <div style={styles.gridTwoCol}>
                <div>
                  <div style={styles.fieldLabel}>City *</div>
                  <input style={styles.textInput} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Gurugram" />
                </div>
                <div>
                  <div style={styles.fieldLabel}>State *</div>
                  <input style={styles.textInput} value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="e.g., Haryana" />
                </div>
              </div>

              <div style={styles.fieldLabel}>Pincode *</div>
              <input style={styles.textInput} value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="122011" />

              <div style={styles.fieldLabel}>Drop Pin on Map * (click on map)</div>
              <div style={styles.mapPickerWrapper}>
                <div ref={mapRef} style={styles.mapPicker} />
              </div>
              <div style={styles.coordRow}>
                <span>Lat: <strong>{location.lat.toFixed(5)}</strong></span>
                <span>Lng: <strong>{location.lng.toFixed(5)}</strong></span>
              </div>

              <div style={styles.fieldLabel}>Service Radius (km)</div>
              <input type="number" min={1} max={30} style={styles.textInput} value={radiusKm} onChange={(e) => setRadiusKm(Math.max(1, Math.min(30, Number(e.target.value))))} />

              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(1)}>Back</button>
                <button style={styles.primaryBtn} disabled={!isStep2Valid} onClick={() => setStep(3)}>Next: Contact</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={styles.fieldLabel}>Operating Hours *</div>
              <input style={styles.textInput} value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} placeholder="07:00-22:00" />

              <div style={styles.fieldLabel}>Contact Number *</div>
              <input style={styles.textInput} value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+91 98xxx xxxxx" />

              <div style={styles.gridTwoCol}>
                <div>
                  <div style={styles.fieldLabel}>Manager Name</div>
                  <input style={styles.textInput} value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="e.g., Ravi Sharma" />
                </div>
                <div>
                  <div style={styles.fieldLabel}>Manager Mobile</div>
                  <input style={styles.textInput} value={managerMobile} onChange={(e) => setManagerMobile(e.target.value)} placeholder="9876543210" />
                </div>
              </div>

              <div style={styles.fieldLabel}>Notes (optional)</div>
              <textarea style={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Internal notes" />

              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(2)}>Back</button>
                <button style={styles.primaryBtn} disabled={!isStep3Valid} onClick={() => setStep(4)}>Next: Confirm</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={styles.confirmBox}>
                <div><strong>Name:</strong> {name}</div>
                <div style={{ marginTop: 4 }}><strong>Type/Tier/Status:</strong> {HUB_TYPE_LABELS[type]} · {HUB_TIER_LABELS[tier]} · {HUB_STATUS_LABELS[status]}</div>
                <div style={{ marginTop: 4 }}><strong>Address:</strong> {line1}, {city}, {stateName} — {pincode}</div>
                <div style={{ marginTop: 4 }}><strong>Location:</strong> {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</div>
                <div style={{ marginTop: 4 }}><strong>Radius:</strong> {radiusKm} km</div>
                <div style={{ marginTop: 4 }}><strong>Hours:</strong> {operatingHours}</div>
                <div style={{ marginTop: 4 }}><strong>Contact:</strong> {contactNumber}</div>
              </div>

              <div style={styles.infoBox}>
                <strong>Note:</strong> Saving requires the backend API to be configured.
              </div>

              <div style={styles.wizardActions}>
                <button style={styles.ghostBtn} onClick={() => setStep(3)}>Back</button>
                <button style={styles.primaryBtn} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Saving…' : isEdit ? 'Update Hub' : 'Create Hub'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- TABLE HELPERS ---------------- */

function Th({ children }: { children: ReactNode }) { return <th style={styles.th}>{children}</th>; }
function Td({ children }: { children: ReactNode }) { return <td style={styles.td}>{children}</td>; }

/* ---------------- STYLES ---------------- */

const styles: Record<string, CSSProperties> = {
  root: { padding: 4 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  title: { fontSize: 20, fontWeight: 800, color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  topActions: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  viewBtn: { padding: '8px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 },
  viewBtnActive: { padding: '8px 14px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#1d4ed8', fontWeight: 700 },
  createBtn: { padding: '9px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  refreshBtn: { padding: '9px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  errorBanner: { padding: '10px 14px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 },
  retryBtn: { padding: '6px 12px', background: '#991b1b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  infoBanner: { padding: '10px 14px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 6, marginBottom: 12, fontSize: 12 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 16 },
  kpiCard: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 },
  kpiLabel: { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 },
  kpiValue: { fontSize: 20, fontWeight: 800, marginTop: 4, marginBottom: 2 },
  filterBar: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 220, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none' },
  select: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff' },
  emptyState: { padding: 60, textAlign: 'center', border: '1px dashed #d1d5db', borderRadius: 12, background: '#fff', marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#6b7280', marginBottom: 18, maxWidth: 460, margin: '0 auto 18px', lineHeight: 1.6 },
  emptyCreateBtn: { padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  hubGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 },
  hubCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  hubCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  hubName: { fontSize: 15, fontWeight: 800, color: '#111827' },
  hubCode: { fontSize: 11, color: '#6b7280', fontWeight: 700, marginTop: 2, fontFamily: 'monospace' },
  statusPill: { display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' },
  hubTypeRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  typePill: { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  tierPill: { display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', color: '#374151', borderRadius: 4, fontSize: 10, fontWeight: 800 },
  hubAddress: { fontSize: 13, color: '#111827', lineHeight: 1.5 },
  hubStats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '10px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' },
  hubStatLabel: { fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  hubStatValue: { fontSize: 15, fontWeight: 800, color: '#111827', marginTop: 2 },
  utilRow: { display: 'flex', alignItems: 'center', gap: 8 },
  utilLabel: { fontSize: 11, fontWeight: 700, color: '#6b7280', minWidth: 70, textTransform: 'uppercase' },
  utilTrack: { flex: 1, height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' },
  utilFill: { height: '100%', transition: 'width .3s' },
  utilValue: { fontSize: 11, fontWeight: 800, color: '#111827', minWidth: 36, textAlign: 'right' },
  hubActions: { display: 'flex', gap: 6, marginTop: 4 },
  smallBtnPrimary: { padding: '6px 12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  smallBtnGhost: { padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  mapWrapper: { position: 'relative', width: '100%', height: 520, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f3f4f6' },
  mapCanvas: { width: '100%', height: '100%' },
  mapLoading: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 14, color: '#6b7280', fontWeight: 700 },
  mapError: { padding: 30, textAlign: 'center', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 12, fontSize: 13 },
  mapPickerWrapper: { width: '100%', height: 280, borderRadius: 8, overflow: 'hidden', border: '1px solid #d1d5db', marginBottom: 8, background: '#f3f4f6' },
  mapPicker: { width: '100%', height: '100%' },
  coordRow: { display: 'flex', gap: 18, fontSize: 12, color: '#374151', marginBottom: 12 },
  drawerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' },
  drawer: { width: 'min(820px, 100%)', height: '100%', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  drawerHeader: { padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  drawerTitle: { fontSize: 16, fontWeight: 700, color: '#111827' },
  drawerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  drawerClose: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', padding: 4, lineHeight: 1 },
  drawerBody: { padding: 20, overflowY: 'auto', flex: 1 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 16 },
  detailItem: { padding: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 },
  detailItemLabel: { fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  detailItemValue: { fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 4, wordBreak: 'break-word' },
  descriptionBox: { padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, fontSize: 13, lineHeight: 1.6 },
  descriptionLabel: { fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  sectorList: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectorRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, flexWrap: 'wrap' },
  linkRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 },
  primaryBtn: { padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  ghostBtn: { padding: '9px 18px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  stepRow: { display: 'flex', gap: 10, marginBottom: 18, fontSize: 11, flexWrap: 'wrap' },
  step: { color: '#9ca3af', fontWeight: 600 },
  stepActive: { color: '#1d4ed8', fontWeight: 800 },
  fieldLabel: { fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6, marginTop: 8 },
  textInput: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', marginBottom: 10 },
  textarea: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 },
  gridTwoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  pillRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  pill: { padding: '7px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' },
  pillActive: { padding: '7px 12px', background: '#111827', color: '#fff', border: '1px solid #111827', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  infoBox: { padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#1e40af', marginBottom: 16, lineHeight: 1.6 },
  confirmBox: { padding: 14, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.7 },
  wizardActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: '#6b7280', whiteSpace: 'nowrap' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' },
};