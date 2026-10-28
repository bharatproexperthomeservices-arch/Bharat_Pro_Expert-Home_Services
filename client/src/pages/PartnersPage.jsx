import React, { useEffect, useState } from 'react';
import { Search, ShieldAlert, Award, Wrench, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';

export function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const { showToast } = useStore();

  const fetchPartners = () => {
    setLoading(true);
    fetch('/api/partners')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setPartners(res.data);
          if (res.data.length > 0 && !selectedPartner) {
            setSelectedPartner(res.data[0]);
          } else if (selectedPartner) {
            const updated = res.data.find((p) => p.id === selectedPartner.id);
            if (updated) setSelectedPartner(updated);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleToggleTraining = (partner) => {
    const nextStatus = !partner.trainingCompleted;
    fetch(`/api/partners/${partner.id}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainingCompleted: nextStatus,
        actor: 'ADMIN_OPERATIONS'
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          showToast(`Training status for ${partner.name} updated to ${nextStatus ? 'COMPLETE' : 'INCOMPLETE'}`, 'success');
          fetchPartners();
        } else {
          showToast(res.error || 'Failed to update training', 'error');
        }
      });
  };

  const filteredPartners = partners.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search);
    const matchesTier = tierFilter === 'ALL' || p.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Roster & Profiles</h1>
          <p className="text-sm text-gray-500">Manage service professional profiles, dynamic tiering, and performance scores</p>
        </div>
        <button
          onClick={fetchPartners}
          className="inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>Refresh List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Partner Roster List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[750px]">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by partner name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {['ALL', 'GOLD', 'SILVER', 'BRONZE', 'AT_RISK'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    tierFilter === t ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Loading partners...</div>
            ) : filteredPartners.length === 0 ? (
              <div className="p-6 text-center text-gray-400">No partners matched filter</div>
            ) : (
              filteredPartners.map((p) => {
                const isSelected = selectedPartner?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPartner(p)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 flex items-center justify-between ${
                      isSelected ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900 text-sm">{p.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            p.tier === 'GOLD'
                              ? 'bg-amber-100 text-amber-800'
                              : p.tier === 'SILVER'
                              ? 'bg-slate-200 text-slate-800'
                              : p.tier === 'BRONZE'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.tier}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{p.cityName} • {p.phone}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <p className="text-xs font-mono font-semibold text-gray-700 mt-1">Score: {p.performanceScore}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Partner Detail View */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-[750px] overflow-y-auto">
          {selectedPartner ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-gray-900">{selectedPartner.name}</h2>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        selectedPartner.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedPartner.isActive ? '● ACTIVE' : '○ INACTIVE'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{selectedPartner.email} • {selectedPartner.phone}</p>
                  <p className="text-xs text-gray-400 mt-0.5">City: {selectedPartner.cityName} (ID: {selectedPartner.id})</p>
                </div>

                <div className="text-right bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Tier Commission</p>
                  <p className="text-lg font-black text-emerald-700">{(selectedPartner.commissionRate * 100).toFixed(0)}%</p>
                </div>
              </div>

              {/* Activation Gate Criteria */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-slate-600" />
                  <span>Hard-Coded Activation Gate Requirements</span>
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-xs text-gray-500 font-medium">1. KYC Status</p>
                    <span className="inline-block mt-1 text-xs font-bold text-slate-800">
                      {selectedPartner.kycStatus}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-xs text-gray-500 font-medium">2. Training Status</p>
                    <span className="inline-block mt-1 text-xs font-bold text-slate-800">
                      {selectedPartner.trainingCompleted ? 'COMPLETE' : 'INCOMPLETE'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-xs text-gray-500 font-medium">3. Background Check</p>
                    <span className="inline-block mt-1 text-xs font-bold text-slate-800">
                      {selectedPartner.backgroundCheckStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skill Tags & Category Capability */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  <span>Assigned Skill Tags & Capability</span>
                </h3>

                <div className="flex flex-wrap gap-2">
                  {(selectedPartner.skills || []).map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                      ✓ {skill}
                    </span>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleToggleTraining(selectedPartner)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                  >
                    <span>Toggle Training Flag ({selectedPartner.trainingCompleted ? 'Mark Incomplete' : 'Mark Complete'})</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Performance Breakdown */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Dynamic Performance Score Formula</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-gray-500">Average Rating</p>
                    <p className="text-base font-bold text-gray-900">{selectedPartner.avgRating} / 5.0</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-gray-500">Rework Rate</p>
                    <p className="text-base font-bold text-gray-900">{(selectedPartner.reworkRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-gray-500">Cancellation Rate</p>
                    <p className="text-base font-bold text-gray-900">{(selectedPartner.cancellationRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-gray-500">Computed Score</p>
                    <p className="text-base font-extrabold text-emerald-700">{selectedPartner.performanceScore}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">Select a partner to view complete operational profile</div>
          )}
        </div>
      </div>
    </div>
  );
}
