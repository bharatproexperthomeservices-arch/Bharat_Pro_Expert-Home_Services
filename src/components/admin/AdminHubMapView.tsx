import React, { useState } from 'react';

export const AdminHubMapView: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedHubPin, setSelectedHubPin] = useState<string | null>('Gurugram - Sector 14');

  const hubPins = [
    { id: '1', name: 'Gurugram - Sector 14', state: 'Haryana', partners: 12, jobs: 140, status: 'OPTIMAL' },
    { id: '2', name: 'Gurugram - DLF Cyber City', state: 'Haryana', partners: 28, jobs: 320, status: 'HIGH_DEMAND' },
    { id: '3', name: 'Patna - Boring Road', state: 'Bihar', partners: 15, jobs: 180, status: 'OPTIMAL' },
    { id: '4', name: 'Patna - Kankarbagh', state: 'Bihar', partners: 18, jobs: 195, status: 'OPTIMAL' },
    { id: '5', name: 'Ranchi - Lalpur', state: 'Jharkhand', partners: 14, jobs: 150, status: 'BACKLOG_ALERT' },
  ];

  const filteredPins = hubPins.filter((h) => selectedState === 'ALL' || h.state === selectedState);

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Hub Interactive GIS Map View</h1>
          <p className="text-slate-400 text-sm">Real-time Coverage Radius, Partner Pins & Regional Density Overlays</p>
        </div>
        <div className="flex gap-2">
          {['ALL', 'Haryana', 'Bihar', 'Jharkhand'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                selectedState === st ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Simulation Container */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl h-[500px] relative overflow-hidden flex items-center justify-center p-6 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

          {/* Simulated Interactive Map Pins */}
          <div className="relative w-full h-full flex flex-wrap items-center justify-around p-8">
            {filteredPins.map((pin) => (
              <div
                key={pin.id}
                onClick={() => setSelectedHubPin(pin.name)}
                className={`p-4 rounded-2xl border cursor-pointer backdrop-blur-md transition transform hover:scale-105 ${
                  selectedHubPin === pin.name
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400'
                    : 'bg-slate-900/90 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${pin.status === 'HIGH_DEMAND' ? 'bg-amber-400 animate-ping' : pin.status === 'BACKLOG_ALERT' ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                  <span className="font-bold text-xs text-white">{pin.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Pros: {pin.partners} | Active Jobs: {pin.jobs}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Hub Inspector Side Panel */}
        <div className="lg:col-span-4 bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Hub Telemetry Panel</h3>
          {selectedHubPin ? (
            <div className="space-y-3">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400">Selected Hub</span>
                <h4 className="text-lg font-bold text-white">{selectedHubPin}</h4>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs flex justify-between">
                <span className="text-slate-400">Geofence Radius:</span>
                <span className="font-bold text-amber-400">6.0 KM</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs flex justify-between">
                <span className="text-slate-400">Live Active Fleet:</span>
                <span className="font-bold text-emerald-400">Online & Tracking</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Click any pin on the map to inspect hub metrics.</p>
          )}
        </div>
      </div>
    </div>
  );
};