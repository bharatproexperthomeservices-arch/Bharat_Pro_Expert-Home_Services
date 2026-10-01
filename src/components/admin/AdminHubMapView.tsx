import React, { useMemo, useRef, useState } from 'react';
import { HubLocation, Partner, Booking } from '../../types';
import {
  IndiaMap,
  INDIA_CENTER,
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
  bookingsOfHub
} from './HubMapCore';

interface AdminHubMapViewProps {
  hubs: HubLocation[];
  partners: Partner[];
  bookings: Booking[];
  onSelectHub: () => void;
}

export const AdminHubMapView: React.FC<AdminHubMapViewProps> = ({
  hubs,
  partners,
  bookings,
  onSelectHub
}) => {
  const hubList = useMemo(() => ((hubs || []) as any[]).filter(h => !hubIsArchived(h)), [hubs]);
  const partnerList = (partners || []) as any[];
  const bookingList = (bookings || []) as any[];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number; key: number } | null>(null);
  const focusKey = useRef(0);

  const flyTo = (lat: number, lng: number, zoom: number) => {
    focusKey.current += 1;
    setFocus({ lat, lng, zoom, key: focusKey.current });
  };

  const activeCount = hubList.filter(h => hubIsActive(h)).length;
  const missingLocation = hubList.filter(h => hubLat(h) === null || hubLng(h) === null).length;
  const selected = hubList.find(h => hubId(h) === selectedId) || null;

  const chips = [
    { label: 'Total Hubs', value: hubList.length, cls: 'bg-blue-50 text-blue-700' },
    { label: 'Active', value: activeCount, cls: 'bg-emerald-50 text-emerald-700' },
    { label: 'Inactive', value: hubList.length - activeCount, cls: 'bg-rose-50 text-rose-700' },
    { label: 'Partners', value: partnerList.length, cls: 'bg-violet-50 text-violet-700' },
    { label: 'Bookings', value: bookingList.length, cls: 'bg-amber-50 text-amber-700' }
  ];

  return (
    <div className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {chips.map(c => (
          <div key={c.label} className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-4`}>
            <p className="text-[11px] font-semibold text-slate-500">{c.label}</p>
            <p className={`mt-1 inline-block px-3 py-1 rounded-full text-[15px] font-extrabold ${c.cls}`}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {hubList.length === 0 && (
        <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-6 text-center">
          <p className="text-[13px] font-bold text-slate-700">Abhi koi hub nahi hai.</p>
          <p className="mt-1 text-[12px] text-slate-500">
            "Hub List" mein jaakar pehla hub add karo, phir wo yahan India map par dikhega.
          </p>
        </div>
      )}

      {missingLocation > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-[12px] font-semibold text-amber-800">
          {missingLocation} hub ki map location set nahi hai, isliye wo map par nahi dikh rahe.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Map */}
        <div className="xl:col-span-3 rounded-2xl bg-white border border-slate-200 shadow-sm p-3">
          <IndiaMap
            className="h-[460px] xl:h-[600px]"
            hubs={hubList}
            selectedId={selectedId}
            onSelectHub={id => {
              setSelectedId(id);
              const h = hubList.find(x => hubId(x) === id);
              if (h) {
                const la = hubLat(h);
                const ln = hubLng(h);
                if (la !== null && ln !== null) flyTo(la, ln, 12);
              }
            }}
            focus={focus}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981] mr-1" />
              Active
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EF4444] ml-3 mr-1" />
              Inactive
            </span>
            <button
              onClick={() => {
                setSelectedId(null);
                flyTo(INDIA_CENTER.lat, INDIA_CENTER.lng, 5);
              }}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Poora India dekho
            </button>
          </div>
        </div>

        {/* Info card */}
        <div className="xl:col-span-1">
          {selected ? (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-extrabold text-slate-900">{hubName(selected)}</h3>
                <span
                  className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-extrabold text-white ${
                    hubIsActive(selected) ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                  }`}
                >
                  {hubIsActive(selected) ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <dl className="text-[12px] text-slate-600 space-y-1.5">
                <div className="flex justify-between"><dt>City</dt><dd className="font-bold text-slate-900">{hubCity(selected) || '-'}</dd></div>
                <div className="flex justify-between"><dt>State</dt><dd className="font-bold text-slate-900">{hubState(selected) || '-'}</dd></div>
                <div className="flex justify-between"><dt>Sector / Area</dt><dd className="font-bold text-slate-900">{hubSector(selected) || '-'}</dd></div>
                <div className="flex justify-between"><dt>Partners</dt><dd className="font-bold text-slate-900">{partnersOfHub(selected, partnerList).length}</dd></div>
                <div className="flex justify-between"><dt>Bookings</dt><dd className="font-bold text-slate-900">{bookingsOfHub(selected, bookingList).length}</dd></div>
                <div className="flex justify-between"><dt>Service radius</dt><dd className="font-bold text-slate-900">{hubRadius(selected)} km</dd></div>
              </dl>
              <button
                onClick={onSelectHub}
                className="w-full px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-[12px] font-extrabold cursor-pointer"
              >
                Manage Hub
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-5 text-center text-[12px] text-slate-500">
              Hub ki details dekhne ke liye map par kisi hub pin par click karo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHubMapView;
