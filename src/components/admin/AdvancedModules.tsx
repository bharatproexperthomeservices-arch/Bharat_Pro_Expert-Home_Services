import React, { useState } from 'react';
import { Package, Zap, Award, ShieldAlert, Heart, GraduationCap, Share2, MessageSquare, Scale, Sliders, BookOpen, TrendingUp, CheckCircle, FileCheck, DollarSign } from 'lucide-react';

export interface AdvancedModuleItem {
  id: number;
  title: string;
  category: string;
  description: string;
  status: 'Active' | 'Configured' | 'Ready';
}

const MODULES_LIST: AdvancedModuleItem[] = [
  { id: 59, title: 'Supply & Inventory Management', category: 'Logistics', description: 'Central tool kits, cleaning consumables stock & partner credits.', status: 'Active' },
  { id: 60, title: 'Dynamic Pricing & Surge Engine', category: 'Pricing', description: 'Peak demand, weather & zone surge rules with hard caps.', status: 'Configured' },
  { id: 61, title: 'Loyalty & Subscription Plans', category: 'Growth', description: 'BharatPro Care recurring membership & wallet points ledger.', status: 'Active' },
  { id: 62, title: 'Warranty, Rework & Guarantee', category: 'Quality', description: '30-day warranty claims, rework dispatch & partner liability.', status: 'Active' },
  { id: 63, title: 'Fraud Detection & Risk Scoring', category: 'Security', description: 'Velocity checks, device fingerprinting & payout auto-holds.', status: 'Configured' },
  { id: 64, title: 'Partner Insurance & Welfare', category: 'Welfare', description: 'Accident insurance, emergency claims & welfare schemes.', status: 'Ready' },
  { id: 65, title: 'Skill Matrix & Certifications', category: 'Training', description: 'L1 to L5 skill levels & brand specializations (e.g. Voltas AC).', status: 'Active' },
  { id: 66, title: 'Partner Referral & Recruitment', category: 'Recruitment', description: 'Referral tracking, 10-job threshold auto-credits & fraud guards.', status: 'Active' },
  { id: 67, title: 'Communication Audit & Moderation', category: 'Compliance', description: 'Masked calling, abuse detection & off-platform payment alerts.', status: 'Configured' },
  { id: 68, title: 'Regulatory & License Tracker', category: 'Legal', description: 'Shop Act, trade license expiry alerts & auto-dispatch blocks.', status: 'Active' },
  { id: 69, title: 'Auto-Suspension Rules Engine', category: 'Governance', description: 'Rating <4.0 soft-suspension, 2 no-shows strike 1 automation.', status: 'Active' },
  { id: 70, title: 'Knowledge Base & Community', category: 'Support', description: 'SOP video guides, technical manuals & moderated partner forum.', status: 'Active' },
  { id: 71, title: 'Predictive Analytics & Forecasting', category: 'Analytics', description: 'Demand gap heatmaps, partner churn prediction & revenue models.', status: 'Configured' },
  { id: 72, title: 'External Verification Agency', category: 'Verification', description: 'AuthBridge & IDfy BGV API integration for background checks.', status: 'Ready' },
  { id: 73, title: 'Hub-Level P&L Dashboard', category: 'Finance', description: 'Hub gross margins, opex allocation & quarterly budget review.', status: 'Active' }
];

export const AdvancedModules: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<AdvancedModuleItem>(MODULES_LIST[0]);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-[#0B1220] rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold uppercase tracking-wide mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Modules 59&ndash;73 &bull; Super Admin Advanced Operational Controls</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Advanced Platform Control Suite</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise-grade modules covering inventory, dynamic surge, rework, fraud detection, skill taxonomy, and hub P&amp;L.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Module List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Operational Modules (59&ndash;73)
          </h3>
          <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
            {MODULES_LIST.map(mod => {
              const isSelected = selectedModule.id === mod.id;
              return (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
                        M{mod.id}
                      </span>
                      <span className="font-extrabold text-xs text-slate-900">{mod.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                      {mod.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Module Workspace */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-xs font-bold">
                  Module {selectedModule.id}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">{selectedModule.title}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedModule.description}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
              {selectedModule.category}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Configuration &amp; Rule Engine State:</span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Status</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Fully Operational
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Scope</span>
                <span className="font-bold text-slate-800 mt-1 block">All City Hubs &amp; Partners</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedModules;
