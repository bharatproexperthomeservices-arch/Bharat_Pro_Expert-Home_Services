import React, { useState } from 'react';
import { Partner, HubLocation, Booking } from '../../types';
import { 
  purgeDemoPartners, 
  maskAadhaar, 
  maskBankAccount 
} from '../../services/partnerAuthService';
import { PartnerAddModal } from './partner/PartnerAddModal';
import { PartnerKycReviewTab } from './partner/PartnerKycReviewTab';
import { PartnerBankTab } from './partner/PartnerBankTab';
import { PartnerDocSettingsModal } from './partner/PartnerDocSettingsModal';
import { Partner360Modal } from './partner/Partner360Modal';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  Mail, 
  Camera, 
  DollarSign, 
  Wrench, 
  X, 
  Clock, 
  CreditCard, 
  Download, 
  Trash2, 
  Sliders, 
  Eye, 
  Star, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface AdminPartnerSuiteProps {
  partners: Partner[];
  hubs: HubLocation[];
  bookings: Booking[];
  onUpdatePartners: (updated: Partner[]) => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const AdminPartnerSuite: React.FC<AdminPartnerSuiteProps> = ({
  partners,
  hubs,
  bookings,
  onUpdatePartners,
  onAuditLog
}) => {
  const [activeTab, setActiveTab] = useState<'ALL_PARTNERS' | 'KYC_REVIEW' | 'BANK_VERIFICATION' | 'SKILLS_EQUIPMENT'>('ALL_PARTNERS');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [kycFilter, setKycFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false);
  const [selected360Partner, setSelected360Partner] = useState<Partner | null>(null);

  // Status Metrics
  const totalCount = partners.length;
  const activeCount = partners.filter(p => p.status === 'ACTIVE' || p.status === 'active').length;
  const pendingCount = partners.filter(p => p.status === 'PENDING_VERIFICATION' || p.onboardingStatus === 'pending_approval' || p.status === 'DRAFT').length;
  const kycVerifiedCount = partners.filter(p => p.kycVerified || p.kycStatus === 'KYC_VERIFIED').length;
  const bankPendingCount = partners.filter(p => p.bankDetails?.verificationStatus === 'PENDING').length;

  // Purge Demo Partners Action (Section 2)
  const handlePurgeDemo = async () => {
    if (!window.confirm('Delete all AI, seed, and mock partner records from the active production list? Real admin-created partners will be preserved.')) return;
    const res = await purgeDemoPartners();
    const remaining = partners.filter(p => !res.purgedIds.includes(p.id));
    onUpdatePartners(remaining);
    alert(`Success: Removed ${res.count} demo/mock records. Real partner count: ${remaining.length}`);
  };

  // Filtered Partners
  const cleanSearch = searchQuery.trim().toLowerCase();
  const filteredPartners = partners.filter(p => {
    const matchesHub = selectedHub === 'ALL' || p.assignedHubId === selectedHub;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesKyc = kycFilter === 'ALL' || p.kycStatus === kycFilter;
    const matchesSearch = !cleanSearch ||
      p.name.toLowerCase().includes(cleanSearch) ||
      p.phone.includes(cleanSearch) ||
      (p.email || '').toLowerCase().includes(cleanSearch) ||
      (p.loginUserId || '').toLowerCase().includes(cleanSearch);
    return matchesHub && matchesStatus && matchesKyc && matchesSearch;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'LoginUserId', 'Name', 'Phone', 'City', 'Hub', 'Status', 'KYCStatus', 'BankStatus', 'Onboarding%'];
    const rows = filteredPartners.map(p => [
      p.id,
      p.loginUserId || '',
      `"${p.name.replace(/"/g, '""')}"`,
      p.phone,
      p.city || '',
      `"${p.assignedHubName || ''}"`,
      p.status,
      p.kycStatus || 'PENDING',
      p.bankDetails?.verificationStatus || 'NOT_SUBMITTED',
      `${p.onboardingProgress || 20}%`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bharat_pro_real_partners_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePartnerUpdated = (updated: Partner | null) => {
    if (!updated) {
      if (selected360Partner) {
        onUpdatePartners(partners.filter(p => p.id !== selected360Partner.id));
        setSelected360Partner(null);
      }
      return;
    }
    const updatedList = partners.map(p => p.id === updated.id ? updated : p);
    onUpdatePartners(updatedList);
    if (selected360Partner?.id === updated.id) {
      setSelected360Partner(updated);
    }
  };

  const handlePartnerCreated = (newPartner: Partner) => {
    onUpdatePartners([newPartner, ...partners]);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      
      {/* Top Banner with Real Count Summary */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Module 08 &amp; 09 &bull; Partner Fleet Management
            </span>
            <span className="text-xs text-[#8E8E93]">Production KYC, Multi-page Docs, Bank &amp; Photo System</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Certified Partner Fleet &amp; Comprehensive KYC
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Real admin-created partner records only. Take photo from camera, upload Aadhaar/PAN/passbook, verify documents with rejection reasons, and manage 360° profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Purge Demo Records Button */}
          <button
            type="button"
            onClick={handlePurgeDemo}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Clean all AI/seed dummy partner records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Demo Records</span>
          </button>

          {/* Document Settings */}
          <button
            type="button"
            onClick={() => setIsDocSettingsOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Doc Settings</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {/* Add Partner Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4A24E]" />
            <span>+ Add Partner</span>
          </button>
        </div>
      </div>

      {/* Real Statistics Widget Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs">
          <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Total Fleet</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{totalCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs">
          <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Active &amp; Approved</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{activeCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs">
          <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Awaiting Verification</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{pendingCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs">
          <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">KYC Verified</span>
          <span className="text-xl font-black text-blue-600 mt-1 block">{kycVerifiedCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs">
          <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Bank Pending</span>
          <span className="text-xl font-black text-purple-600 mt-1 block">{bankPendingCount}</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5EA] pb-3">
        {[
          { id: 'ALL_PARTNERS', label: `All Partners (${totalCount})`, icon: Users },
          { 
            id: 'KYC_REVIEW', 
            label: `KYC & Document Review`, 
            icon: ShieldCheck,
            badge: pendingCount > 0 ? `${pendingCount} review` : undefined
          },
          { 
            id: 'BANK_VERIFICATION', 
            label: `Bank Account Verification`, 
            icon: CreditCard,
            badge: bankPendingCount > 0 ? `${bankPendingCount} pending` : undefined
          },
          { id: 'SKILLS_EQUIPMENT', label: 'Mandatory Chemical & Tool Matrix', icon: Wrench }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white hover:bg-[#F2F2F7] text-[#48484A] border border-[#E5E5EA]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ALL PARTNERS TABLE & FLEET DIRECTORY */}
      {activeTab === 'ALL_PARTNERS' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Mobile (10 digits), Partner ID, or Legal Name..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-medium outline-none"
                >
                  <option value="ALL">All Hubs</option>
                  {hubs.map(h => (
                    <option key={h.id} value={h.id}>{h.city} - {h.name}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-medium outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active / Approved</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>

                <select
                  value={kycFilter}
                  onChange={(e) => setKycFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 font-medium outline-none"
                >
                  <option value="ALL">All KYC</option>
                  <option value="KYC_VERIFIED">KYC Verified</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="KYC_NEEDS_REUPLOAD">Needs Re-upload</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Partners Table / Cards */}
          {filteredPartners.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5EA] space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-[#1C1C1E]">No Partner Records Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No real partners registered yet. Click &ldquo;+ Add Partner&rdquo; above to onboard your first verified cleaning technician.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Onboard Real Partner Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPartners.map((partner) => {
                const isApproved = partner.status === 'ACTIVE' || partner.status === 'APPROVED' || partner.status === 'active';
                const isKycDone = partner.kycVerified || partner.kycStatus === 'KYC_VERIFIED';

                return (
                  <div
                    key={partner.id}
                    className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {partner.avatarUrl ? (
                            <img src={partner.avatarUrl} alt={partner.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-[10px]">No Photo</div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-[#1C1C1E]">{partner.name}</h4>
                            <span className={`px-2 py-0.2 rounded text-[9px] font-mono font-bold ${
                              isKycDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {partner.kycStatus || 'PENDING'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-blue-600" />
                            <span>{partner.phone}</span>
                            <span>&bull;</span>
                            <span>ID: {partner.loginUserId || partner.id}</span>
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {partner.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Masked Sensitive Details */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Aadhaar (Masked)</span>
                        <strong className="text-slate-800">{maskAadhaar(partner.aadhaarNumber)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Bank A/C (Masked)</span>
                        <strong className="text-slate-800">{partner.bankDetails?.accountNumberMasked || 'NOT_SUBMITTED'}</strong>
                      </div>
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Operational Hub</span>
                        <strong className="text-slate-800 block truncate">{partner.assignedHubName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Lifetime Earnings</span>
                        <strong className="text-emerald-700 block">₹{(partner.totalEarnings || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Onboarding</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${partner.onboardingProgress || 20}%` }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-700">{partner.onboardingProgress || 20}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setSelected360Partner(partner)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4A24E]" />
                        <span>360° Profile &amp; KYC</span>
                      </button>

                      <div className="text-[11px] text-slate-500 font-mono">
                        {partner.documents?.length || 0} Docs &bull; {partner.approvedCategories?.length || 0} Categories
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: DEDICATED KYC & DOCUMENT REVIEW */}
      {activeTab === 'KYC_REVIEW' && (
        <PartnerKycReviewTab
          partners={partners}
          onPartnerUpdated={handlePartnerUpdated}
          onAuditLog={onAuditLog}
        />
      )}

      {/* TAB 3: BANK ACCOUNT VERIFICATION */}
      {activeTab === 'BANK_VERIFICATION' && (
        <PartnerBankTab
          partners={partners}
          onPartnerUpdated={handlePartnerUpdated}
          onAuditLog={onAuditLog}
        />
      )}

      {/* TAB 4: SKILLS & EQUIPMENT MATRIX */}
      {activeTab === 'SKILLS_EQUIPMENT' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-6">
          <div>
            <h4 className="text-base font-black text-[#1C1C1E]">
              Mandatory Cleaning Toolkits &amp; Service Eligibility Matrix
            </h4>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Partners cannot accept dispatches for services where mandatory industrial tools are unverified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h5 className="font-bold text-xs text-[#1C1C1E]">Hospital-Grade Diversey Chemicals</h5>
              </div>
              <p className="text-slate-600 leading-relaxed">
                R1 (Bathroom), R2 (Hard Surfaces), R3 (Glass/Mirror), R4 (Furniture Polish), R5 (Air Freshener), R6 (Heavy Toilet Bowl Cleaner).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h5 className="font-bold text-xs text-[#1C1C1E]">German Extraction &amp; Scrubbing Machinery</h5>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Kärcher wet &amp; dry industrial vacuum, high-pressure single disc scrubbing machine, microfiber color-coded wipes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADD PARTNER MODAL */}
      <PartnerAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        hubs={hubs}
        partners={partners}
        onPartnerCreated={handlePartnerCreated}
        onAuditLog={onAuditLog}
      />

      {/* 360° PARTNER PROFILE MODAL */}
      <Partner360Modal
        partner={selected360Partner}
        onClose={() => setSelected360Partner(null)}
        hubs={hubs}
        onPartnerUpdated={handlePartnerUpdated}
        onAuditLog={onAuditLog}
      />

      {/* DOCUMENT SETTINGS CONFIG MODAL */}
      <PartnerDocSettingsModal
        isOpen={isDocSettingsOpen}
        onClose={() => setIsDocSettingsOpen(false)}
      />

    </div>
  );
};

export default AdminPartnerSuite;
