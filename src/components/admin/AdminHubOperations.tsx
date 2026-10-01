import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HubLocation, Partner } from '../../types';
import { getAllBookings } from '../../services/dbService';
import {
  IndiaMap,
  INDIA_CENTER,
  INDIA_BOUNDS,
  GeoResult,
  searchPlaces,
  reversePlace,
  hubId,
  hubName,
  hubLat,
  hubLng,
  hubRadius,
  hubCity,
  hubState,
  hubSector,
  hubIsActive,
  hubIsArchived,
  partnersOfHub,
  bookingsOfHub,
  statusValues
} from './HubMapCore';

interface AdminHubOperationsProps {
  hubs: HubLocation[];
  partners: Partner[];
  onUpdateHubs: (updated: HubLocation[]) => void;
  onAuditLog: (action: string, targetId: string, details: string) => void;
}

interface HubForm {
  id?: string;
  name: string;
  state: string;
  city: string;
  sector: string;
  lat: string;
  lng: string;
  radiusKm: string;
  active: boolean;
}

const emptyForm: HubForm = {
  name: '',
  state: '',
  city: '',
  sector: '',
  lat: '',
  lng: '',
  radiusKm: '5',
  active: true
};

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const labelCls = 'block text-[11px] font-bold text-slate-600 mb-1';

