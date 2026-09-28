import React, { useState, useEffect } from 'react';

export interface HubMultiplier {
  hubName: string;
  city: string;
  multiplier: number;
}

export interface PricingSettings {
  baseCommissionPercent: number;
  gstPercent: number;
  surgeMultiplier: number;
  isSurgeActive: boolean;
  hubMultipliers: HubMultiplier[];
}

const DEFAULT_SETTINGS: PricingSettings = {
  baseCommissionPercent: 15,
  gstPercent: 5,
  surgeMultiplier: 1.25,
  isSurgeActive: false,
  hubMultipliers: [
    { hubName: 'Sector 14 & 15', city: 'Gurugram', multiplier: 1.0 },
    { hubName: 'DLF Phase 1-5 & Cyber City', city: 'Gurugram', multiplier: 1.15 },
    { hubName: 'Boring Road & Patliputra', city: 'Patna', multiplier: 0.95 },
    { hubName: 'Lalpur & Kokar', city: 'Ranchi', multiplier: 0.90 },
  ],
};

export const AdminPricingEngine: React.FC = () => {
  const [settings, setSettings] = useState<PricingSettings>(() => {
    const saved = localStorage.getItem('bharatpro_pricing_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [savedSuccessMsg, setSavedSuccessMsg] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('bharatpro_pricing_settings', JSON.stringify(settings));
  }, [settings]);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bharatpro_pricing_settings', JSON.stringify(settings));
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  const handleHubMultiplierChange = (hubName: string, val: number) => {
    const updated = settings.hubMultipliers.map((h) => (h.hubName === hubName ? { ...h, multiplier: val } : h));
    setSettings({ ...settings, hubMultipliers: updated });
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Pricing Engine & Surge Controls</h1>
          <p className="text-slate-400 text-sm">Master Commission Rates, Manual Surge Multipliers, and Regional City Margins</p>
        </div>
        {savedSuccessMsg && (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-xs font-bold animate-pulse">
            ✓ Changes Saved & Synchronized Live!
          </span>
        )}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Global Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Base Commission */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
            <label className="block text-sm font-bold text-amber-400">Platform Commission (%)</label>
            <p className="text-xs text-slate-400">Default percentage cut retained per booking</p>
            <input
              type="number"
              step="0.5"
              value={settings.baseCommissionPercent}
              onChange={(e) => setSettings({ ...settings, baseCommissionPercent: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-lg font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* GST Tax Slab */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
            <label className="block text-sm font-bold text-white">Global GST Tax (%)</label>
            <p className="text-xs text-slate-400">Tax rate applied to customer billing invoices</p>
            <input
              type="number"
              step="0.1"
              value={settings.gstPercent}
              onChange={(e) => setSettings({ ...settings, gstPercent: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-lg font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Surge Control Toggle */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-amber-400">Manual Surge Override</label>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, isSurgeActive: !settings.isSurgeActive })}
                className={`text-xs px-3 py-1 rounded-full font-bold transition ${
                  settings.isSurgeActive
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {settings.isSurgeActive ? 'SURGE ON' : 'OFF'}
              </button>
            </div>
            <p className="text-xs text-slate-400">Multiply base catalogue prices during peak demand</p>
            <input
              type="number"
              step="0.05"
              min="1.0"
              max="3.0"
              disabled={!settings.isSurgeActive}
              value={settings.surgeMultiplier}
              onChange={(e) => setSettings({ ...settings, surgeMultiplier: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-lg font-bold text-white focus:outline-none focus:border-amber-500 disabled:opacity-40"
            />
          </div>
        </div>

        {/* Hub Multiplier Matrix */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Regional Hub Price Multipliers</h3>
          <p className="text-xs text-slate-400">Adjust baseline catalog rates higher or lower per operating hub</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {settings.hubMultipliers.map((hub) => (
              <div key={hub.hubName} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm">{hub.hubName}</h4>
                  <p className="text-xs text-slate-400">{hub.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Multiplier:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={hub.multiplier}
                    onChange={(e) => handleHubMultiplierChange(hub.hubName, Number(e.target.value))}
                    className="w-20 bg-slate-800 border border-slate-700 text-center font-bold text-amber-400 rounded p-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-3 rounded-xl text-sm shadow-xl transition"
          >
            Save & Publish Pricing Rules
          </button>
        </div>
      </form>
    </div>
  );
};