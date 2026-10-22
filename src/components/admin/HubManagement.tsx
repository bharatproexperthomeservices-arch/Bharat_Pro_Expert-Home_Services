import React, { useState } from 'react';
import { HubLocation, Partner } from '../../types';
import { MapPin, Navigation, Users, Plus, Shield, CheckCircle, ChevronDown, ChevronUp, HelpCircle, Layers, RefreshCw } from 'lucide-react';

interface HubManagementProps {
  hubs: HubLocation[];
  partners: Partner[];
  onUpdateHubs: (updated: HubLocation[]) => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const HubManagement: React.FC<HubManagementProps> = ({
  hubs,
  partners,
  onUpdateHubs,
  onAuditLog
}) => {
  const [selectedHub, setSelectedHub] = useState<HubLocation | null>(hubs[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // New Hub State
  const [newHubName, setNewHubName] = useState('');
  const [newHubCode, setNewHubCode] = useState('');
  const [newCity, setNewCity] = useState('Gurugram');
  const [newLat, setNewLat] = useState('28.3545');
  const [newLng, setNewLng] = useState('76.9432');
  const [newRadius, setNewRadius] = useState('8000');
  const [newPincodes, setNewPincodes] = useState('122001, 122002');

  const filteredHubs = hubs.filter(
    h =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.pincodes && h.pincodes.some(p => p.includes(searchQuery)))
  );

  const handleCreateHub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHubName.trim()) return;

    const created: HubLocation = {
      id: `HUB-${Date.now().toString().slice(-4)}`,
      name: newHubName,
      code: newHubCode || `HUB-${newCity.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 90 + 10)}`,
      state: 'Haryana',
      city: newCity,
      coveredSectors: [],
      lat: parseFloat(newLat) || 28.3545,
      lng: parseFloat(newLng) || 76.9432,
      serviceRadiusKm: (parseInt(newRadius) || 8000) / 1000,
      pincodes: newPincodes.split(',').map(s => s.trim()).filter(Boolean),
      status: 'ACTIVE',
      active: true
    };

    const updated = [created, ...hubs];
    onUpdateHubs(updated);
    setSelectedHub(created);
    setShowAddModal(false);
    onAuditLog?.('CREATE_HUB', created.id, `Created new hub ${created.name} in ${created.city}`);

    // Reset form
    setNewHubName('');
    setNewHubCode('');
  };

