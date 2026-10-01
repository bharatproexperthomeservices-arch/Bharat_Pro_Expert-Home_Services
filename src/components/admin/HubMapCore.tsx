import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    L?: any;
  }
}

/* ------------------------------------------------------------------ */
/* Leaflet loader (CDN, no npm install needed)                         */
/* ------------------------------------------------------------------ */
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
let leafletPromise: Promise<any> | null = null;

export function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window nahi mila'));
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet="1"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.setAttribute('data-leaflet', '1');
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error('Leaflet load nahi hua')));
    script.onerror = () => {
      leafletPromise = null;
      reject(new Error('Map load nahi hua. Internet check karke page reload karo.'));
    };
    document.body.appendChild(script);
  });
  return leafletPromise;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
export const INDIA_CENTER = { lat: 22.9734, lng: 78.6569 };
export const INDIA_BOUNDS = { minLat: 6, maxLat: 37.5, minLng: 68, maxLng: 98 };

/* ------------------------------------------------------------------ */
/* Hub field helpers (works with different field names)                */
/* ------------------------------------------------------------------ */
const num = (v: any): number | null => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

export const hubId = (h: any): string => String(h?.id ?? h?.hubId ?? '');
export const hubName = (h: any): string => String(h?.name ?? h?.hubName ?? 'Unnamed Hub');
export const hubLat = (h: any): number | null =>
  num(h?.lat ?? h?.latitude ?? h?.coordinates?.lat ?? h?.location?.lat ?? h?.position?.lat);
export const hubLng = (h: any): number | null =>
  num(h?.lng ?? h?.longitude ?? h?.coordinates?.lng ?? h?.location?.lng ?? h?.position?.lng);
export const hubRadius = (h: any): number => {
  const r = num(h?.radiusKm ?? h?.serviceRadiusKm ?? h?.radius) ?? 5;
  return r > 200 ? r / 1000 : r;
};
export const hubCity = (h: any): string => String(h?.city ?? '');
export const hubState = (h: any): string => String(h?.state ?? '');
export const hubSector = (h: any): string => String(h?.sector ?? h?.area ?? '');
export const hubIsArchived = (h: any): boolean =>
  !!h?.archived || String(h?.status ?? '').toLowerCase() === 'archived';
export const hubIsActive = (h: any): boolean => {
  if (hubIsArchived(h)) return false;
  if (h?.isActive === false) return false;
  return !/inactive|disabled|paused|closed|suspended/i.test(String(h?.status ?? ''));
};

export const statusValues = (hubs: any[]) => {
  const sample = hubs.map(h => h?.status).find(s => typeof s === 'string') as string | undefined;
  const upper = sample ? sample === sample.toUpperCase() : true;
  return { active: upper ? 'ACTIVE' : 'active', inactive: upper ? 'INACTIVE' : 'inactive' };
};

export const partnersOfHub = (hub: any, partners: any[]): any[] => {
  const id = hubId(hub);
  const city = hubCity(hub).toLowerCase();
  return (partners || []).filter((p: any) => {
    if (id && [p?.hubId, p?.assignedHubId, p?.hub_id, p?.hub?.id].some(x => x && String(x) === id)) return true;
    const pc = String(p?.city ?? p?.hubCity ?? '').toLowerCase();
    return !!pc && !!city && pc === city;
  });
};

export const bookingsOfHub = (hub: any, bookings: any[]): any[] => {
  const id = hubId(hub);
  const city = hubCity(hub).toLowerCase();
  return (bookings || []).filter((b: any) => {
    if (id && [b?.hubId, b?.assignedHubId, b?.hub_id, b?.hub?.id].some(x => x && String(x) === id)) return true;
    const bc = String(b?.city ?? b?.address?.city ?? '').toLowerCase();
    return !!bc && !!city && bc === city;
  });
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);

/* ------------------------------------------------------------------ */
/* Free geocoding (OpenStreetMap Nominatim)                            */
/* ------------------------------------------------------------------ */
export interface GeoResult {
  label: string;
  lat: number;
  lng: number;
  state: string;
  city: string;
  sector: string;
}

const parseAddr = (a: any) => ({
  state: a?.state || '',
  city: a?.city || a?.town || a?.village || a?.state_district || a?.county || '',
  sector: a?.suburb || a?.neighbourhood || a?.city_district || a?.quarter || ''
});

