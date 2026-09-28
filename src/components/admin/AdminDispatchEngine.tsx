import React, { useState, useEffect } from 'react';

export interface DispatchCandidate {
  partnerId: string;
  fullName: string;
  mobileNumber: string;
  distanceKm: number;
  rating: number;
  acceptanceRatePercent: number;
  hasEquipmentKit: boolean;
  score: number;
}

export interface DispatchRuleSettings {
  maxJobRadiusKm: number;
  unassignedAlertSlaMins: number;
  maxConcurrentJobsPerPartner: number;
}

const DEFAULT_CANDIDATES: DispatchCandidate[] = [
  { partnerId: 'prt-101', fullName: 'Ramesh Kumar', mobileNumber: '9876543210', distanceKm: 1.8, rating: 4.85, acceptanceRatePercent: 96, hasEquipmentKit: true, score: 92.4 },
  { partnerId: 'prt-103', fullName: 'Vikas Singh', mobileNumber: '9812345678', distanceKm: 3.2, rating: 4.70, acceptanceRatePercent: 90, hasEquipmentKit: true, score: 84.1 },
  { partnerId: 'prt-104', fullName: 'Sunil Verma', mobileNumber: '9934567812', distanceKm: 4.5, rating: 4.90, acceptanceRatePercent: 98, hasEquipmentKit: true, score: 79.8 },
];

export const AdminDispatchEngine: React.FC = () => {
  const [candidates, setCandidates] = useState<DispatchCandidate[]>(DEFAULT_CANDIDATES);
  const [rules, setRules] = useState<DispatchRuleSettings>(() => {
    const saved = localStorage.getItem('bharatpro_dispatch_rules');
    return saved ? JSON.parse(saved) : { maxJobRadiusKm: 10, unassignedAlertSlaMins: 15, maxConcurrentJobsPerPartner: 1 };
  });

  const [selectedHub, setSelectedHub] = useState<string>('Sector 14 & 15 (Gurugram)');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('bharatpro_dispatch_rules', JSON.stringify(rules));
  }, [rules]);

  const handleTriggerDispatch = (partnerName: string) => {
    setDispatchSuccessMsg(`Job Offer broadcasted to ${partnerName}'s mobile app! Status updated.`);
    setTimeout(() => setDispatchSuccessMsg(null), 4000);
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Rule-Based Dispatch Engine</h1>
          <p className="text-slate-400 text-sm">Proximity Score Calculation, Candidate Sorting & Manual Dispatch Triggers</p>
        </div>
        {dispatchSuccessMsg && (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-xs font-bold animate-pulse">
            ✓ {dispatchSuccessMsg}
          </span>
        )}
      </div>

      {/* Rule Settings Form */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Dispatch Rules & Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1">Max Dispatch Radius (KM)</label>
            <input
              type="number"
              value={rules.maxJobRadiusKm}
              onChange={(e) => setRules({ ...rules, maxJobRadiusKm: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Unassigned Alert Threshold (Minutes)</label>
            <input
              type="number"
              value={rules.unassignedAlertSlaMins}
              onChange={(e) => setRules({ ...rules, unassignedAlertSlaMins: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Max Concurrent Jobs / Partner</label>
            <input
              type="number"
              value={rules.maxConcurrentJobsPerPartner}
              onChange={(e) => setRules({ ...rules, maxConcurrentJobsPerPartner: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Candidate Ranking List */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
            Nearby Candidate Pros ({selectedHub})
          </h3>
          <span className="text-xs text-slate-400">Sorted by Proximity Vector Score</span>
        </div>

        <div className="space-y-3">
          {candidates.map((candidate, idx) => (
            <div key={candidate.partnerId} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                  #{idx + 1}
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm">{candidate.fullName}</h4>
                  <p className="text-xs text-slate-400">📱 +91 {candidate.mobileNumber} | 📍 {candidate.distanceKm} KM away</p>
                  <p className="text-[11px] text-slate-500">Rating: ★ {candidate.rating} | Acceptance: {candidate.acceptanceRatePercent}%</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Dispatch Score</span>
                  <span className="text-lg font-bold text-emerald-400">{candidate.score.toFixed(1)}</span>
                </div>
                <button
                  onClick={() => handleTriggerDispatch(candidate.fullName)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs shadow transition"
                >
                  Confirm Dispatch
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};