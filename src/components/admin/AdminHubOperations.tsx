import React, { useState, useEffect } from 'react';

export interface HubLocation {
  id: string;
  state: 'Haryana' | 'Bihar' | 'Jharkhand';
  city: 'Gurugram' | 'Patna' | 'Ranchi';
  name: string;
  coverageRadiusKm: number;
  activePartnersCount: number;
  jobsDelivered30Days: number;
  repeatCustomerPercent: number;
  isActive: boolean;
}

const DEFAULT_HUBS: HubLocation[] = [
  // Haryana -> Gurugram
  { id: 'hub-ggn-1', state: 'Haryana', city: 'Gurugram', name: 'Sector 14 & 15', coverageRadiusKm: 5, activePartnersCount: 12, jobsDelivered30Days: 140, repeatCustomerPercent: 42, isActive: true },
  { id: 'hub-ggn-2', state: 'Haryana', city: 'Gurugram', name: 'DLF Phase 1-5 & Cyber City', coverageRadiusKm: 8, activePartnersCount: 28, jobsDelivered30Days: 320, repeatCustomerPercent: 58, isActive: true },
  { id: 'hub-ggn-3', state: 'Haryana', city: 'Gurugram', name: 'Golf Course Road & Extension', coverageRadiusKm: 7, activePartnersCount: 22, jobsDelivered30Days: 210, repeatCustomerPercent: 50, isActive: true },

  // Bihar -> Patna
  { id: 'hub-pat-1', state: 'Bihar', city: 'Patna', name: 'Boring Road & Patliputra', coverageRadiusKm: 6, activePartnersCount: 15, jobsDelivered30Days: 180, repeatCustomerPercent: 38, isActive: true },
  { id: 'hub-pat-2', state: 'Bihar', city: 'Patna', name: 'Kankarbagh & Rajendra Nagar', coverageRadiusKm: 6, activePartnersCount: 18, jobsDelivered30Days: 195, repeatCustomerPercent: 41, isActive: true },
  { id: 'hub-pat-3', state: 'Bihar', city: 'Patna', name: 'Danapur & Bailey Road', coverageRadiusKm: 8, activePartnersCount: 10, jobsDelivered30Days: 110, repeatCustomerPercent: 32, isActive: true },

  // Jharkhand -> Ranchi
  { id: 'hub-rnc-1', state: 'Jharkhand', city: 'Ranchi', name: 'Lalpur & Kokar', coverageRadiusKm: 5, activePartnersCount: 14, jobsDelivered30Days: 150, repeatCustomerPercent: 36, isActive: true },
  { id: 'hub-rnc-2', state: 'Jharkhand', city: 'Ranchi', name: 'Harmu & Doranda', coverageRadiusKm: 6, activePartnersCount: 11, jobsDelivered30Days: 125, repeatCustomerPercent: 35, isActive: true },
];

export const AdminHubOperations: React.FC = () => {
  const [hubs, setHubs] = useState<HubLocation[]>(() => {
    const saved = localStorage.getItem('bharatpro_hubs');
    return saved ? JSON.parse(saved) : DEFAULT_HUBS;
  });

  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHub, setEditingHub] = useState<HubLocation | null>(null);

  const [formData, setFormData] = useState<Omit<HubLocation, 'id'>>({
    state: 'Haryana',
    city: 'Gurugram',
    name: '',
    coverageRadiusKm: 5,
    activePartnersCount: 0,
    jobsDelivered30Days: 0,
    repeatCustomerPercent: 0,
    isActive: true,
  });

  useEffect(() => {
    localStorage.setItem('bharatpro_hubs', JSON.stringify(hubs));
  }, [hubs]);

  const filteredHubs = hubs.filter(
    (h) => selectedState === 'ALL' || h.state === selectedState
  );

  const handleOpenModal = (hub?: HubLocation) => {
    if (hub) {
      setEditingHub(hub);
      setFormData({
        state: hub.state,
        city: hub.city,
        name: hub.name,
        coverageRadiusKm: hub.coverageRadiusKm,
        activePartnersCount: hub.activePartnersCount,
        jobsDelivered30Days: hub.jobsDelivered30Days,
        repeatCustomerPercent: hub.repeatCustomerPercent,
        isActive: hub.isActive,
      });
    } else {
      setEditingHub(null);
      setFormData({
        state: 'Haryana',
        city: 'Gurugram',
        name: '',
        coverageRadiusKm: 5,
        activePartnersCount: 0,
        jobsDelivered30Days: 0,
        repeatCustomerPercent: 0,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHub) {
      const updated = hubs.map((h) => (h.id === editingHub.id ? { ...formData, id: editingHub.id } : h));
      setHubs(updated);
    } else {
      const newHub: HubLocation = {
        ...formData,
        id: `hub-${Date.now()}`,
      };
      setHubs([...hubs, newHub]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Kya aap is Hub ko permanently delete karna chahte hain?')) {
      setHubs(hubs.filter((h) => h.id !== id));
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Hub Operations & Regional Management</h1>
          <p className="text-slate-400 text-sm">Haryana (Gurugram), Bihar (Patna), Jharkhand (Ranchi)</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-5 py-2.5 rounded-lg shadow transition"
        >
          + Add New Hub
        </button>
      </div>

      {/* State Filter */}
      <div className="flex gap-2 mb-6">
        {['ALL', 'Haryana', 'Bihar', 'Jharkhand'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedState(st)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              selectedState === st
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHubs.map((hub) => (
          <div key={hub.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{hub.state} → {hub.city}</span>
                  <h3 className="text-lg font-bold text-white leading-snug">{hub.name}</h3>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${hub.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400'}`}>
                  {hub.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div className="space-y-2 mt-4 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                <div className="flex justify-between">
                  <span className="text-slate-400">Coverage Radius:</span>
                  <span className="font-semibold text-amber-400">{hub.coverageRadiusKm} KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Partners:</span>
                  <span className="font-semibold text-white">{hub.activePartnersCount} Pros</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jobs Delivered (30 Days):</span>
                  <span className="font-semibold text-white">{hub.jobsDelivered30Days}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Repeat Customer Rate:</span>
                  <span className="font-semibold text-emerald-400">{hub.repeatCustomerPercent}%</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 mt-4 border-t border-slate-700">
              <button
                onClick={() => handleOpenModal(hub)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded-lg font-medium transition"
              >
                Edit Parameters
              </button>
              <button
                onClick={() => handleDelete(hub.id)}
                className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs px-3 py-2 rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Hub Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-amber-400">{editingHub ? 'Edit Hub Settings' : 'Add New Operational Hub'}</h2>
            
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => {
                    const st = e.target.value as any;
                    const defaultCity = st === 'Haryana' ? 'Gurugram' : st === 'Bihar' ? 'Patna' : 'Ranchi';
                    setFormData({ ...formData, state: st, city: defaultCity });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                >
                  <option value="Haryana">Haryana</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Jharkhand">Jharkhand</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  readOnly
                  value={formData.city}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Hub Name / Sector / Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 56 or Kankarbagh"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Coverage Radius (KM)</label>
                <input
                  type="number"
                  value={formData.coverageRadiusKm}
                  onChange={(e) => setFormData({ ...formData, coverageRadiusKm: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded text-xs"
                >
                  Save Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};