  const handleToggleStatus = (hubId: string) => {
    const updated = hubs.map(h => {
      if (h.id === hubId) {
        const nextStatus = h.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        return { ...h, status: nextStatus as 'ACTIVE' | 'PAUSED' };
      }
      return h;
    });
    onUpdateHubs(updated);
    if (selectedHub && selectedHub.id === hubId) {
      setSelectedHub(prev => prev ? { ...prev, status: prev.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : null);
    }
    onAuditLog?.('TOGGLE_HUB', hubId, `Toggled status for hub ${hubId}`);
  };

  const assignedPartners = selectedHub
    ? partners.filter(p => p.assignedHubId === selectedHub.id || p.assignedHubName === selectedHub.name)
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-[#0B1220] rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-wide mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>8&ndash;10 KM Geofenced Hub Architecture</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Hub &amp; Geofence Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage micro-markets, 8&ndash;10 KM geofenced boundaries, assigned partners, and Urban Company-style My Hub FAQs.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Hub</span>
        </button>
      </div>

      {/* Main Grid: Left Hub List, Right Geofence & Partner Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hub List Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">City Hub Directory</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                {hubs.length} Hubs
              </span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hub name, city, or pincode..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {filteredHubs.map((hub) => {
              const isSelected = selectedHub?.id === hub.id;
              const count = partners.filter(p => p.assignedHubId === hub.id || p.assignedHubName === hub.name).length;

              return (
                <div
                  key={hub.id}
                  onClick={() => setSelectedHub(hub)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{hub.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] font-bold">
                          {hub.code || hub.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{hub.city}</span>
                        <span>&bull;</span>
                        <span>{hub.serviceRadiusKm ? `${hub.serviceRadiusKm} KM Radius` : '8 KM Radius'}</span>
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        hub.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {hub.status || 'ACTIVE'}
                    </span>
                  </div>

                  {hub.pincodes && hub.pincodes.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {hub.pincodes.slice(0, 4).map((pin, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                          {pin}
                        </span>
                      ))}
                      {hub.pincodes.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                          +{hub.pincodes.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>{count} Partners Assigned</span>
                    </span>
                    <span className="font-bold text-blue-600 hover:underline">Configure &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Hub Details & Geofence Map Simulation Column */}
        <div className="lg:col-span-7 space-y-6">
          {selectedHub ? (
            <>
              {/* Hub Detail Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900">{selectedHub.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                        {selectedHub.code || selectedHub.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>City: <strong>{selectedHub.city}</strong></span>
                      <span>&bull;</span>
                      <span>Center Lat/Lng: <strong>{selectedHub.lat?.toFixed(4)}, {selectedHub.lng?.toFixed(4)}</strong></span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(selectedHub.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedHub.status === 'ACTIVE'
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {selectedHub.status === 'ACTIVE' ? 'Deactivate Hub' : 'Activate Hub'}
                  </button>
                </div>

                {/* Geofence Map Visual Simulation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <span>Geofenced Service Boundary (UC My Hub Preview)</span>
                    </span>
                    <span className="text-blue-600 font-mono">
                      Radius: {selectedHub.serviceRadiusKm ? `${selectedHub.serviceRadiusKm} KM` : '8 KM'}
                    </span>
                  </div>

                  <div className="relative w-full h-56 rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                    <div className="relative w-44 h-44 rounded-full border-2 border-dashed border-blue-400/80 bg-blue-500/20 backdrop-blur-xs flex items-center justify-center animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg" title="Hub Center Location" />

                      <div className="absolute top-8 left-10 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 shadow-sm" title="Active Partner 1" />
                      <div className="absolute bottom-10 right-12 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 shadow-sm" title="Active Partner 2" />
                      <div className="absolute top-12 right-10 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900 shadow-sm" title="Busy Partner" />

                      <span className="absolute bottom-2 text-[10px] font-mono font-bold text-blue-200 bg-slate-950/80 px-2 py-0.5 rounded-full border border-blue-500/30">
                        8&ndash;10 KM Geofence
                      </span>
                    </div>

                    <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 font-mono">
                      Center: {selectedHub.lat || 28.3545}, {selectedHub.lng || 76.9432}
                    </div>
                  </div>
                </div>

                {/* Assigned Pincodes */}
                <div className="space-y-1.5">
                  <span className="text-xs font-extrabold text-slate-900 block">Assigned Serviceable Pincodes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHub.pincodes && selectedHub.pincodes.length > 0 ? (
                      selectedHub.pincodes.map((pin, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold border border-slate-200">
                          {pin}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No specific pincodes attached. Defaulting to 8 KM radius.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Urban Company Style Partner App "My Hub FAQs" Editor */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-blue-600" />
                      <span>Partner App "My Hub" Help &amp; FAQs</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Editable expandable help questions visible to partners assigned to this hub.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      question: 'What is a Hub?',
                      answer: 'A hub is a specific operational zone designed to minimize travel time.'
                    },
                    {
                      question: 'Getting rebooking leads outside hub',
                      answer: 'If you receive a booking outside your hub, please contact support before accepting.'
                    }
                  ].map((faq, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left text-xs font-bold text-slate-900 flex items-center justify-between cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        {expandedFaq === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedFaq === idx && (
                        <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-200">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Partners List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Assigned Active Partners ({assignedPartners.length})</span>
                  </h4>
                </div>

                {assignedPartners.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No partners currently assigned to this hub. Assign partners from Partner Onboarding Suite.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {assignedPartners.map((partner) => (
                      <div key={partner.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{partner.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{partner.phone}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          {partner.onboardingStatus || 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a hub from the list to view geofencing details and FAQs.
            </div>
          )}
        </div>
      </div>

      {/* Add New Hub Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Add New Service Hub</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateHub} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hub Name</label>
                <input
                  type="text"
                  required
                  value={newHubName}
                  onChange={e => setNewHubName(e.target.value)}
                  placeholder="e.g. Gtown Manesar B"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hub Code</label>
                  <input
                    type="text"
                    value={newHubCode}
                    onChange={e => setNewHubCode(e.target.value)}
                    placeholder="e.g. HUB-GGN-06"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <select
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500"
                  >
                    <option value="Gurugram">Gurugram</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Noida">Noida</option>
                    <option value="Darbhanga">Darbhanga</option>
                    <option value="Muzaffarpur">Muzaffarpur</option>
                    <option value="Ranchi">Ranchi</option>
                    <option value="Patna">Patna</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={newLat}
                    onChange={e => setNewLat(e.target.value)}
                    placeholder="28.3545"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={newLng}
                    onChange={e => setNewLng(e.target.value)}
                    placeholder="76.9432"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Radius (Meters)</label>
                <input
                  type="number"
                  value={newRadius}
                  onChange={e => setNewRadius(e.target.value)}
                  placeholder="8000"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Pincodes (Comma separated)</label>
                <input
                  type="text"
                  value={newPincodes}
                  onChange={e => setNewPincodes(e.target.value)}
                  placeholder="122001, 122002, 122006"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  Create Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HubManagement;
