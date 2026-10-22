import React, { useState } from 'react';
import { Partner, HubLocation } from '../../types';
import { Users, FileText, CheckCircle, Clock, AlertTriangle, Shield, UserCheck, Phone, Mail, MapPin, XCircle, ChevronRight, Filter } from 'lucide-react';

interface PartnerOnboardingProps {
  partners: Partner[];
  hubs: HubLocation[];
  onVerifyPartner: (id: string) => void;
  onRejectPartner: (id: string) => void;
  onDeletePartner: (id: string) => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const STAGES = [
  { stage: 0, title: 'Application Received', key: 'application_received' },
  { stage: 1, title: 'Document Verification', key: 'documents_pending' },
  { stage: 2, title: 'Background Verification', key: 'bgv_pending' },
  { stage: 3, title: 'Skill Assessment', key: 'assessment_pending' },
  { stage: 4, title: 'In-Person Interview', key: 'interview_pending' },
  { stage: 5, title: 'Training Assignment', key: 'training_pending' },
  { stage: 6, title: 'Kit Procurement', key: 'kit_pending' },
  { stage: 7, title: 'Hub Assignment', key: 'hub_pending' },
  { stage: 8, title: 'Activation / Live', key: 'active_live' }
];

export const PartnerOnboarding: React.FC<PartnerOnboardingProps> = ({
  partners,
  hubs,
  onVerifyPartner,
  onRejectPartner,
  onDeletePartner,
  onAuditLog
}) => {
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(partners[0] || null);
  const [filterStage, setFilterStage] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPartners = partners.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterStage === 'ALL') return matchesSearch;
    return matchesSearch && (filterStage === 8 ? p.status === 'active' || p.status === 'ACTIVE' : p.status === 'pending');
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 bg-[#0B1220] rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-wide mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Urban Company Standard 9-Stage Filtration Funnel</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Partner Onboarding &amp; Verification</h2>
          <p className="text-xs text-slate-400 mt-1">
            Strict filtration funnel (25&ndash;30% target acceptance rate) with document verification, BGV, skill checks &amp; hub assignment.
          </p>
        </div>
      </div>

      {/* 9-Stage Stepper Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
        <div className="flex items-center min-w-[750px] justify-between text-center">
          {STAGES.map((s) => {
            const count = partners.filter(p => s.stage === 8 ? p.status === 'active' || p.status === 'ACTIVE' : p.status === 'pending').length;
            const isActiveFilter = filterStage === s.stage;

            return (
              <button
                key={s.stage}
                onClick={() => setFilterStage(isActiveFilter ? 'ALL' : s.stage)}
                className={`flex-1 p-2 rounded-xl border transition-all cursor-pointer mx-1 text-left ${
                  isActiveFilter
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase font-mono ${isActiveFilter ? 'text-blue-200' : 'text-slate-500'}`}>
                    S{s.stage}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActiveFilter ? 'bg-white text-blue-900' : 'bg-slate-200 text-slate-800'}`}>
                    {count}
                  </span>
                </div>
                <p className={`text-[11px] font-bold truncate mt-1 ${isActiveFilter ? 'text-white' : 'text-slate-900'}`}>
                  {s.title}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Applicants ({filteredPartners.length})</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search partner..."
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 w-48"
            />
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredPartners.map(partner => {
              const isSelected = selectedPartner?.id === partner.id;
              return (
                <div
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">{partner.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{partner.phone} &bull; {partner.city || 'Gurugram'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                      {partner.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Partner 360 Detail View */}
        <div className="lg:col-span-7 space-y-6">
          {selectedPartner ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900">{selectedPartner.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                      ID: {selectedPartner.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{selectedPartner.phone}</span>
                    <span>&bull;</span>
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{selectedPartner.city || 'Gurugram'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onVerifyPartner(selectedPartner.id)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Approve / Advance Stage
                  </button>
                  <button
                    onClick={() => onRejectPartner(selectedPartner.id)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Document Review Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Submitted KYC Documents</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">Aadhaar Card</span>
                    <span className="font-mono text-slate-800 font-bold">XXXX-XXXX-8921</span>
                    <span className="text-emerald-600 font-bold block text-[10px]">&check; Verified</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">PAN Card</span>
                    <span className="font-mono text-slate-800 font-bold">ABCDE1234F</span>
                    <span className="text-emerald-600 font-bold block text-[10px]">&check; Verified</span>
                  </div>
                </div>
              </div>

              {/* Hub Assignment Dropdown */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 text-xs space-y-2">
                <span className="font-bold text-slate-900 block">Assign Micro-Market Hub:</span>
                <select
                  value={selectedPartner.assignedHubId || ''}
                  onChange={(e) => {
                    const hubId = e.target.value;
                    selectedPartner.assignedHubId = hubId;
                    onAuditLog?.('ASSIGN_HUB', selectedPartner.id, `Assigned to hub ${hubId}`);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 font-bold"
                >
                  <option value="">-- Select Hub --</option>
                  {hubs.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city} &bull; {h.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a partner application to review KYC and stage details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerOnboarding;