export const AdminHubOperations: React.FC<AdminHubOperationsProps> = ({
  hubs,
  partners,
  onUpdateHubs,
  onAuditLog
}) => {
  const hubList = (hubs || []) as any[];
  const partnerList = (partners || []) as any[];
  const sv = statusValues(hubList);

  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [form, setForm] = useState<HubForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [geoQuery, setGeoQuery] = useState('');
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number; key: number } | null>(null);
  const focusKey = useRef(0);
  const revTimer = useRef<any>(null);

  const flyTo = (lat: number, lng: number, zoom: number) => {
    focusKey.current += 1;
    setFocus({ lat, lng, zoom, key: focusKey.current });
  };

  useEffect(() => () => clearTimeout(revTimer.current), []);

  // Address search (Nominatim) with 1 second debounce
  useEffect(() => {
    const q = geoQuery.trim();
    if (q.length < 3) {
      setGeoResults([]);
      setGeoError(null);
      return;
    }
    const t = setTimeout(async () => {
      setGeoLoading(true);
      setGeoError(null);
      try {
        setGeoResults(await searchPlaces(q));
      } catch (e: any) {
        setGeoError(e?.message || 'Search fail hua');
        setGeoResults([]);
      } finally {
        setGeoLoading(false);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [geoQuery]);

  /* ---------------- filters ---------------- */
  const states = useMemo(
    () => Array.from(new Set(hubList.map(hubState).filter(Boolean))).sort(),
    [hubList]
  );
  const cities = useMemo(
    () =>
      Array.from(
        new Set(hubList.filter(h => !stateFilter || hubState(h) === stateFilter).map(hubCity).filter(Boolean))
      ).sort(),
    [hubList, stateFilter]
  );

  const visibleHubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hubList.filter(h => {
      if (!showArchived && hubIsArchived(h)) return false;
      if (stateFilter && hubState(h) !== stateFilter) return false;
      if (cityFilter && hubCity(h) !== cityFilter) return false;
      if (q) {
        const hay = `${hubName(h)} ${hubCity(h)} ${hubState(h)} ${hubSector(h)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [hubList, showArchived, stateFilter, cityFilter, query]);

  const zoomToFilter = (st: string, ct: string) => {
    const pts = hubList
      .filter(h => !hubIsArchived(h) && (!st || hubState(h) === st) && (!ct || hubCity(h) === ct))
      .map(h => ({ lat: hubLat(h), lng: hubLng(h) }))
      .filter(p => p.lat !== null && p.lng !== null) as { lat: number; lng: number }[];
    if (!st && !ct) {
      flyTo(INDIA_CENTER.lat, INDIA_CENTER.lng, 5);
      return;
    }
    if (pts.length === 0) return;
    const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
    flyTo(lat, lng, ct ? (pts.length === 1 ? 13 : 10) : 7);
  };

  const resetToIndia = () => {
    setStateFilter('');
    setCityFilter('');
    setSelectedId(null);
    flyTo(INDIA_CENTER.lat, INDIA_CENTER.lng, 5);
  };

  const selectedHub = hubList.find(h => hubId(h) === selectedId) || null;

  /* ---------------- form helpers ---------------- */
  const startAdd = () => {
    setForm({ ...emptyForm });
    setFormError(null);
    setGeoQuery('');
    setGeoResults([]);
    setSelectedId(null);
    setMode('form');
  };

  const startEdit = (h: any) => {
    setForm({
      id: hubId(h),
      name: hubName(h),
      state: hubState(h),
      city: hubCity(h),
      sector: hubSector(h),
      lat: hubLat(h) !== null ? String(hubLat(h)) : '',
      lng: hubLng(h) !== null ? String(hubLng(h)) : '',
      radiusKm: String(hubRadius(h)),
      active: hubIsActive(h)
    });
    setFormError(null);
    setGeoQuery('');
    setGeoResults([]);
    setSelectedId(hubId(h));
    setMode('form');
    const la = hubLat(h);
    const ln = hubLng(h);
    if (la !== null && ln !== null) flyTo(la, ln, 13);
  };

  const cancelForm = () => {
    setMode('list');
    setFormError(null);
    setGeoResults([]);
  };

  const handleDraft = (lat: number, lng: number) => {
    setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
    clearTimeout(revTimer.current);
    revTimer.current = setTimeout(async () => {
      try {
        const r = await reversePlace(lat, lng);
        setForm(f => ({
          ...f,
          state: f.state || r.state,
          city: f.city || r.city,
          sector: f.sector || r.sector
        }));
      } catch {
        /* ignore reverse lookup errors */
      }
    }, 1000);
  };

  const pickGeo = (r: GeoResult) => {
    setForm(f => ({
      ...f,
      lat: r.lat.toFixed(6),
      lng: r.lng.toFixed(6),
      state: r.state || f.state,
      city: r.city || f.city,
      sector: r.sector || f.sector
    }));
    setGeoResults([]);
    setGeoQuery('');
    flyTo(r.lat, r.lng, 14);
  };

  const draftLat = parseFloat(form.lat);
  const draftLng = parseFloat(form.lng);
  const draft =
    mode === 'form' && Number.isFinite(draftLat) && Number.isFinite(draftLng)
      ? { lat: draftLat, lng: draftLng }
      : null;

  const saveForm = () => {
    const name = form.name.trim();
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    const radius = parseFloat(form.radiusKm);

    if (!name) return setFormError('Hub ka naam likho.');
    if (!form.state.trim() || !form.city.trim()) return setFormError('State aur City zaroori hain.');
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
      return setFormError('Map par pin lagao ya search karo, ya lat/lng bharo.');
    if (
      lat < INDIA_BOUNDS.minLat ||
      lat > INDIA_BOUNDS.maxLat ||
      lng < INDIA_BOUNDS.minLng ||
      lng > INDIA_BOUNDS.maxLng
    )
      return setFormError('Location India ke andar honi chahiye.');
    if (!Number.isFinite(radius) || radius <= 0 || radius > 200)
      return setFormError('Service radius 0 se bada aur 200 km tak hona chahiye.');
    const dup = hubList.some(
      h => hubName(h).trim().toLowerCase() === name.toLowerCase() && hubId(h) !== (form.id || '')
    );
    if (dup) return setFormError('Is naam ka hub pehle se hai.');

    const base: any = {
      name,
      hubName: name,
      state: form.state.trim(),
      city: form.city.trim(),
      sector: form.sector.trim(),
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      radiusKm: radius,
      status: form.active ? sv.active : sv.inactive,
      archived: false
    };

    let updated: any[];
    if (form.id) {
      updated = hubList.map(h => (hubId(h) === form.id ? { ...h, ...base } : h));
      onAuditLog('HUB_UPDATED', form.id, `Hub "${name}" update kiya (${base.city}, ${base.state}).`);
      setSelectedId(form.id);
    } else {
      const id = `HUB-${Date.now()}`;
      updated = [...hubList, { id, createdAt: new Date().toISOString(), ...base }];
      onAuditLog('HUB_CREATED', id, `Naya hub "${name}" banaya (${base.city}, ${base.state}).`);
      setSelectedId(id);
    }
    onUpdateHubs(updated as HubLocation[]);
    setMode('list');
    setFormError(null);
  };

  /* ---------------- archive / delete ---------------- */
  const setArchived = (h: any, archived: boolean) => {
    const id = hubId(h);
    const updated = hubList.map(x =>
      hubId(x) === id ? { ...x, archived, status: archived ? sv.inactive : sv.active } : x
    );
    onUpdateHubs(updated as HubLocation[]);
    onAuditLog(
      archived ? 'HUB_ARCHIVED' : 'HUB_RESTORED',
      id,
      `Hub "${hubName(h)}" ${archived ? 'archive' : 'restore'} kiya.`
    );
  };

  const removeHub = async (h: any) => {
    const id = hubId(h);
    const partnerCount = partnersOfHub(h, partnerList).length;
    let bookingCount = 0;
    try {
      bookingCount = bookingsOfHub(h, (await getAllBookings()) as any[]).length;
    } catch {
      /* bookings load na ho to sirf partners se check hoga */
    }
    if (partnerCount > 0 || bookingCount > 0) {
      alert(
        `Is hub se ${partnerCount} partner aur ${bookingCount} booking jude hain, isliye delete nahi ho sakta. Hub archive kar diya gaya hai.`
      );
      setArchived(h, true);
      return;
    }
    if (!window.confirm(`"${hubName(h)}" hub permanent delete karna hai? Ye wapas nahi aayega.`)) return;
    onUpdateHubs(hubList.filter(x => hubId(x) !== id) as HubLocation[]);
    onAuditLog('HUB_DELETED', id, `Hub "${hubName(h)}" permanent delete kiya.`);
    if (selectedId === id) setSelectedId(null);
  };

  const activeCount = hubList.filter(h => hubIsActive(h)).length;

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Hub Management</h2>
          <p className="text-[12px] text-slate-500">
            India map par hub add karo, service radius set karo aur status manage karo.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">Total: {hubList.length}</span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">Active: {activeCount}</span>
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700">
              Inactive: {hubList.length - activeCount}
            </span>
          </div>
        </div>
        <button
          onClick={startAdd}
          className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-[12px] font-extrabold cursor-pointer"
        >
          + Add Hub
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-[12px] font-bold text-slate-600">
        <button onClick={resetToIndia} className="text-blue-600 hover:underline cursor-pointer">
          India
        </button>
        {stateFilter && (
          <>
            <span>&gt;</span>
            <button
              onClick={() => {
                setCityFilter('');
                zoomToFilter(stateFilter, '');
              }}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {stateFilter}
            </button>
          </>
        )}
        {cityFilter && (
          <>
            <span>&gt;</span>
            <span>{cityFilter}</span>
          </>
        )}
        {selectedHub && hubSector(selectedHub) && (
          <>
            <span>&gt;</span>
            <span>{hubSector(selectedHub)}</span>
          </>
        )}
        {selectedHub && (
          <>
            <span>&gt;</span>
            <span className="text-slate-900">{hubName(selectedHub)}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Map */}
        <div className="order-1 xl:order-2 xl:col-span-3">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-3">
            <IndiaMap
              className="h-[420px] xl:h-[600px]"
              hubs={visibleHubs}
              selectedId={selectedId}
              onSelectHub={id => {
                setSelectedId(id);
                const h = hubList.find(x => hubId(x) === id);
                if (h && mode === 'list') {
                  const la = hubLat(h);
                  const ln = hubLng(h);
                  if (la !== null && ln !== null) flyTo(la, ln, 12);
                }
              }}
              draft={draft}
              onDraftChange={mode === 'form' ? handleDraft : undefined}
              focus={focus}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981] mr-1" />
                Active
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EF4444] ml-3 mr-1" />
                Inactive
                {mode === 'form' && (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2563EB] ml-3 mr-1" />
                    Naya pin (map par click ya drag karo)
                  </>
                )}
              </span>
              <button onClick={resetToIndia} className="font-bold text-blue-600 hover:underline cursor-pointer">
                Poora India dekho
              </button>
            </div>
          </div>
        </div>

        {/* Left panel */}
        <div className="order-2 xl:order-1 xl:col-span-2 space-y-4">
          {mode === 'list' ? (
            <>
              {/* Filters */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Hub, city ya state search karo"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={stateFilter}
                    onChange={e => {
                      setStateFilter(e.target.value);
                      setCityFilter('');
                      zoomToFilter(e.target.value, '');
                    }}
                    className={inputCls}
                  >
                    <option value="">Saare States</option>
                    {states.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <select
                    value={cityFilter}
                    onChange={e => {
                      setCityFilter(e.target.value);
                      zoomToFilter(stateFilter, e.target.value);
                    }}
                    className={inputCls}
                  >
                    <option value="">Saare Cities</option>
                    {cities.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                  Archived hubs bhi dikhao
                </label>
              </div>

              {/* List */}
              {hubList.length === 0 ? (
                <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-8 text-center">
                  <p className="text-[13px] font-bold text-slate-700">Abhi koi hub nahi hai.</p>
                  <p className="mt-1 text-[12px] text-slate-500">
                    Map par search karke pehla hub add karo.
                  </p>
                  <button
                    onClick={startAdd}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-[12px] font-extrabold cursor-pointer"
                  >
                    + Pehla Hub Add Karo
                  </button>
                </div>
              ) : visibleHubs.length === 0 ? (
                <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center text-[12px] text-slate-500">
                  Is filter mein koi hub nahi mila.
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {visibleHubs.map((h, i) => {
                    const id = hubId(h);
                    const active = hubIsActive(h);
                    const archived = hubIsArchived(h);
                    const pc = partnersOfHub(h, partnerList).length;
                    const la = hubLat(h);
                    const ln = hubLng(h);
                    return (
                      <div
                        key={id || `${hubName(h)}-${i}`}
                        onClick={() => {
                          setSelectedId(id);
                          if (la !== null && ln !== null) flyTo(la, ln, 13);
                        }}
                        className={`rounded-2xl bg-white border shadow-sm p-4 cursor-pointer ${
                          id === selectedId ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[14px] font-extrabold text-slate-900 truncate">{hubName(h)}</p>
                            <p className="text-[12px] text-slate-500 truncate">
                              {[hubSector(h), hubCity(h), hubState(h)].filter(Boolean).join(', ') || 'Location set nahi'}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-extrabold text-white ${
                              archived ? 'bg-slate-500' : active ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                            }`}
                          >
                            {archived ? 'ARCHIVED' : active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-600">
                          <span>Partners: <b>{pc}</b></span>
                          <span>Radius: <b>{hubRadius(h)} km</b></span>
                          {(la === null || ln === null) && (
                            <span className="text-amber-600 font-bold">Map location set nahi</span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => startEdit(h)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                          {archived ? (
                            <button
                              onClick={() => setArchived(h, false)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold cursor-pointer"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => setArchived(h, true)}
                              className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold cursor-pointer"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => removeHub(h)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* ---------------- Add / Edit form ---------------- */
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="text-[15px] font-extrabold text-slate-900">
                {form.id ? 'Hub Edit Karo' : 'Naya Hub Add Karo'}
              </h3>

              <div className="relative">
                <label className={labelCls}>Location search (India)</label>
                <input
                  value={geoQuery}
                  onChange={e => setGeoQuery(e.target.value)}
                  placeholder="Jaise: Sector 85 Gurgaon"
                  className={inputCls}
                />
                {geoLoading && <p className="mt-1 text-[11px] text-slate-500">Dhundh rahe hain...</p>}
                {geoError && <p className="mt-1 text-[11px] text-rose-600">{geoError}</p>}
                {geoResults.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {geoResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => pickGeo(r)}
                        className="block w-full text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-blue-50 cursor-pointer"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[11px] text-slate-500">
                  Ya seedha map par click karo. Pin ko drag karke sahi jagah laga sakte ho.
                </p>
              </div>

              <div>
                <label className={labelCls}>Hub ka naam *</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="Jaise: Gurgaon Sector 85 Hub"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>State *</label>
                  <input
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>City *</label>
                  <input
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Sector / Area</label>
                <input
                  value={form.sector}
                  onChange={e => setForm({ ...form, sector: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Latitude *</label>
                  <input
                    value={form.lat}
                    onChange={e => setForm({ ...form, lat: e.target.value })}
                    className={inputCls}
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className={labelCls}>Longitude *</label>
                  <input
                    value={form.lng}
                    onChange={e => setForm({ ...form, lng: e.target.value })}
                    className={inputCls}
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Service radius (km) *</label>
                  <input
                    value={form.radiusKm}
                    onChange={e => setForm({ ...form, radiusKm: e.target.value })}
                    className={inputCls}
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    value={form.active ? 'A' : 'I'}
                    onChange={e => setForm({ ...form, active: e.target.value === 'A' })}
                    className={inputCls}
                  >
                    <option value="A">Active</option>
                    <option value="I">Inactive</option>
                  </select>
                </div>
              </div>

              {formError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-[12px] font-semibold text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={saveForm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-[12px] font-extrabold cursor-pointer"
                >
                  {form.id ? 'Changes Save Karo' : 'Hub Save Karo'}
                </button>
                <button
                  onClick={cancelForm}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] font-extrabold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHubOperations;