export async function searchPlaces(q: string): Promise<GeoResult[]> {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=' +
    encodeURIComponent(q);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Search fail hua (' + res.status + ')');
  const data = await res.json();
  return (data || []).map((d: any) => ({
    label: d.display_name as string,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    ...parseAddr(d.address)
  }));
}

export async function reversePlace(lat: number, lng: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Reverse search fail hua');
  const d = await res.json();
  return { label: String(d?.display_name || ''), ...parseAddr(d?.address) };
}

/* ------------------------------------------------------------------ */
/* India map component                                                 */
/* ------------------------------------------------------------------ */
interface IndiaMapProps {
  hubs: any[];
  selectedId?: string | null;
  onSelectHub?: (id: string) => void;
  draft?: { lat: number; lng: number } | null;
  onDraftChange?: (lat: number, lng: number) => void;
  focus?: { lat: number; lng: number; zoom: number; key: number } | null;
  className?: string;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({
  hubs,
  selectedId,
  onSelectHub,
  draft,
  onDraftChange,
  focus,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const draftRef = useRef<any>(null);
  const cbSelect = useRef(onSelectHub);
  const cbDraft = useRef(onDraftChange);
  cbSelect.current = onSelectHub;
  cbDraft.current = onDraftChange;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create map once
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then(L => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, {
          center: [INDIA_CENTER.lat, INDIA_CENTER.lng],
          zoom: 5,
          minZoom: 4,
          maxZoom: 18,
          maxBounds: [
            [INDIA_BOUNDS.minLat, INDIA_BOUNDS.minLng],
            [INDIA_BOUNDS.maxLat, INDIA_BOUNDS.maxLng]
          ],
          maxBoundsViscosity: 1.0
        });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        map.on('click', (e: any) => {
          if (cbDraft.current) cbDraft.current(e.latlng.lat, e.latlng.lng);
        });
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 250);
        setReady(true);
      })
      .catch(e => setError(e?.message || 'Map load nahi hua'));

    const onResize = () => mapRef.current && mapRef.current.invalidateSize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        draftRef.current = null;
      }
      setReady(false);
    };
  }, []);

  // Draw hubs (pin + service radius circle)
  useEffect(() => {
    const L = window.L;
    if (!ready || !mapRef.current || !layerRef.current || !L) return;
    layerRef.current.clearLayers();
    (hubs || []).forEach(h => {
      const lat = hubLat(h);
      const lng = hubLng(h);
      if (lat === null || lng === null) return;
      const color = hubIsActive(h) ? '#10B981' : '#EF4444';
      const selected = hubId(h) === selectedId;
      L.circle([lat, lng], {
        radius: hubRadius(h) * 1000,
        color,
        weight: selected ? 3 : 1.5,
        fillColor: color,
        fillOpacity: 0.12,
        interactive: false
      }).addTo(layerRef.current);
      const size = selected ? 24 : 18;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45)"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });
      const marker = L.marker([lat, lng], { icon, bubblingMouseEvents: false }).addTo(layerRef.current);
      marker.bindTooltip(esc(hubName(h)), { direction: 'top' });
      marker.on('click', () => cbSelect.current && cbSelect.current(hubId(h)));
    });
  }, [hubs, selectedId, ready]);

  // Draft pin (draggable) for add / edit
  useEffect(() => {
    const L = window.L;
    if (!ready || !mapRef.current || !L) return;
    if (!draft) {
      if (draftRef.current) {
        draftRef.current.remove();
        draftRef.current = null;
      }
      return;
    }
    if (draftRef.current) {
      draftRef.current.setLatLng([draft.lat, draft.lng]);
      return;
    }
    const icon = L.divIcon({
      className: '',
      html: '<div style="width:26px;height:26px;border-radius:50%;background:#2563EB;border:4px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    const m = L.marker([draft.lat, draft.lng], { icon, draggable: true, bubblingMouseEvents: false }).addTo(mapRef.current);
    m.on('dragend', () => {
      const p = m.getLatLng();
      if (cbDraft.current) cbDraft.current(p.lat, p.lng);
    });
    draftRef.current = m;
  }, [draft?.lat, draft?.lng, ready]);

  // Fly to a location
  useEffect(() => {
    if (!ready || !mapRef.current || !focus) return;
    mapRef.current.flyTo([focus.lat, focus.lng], focus.zoom, { duration: 0.8 });
  }, [focus?.key, ready]);

  return (
    <div className={`relative isolate ${className || ''}`}>
      <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: 320 }} />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-500">
          India map load ho raha hai...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-rose-50 p-6 text-center text-xs font-bold text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default IndiaMap;
