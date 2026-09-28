import React, { useState } from 'react';
import { HubLocation, Partner, Booking } from '../../types';
import { 
  MapPin, 
  Filter, 
  Users, 
  ShieldCheck, 
  Navigation, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Compass,
  AlertTriangle,
  X,
  Phone
} from 'lucide-react';

interface AdminHubMapViewProps {
  hubs: HubLocation[];
  partners: Partner[];
  bookings: Booking[];
  onSelectHub?: (hubId: string) => void;
}

export const AdminHubMapView: React.FC<AdminHubMapViewProps> = ({
  hubs,
  partners,
  bookings,
  onSelectHub
}) => {
  const [selectedState, setSelectedState] = useState<'ALL' | 'Haryana' | 'Bihar' | 'Jharkhand'>('ALL');
  const [selectedHub, setSelectedHub] = useState<HubLocation | null>(hubs[0] || null);
  const [mapZoom, setMapZoom] = useState<number>(1);

  const states = ['ALL', 'Haryana', 'Bihar', 'Jharkhand'] as const;

  // Filter hubs by state
  const filteredHubs = hubs.filter(h => {
    if (selectedState === 'ALL') return true;
    return h.state === selectedState;
  });

  // Calculate coordinates bounds for map view
  const hubPartners = selectedHub 
    ? partners.filter(p => p.assignedHubId === selectedHub.id) 
    : [];

  const hubBookings = selectedHub 
    ? bookings.filter(b => b.assignedHubId === selectedHub.id || b.address.city.toLowerCase() === selectedHub.city.toLowerCase())
    : [];

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Module 03 &bull; Hub Map View
            </span>
            <span className="text-xs text-[#8E8E93]">Geographical Cluster &amp; Service Radius Engine</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Regional Hub Dispatch Radius &amp; Coverage Pins
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Live geospatial node map across Haryana (Gurugram sectors), Bihar (Patna localities), and Jharkhand (Ranchi zones). Click any pin to inspect active fleet and pending bookings.
          </p>
        </div>

        {/* State Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          {states.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedState === st 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All 3 States' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map + Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Map Visualizer (2 Cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[520px]">
          {/* Map Controls Header */}
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 text-white">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '12s' }} />
              <div>
                <span className="text-xs font-black tracking-wide uppercase font-mono text-slate-200">
                  {selectedState === 'ALL' ? 'Northern & Eastern India Region' : `${selectedState} Operations Cluster`}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {filteredHubs.length} operational hubs pinned with radial boundaries
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
                GPS Coordinate Grounding: Active
              </span>
            </div>
          </div>

          {/* Interactive Visual Map Canvas */}
          <div className="my-8 relative h-72 sm:h-96 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 p-4 flex items-center justify-center overflow-hidden">
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Hub Pins Display */}
            <div className="relative z-10 w-full h-full flex flex-wrap items-center justify-around gap-4 p-4">
              {filteredHubs.map((hub, idx) => {
                const isSelected = selectedHub?.id === hub.id;
                const activePartnersCount = partners.filter(p => p.assignedHubId === hub.id && p.isOnline).length;
                return (
                  <button
                    key={hub.id}
                    onClick={() => setSelectedHub(hub)}
                    className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center shadow-lg transform hover:scale-105 ${
                      isSelected 
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50' 
                        : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500'
                    }`}
                    style={{ minWidth: '130px' }}
                  >
                    {/* Radial circle representation */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-transform ${
                      isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                    }`}>
                      <MapPin className="w-5 h-5" />
                    </div>

                    <span className="text-xs font-bold text-white truncate max-w-[120px]">
                      {hub.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {hub.city} &bull; {hub.serviceRadiusKm}km
                    </span>

                    <span className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {activePartnersCount} fleet online
                    </span>

                    {/* Animated Pulsing Ring for Selected Hub */}
                    {isSelected && (
                      <span className="absolute -inset-1 rounded-2xl border border-amber-400/60 animate-ping pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Footer Indicators */}
          <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-[11px]">Selected Operational Node</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[11px]">Active Hub Boundary</span>
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              Zero AI &bull; 100% Admin Coordinates Grounding
            </span>
          </div>
        </div>

        {/* Selected Hub Detail Panel (1 Col) */}
        <div className="rounded-3xl bg-white border border-[#E5E5EA] shadow-sm p-6 space-y-5">
          {selectedHub ? (
            <>
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-100 text-blue-800 uppercase">
                    {selectedHub.code || 'HUB-PIN'}
                  </span>
                  <h4 className="text-lg font-black text-slate-900 mt-1">
                    {selectedHub.name}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedHub.city}, {selectedHub.state}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  ACTIVE
                </span>
              </div>

              {/* Hub Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Service Radius</span>
                  <span className="text-base font-black text-slate-900">{selectedHub.serviceRadiusKm} km</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Assigned Fleet</span>
                  <span className="text-base font-black text-blue-700">{hubPartners.length} Technicians</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Center Coordinates</span>
                  <span className="text-xs font-mono font-bold text-slate-800">{selectedHub.lat.toFixed(4)}, {selectedHub.lng.toFixed(4)}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Associated Jobs</span>
                  <span className="text-base font-black text-emerald-700">{hubBookings.length} Delivered</span>
                </div>
              </div>

              {/* Covered Sectors / Areas */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-1.5">
                  Covered Sectors &amp; Localities:
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedHub.coveredSectors.map((sec) => (
                    <span key={sec} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Partners List in this Hub */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Fleet in this Hub ({hubPartners.length}):
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {hubPartners.filter(p => p.isOnline).length} Available Now
                  </span>
                </div>

                {hubPartners.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No technicians mapped to this node yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {hubPartners.map(p => (
                      <div key={p.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${p.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="font-bold text-slate-900">{p.name}</span>
                        </div>
                        <span className="font-mono text-slate-600 text-[11px]">{p.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSelectHub?.(selectedHub.id)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <span>Manage This Hub in Module 02 &rarr;</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select a hub on the map to inspect operational parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHubMapView;
