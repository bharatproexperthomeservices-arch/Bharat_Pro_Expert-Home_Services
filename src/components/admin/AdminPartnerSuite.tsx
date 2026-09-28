import React, { useState } from 'react';
import { Partner, HubLocation, Booking } from '../../types';
import { 
  approvePartnerAndMakeIdLive, 
  rejectPartnerApplication 
} from '../../services/partnerAuthService';
import { OWNER_EMAIL } from '../../services/emailService';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Award, 
  Sliders, 
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
  Check, 
  X, 
  Clock, 
  Ban, 
  Lock,
  ArrowUpRight,
  Sparkles,
  Layers,
  KeyRound,
  Download,
  AlertTriangle,
  FileText,
  CreditCard,
  Building,
  RotateCcw,
  Trash2,
  Edit,
  Eye,
  Star,
  Receipt,
  MessageSquare
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
  const [activeSubTab, setActiveSubTab] = useState<'PENDING_APPROVALS' | 'FLEET' | 'SKILLS_EQUIPMENT' | 'PROOF_OF_WORK'>('FLEET');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 360° Partner Profile View Modal State
  const [selectedProfilePartner, setSelectedProfilePartner] = useState<Partner | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'BASIC' | 'KYC' | 'SERVICES' | 'JOBS' | 'PAYOUTS' | 'TICKETS' | 'AUDIT'>('BASIC');

  // Edit Partner in Profile State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editHubId, setEditHubId] = useState('');
  const [editStatus, setEditStatus] = useState<Partner['status']>('active');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Pending Partners for Owner Approval
  const pendingPartners = partners.filter(p => p.onboardingStatus === 'pending_approval');
  
  // Onboarding Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newHubId, setNewHubId] = useState(hubs[0]?.id || 'hub-patna-central');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['full-home-cleaning', 'bathroom-cleaning']);
  const [equipmentVerified, setEquipmentVerified] = useState(true);

  // Auto-suggest matches for mobile search
  const cleanSearch = searchQuery.trim().toLowerCase();
  const autoSuggestMatches = cleanSearch.length >= 2 ? partners.filter(p => 
    p.phone.includes(cleanSearch) || 
    p.name.toLowerCase().includes(cleanSearch) ||
    (p.loginUserId && p.loginUserId.toLowerCase().includes(cleanSearch))
  ).slice(0, 5) : [];

  const categories = [
    { id: 'full-home-cleaning', label: 'Full Home Deep Cleaning' },
    { id: 'bathroom-cleaning', label: 'Bathroom Deep Cleaning' },
    { id: 'kitchen-cleaning', label: 'Kitchen & Appliance Cleaning' },
    { id: 'sofa-carpet-cleaning', label: 'Sofa, Carpet & Living' },
    { id: 'mattress-cleaning', label: 'Mattress & Bed Cleaning' }
  ];

  // Open 360° Profile Modal
  const handleOpen360Profile = (partner: Partner) => {
    setSelectedProfilePartner(partner);
    setEditName(partner.name);
    setEditPhone(partner.phone);
    setEditEmail(partner.email || '');
    setEditHubId(partner.assignedHubId);
    setEditStatus(partner.status);
    setEditCategories(partner.approvedCategories || []);
    setIsEditingProfile(false);
    setProfileActiveTab('BASIC');
  };

  // Save 360° Profile Edits
  const handleSaveProfileEdits = () => {
    if (!selectedProfilePartner) return;
    const cleanPh = editPhone.replace(/\D/g, '').slice(-10);
    if (!editName.trim() || cleanPh.length !== 10) {
      alert('Please provide a valid name and 10-digit Indian mobile number.');
      return;
    }

    // Check duplicate mobile
    const duplicate = partners.find(p => p.id !== selectedProfilePartner.id && p.phone.replace(/\D/g, '').slice(-10) === cleanPh);
    if (duplicate) {
      alert(`⚠️ Duplicate Mobile Alert:\nThis phone number (${cleanPh}) is already registered with Partner ID: ${duplicate.loginUserId || duplicate.id} (${duplicate.name}).`);
      return;
    }

    const hubObj = hubs.find(h => h.id === editHubId);
    const updatedPartner: Partner = {
      ...selectedProfilePartner,
      name: editName.trim(),
      phone: cleanPh,
      email: editEmail.trim(),
      assignedHubId: editHubId,
      assignedHubName: hubObj?.name || selectedProfilePartner.assignedHubName,
      status: editStatus,
      isOnline: editStatus === 'active',
      approvedCategories: editCategories
    };

    const updatedList = partners.map(p => p.id === updatedPartner.id ? updatedPartner : p);
    onUpdatePartners(updatedList);
    setSelectedProfilePartner(updatedPartner);
    setIsEditingProfile(false);
    onAuditLog?.('UPDATE_PARTNER_PROFILE', updatedPartner.id, `Admin updated 360° profile for partner ${updatedPartner.name}`);
    alert(`Partner profile for ${updatedPartner.name} updated successfully!`);
  };

  // Approve Partner
  const handleApprovePartner = async (partnerId: string) => {
    setProcessingId(partnerId);
    try {
      const res = await approvePartnerAndMakeIdLive(partnerId, { approvedBy: OWNER_EMAIL });
      if (res.success && res.partner) {
        const updated = partners.map(p => p.id === partnerId ? res.partner! : p);
        onUpdatePartners(updated);
        onAuditLog?.('APPROVE_PARTNER', partnerId, `Partner ${res.partner.name} approved by Owner (${OWNER_EMAIL})`);
        alert(`✅ Partner ${res.partner.name} APPROVED!\n\nUser ID: ${res.partner.loginUserId}\nPassword: ${res.partner.loginPassword}\nStatus: Live & Active\n\nNotification sent to ${OWNER_EMAIL}. The partner can now log in.`);
      } else {
        alert(res.error || 'Approval failed.');
      }
    } catch {
      alert('Error approving partner.');
    } finally {
      setProcessingId(null);
    }
  };

  // Reject Partner
  const handleRejectPartner = async (partnerId: string) => {
    const reason = window.prompt('Rejection reason for partner application:', 'Incomplete documentation or unverified credentials');
    if (!reason) return;

    setProcessingId(partnerId);
    try {
      const res = await rejectPartnerApplication(partnerId, reason);
      if (res.success) {
        const updated = partners.map(p => p.id === partnerId ? { ...p, status: 'inactive' as const, onboardingStatus: 'rejected' as any } : p);
        onUpdatePartners(updated);
        onAuditLog?.('REJECT_PARTNER', partnerId, `Partner application rejected: ${reason}`);
        alert('Partner application marked as rejected.');
      }
    } catch {
      alert('Error rejecting partner.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtering
  const filteredPartners = partners.filter(p => {
    const matchesHub = selectedHub === 'ALL' || p.assignedHubId === selectedHub;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.assignedHubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.loginUserId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesHub && matchesStatus && matchesSearch;
  });

  // Action: Onboard New Partner with DUPLICATE DETECTION
  const handleOnboardPartner = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPh = newPhone.replace(/\D/g, '').slice(-10);
    if (!newName.trim() || cleanPh.length !== 10) {
      alert('Please fill in Partner Name and a valid 10-digit Indian Mobile Number.');
      return;
    }

    // Duplicate detection alert
    const duplicate = partners.find(p => p.phone.replace(/\D/g, '').slice(-10) === cleanPh);
    if (duplicate) {
      if (window.confirm(`⚠️ Duplicate Detection Alert:\n\nThis mobile number (${cleanPh}) is already registered with Partner ID: ${duplicate.loginUserId || duplicate.id} (${duplicate.name}).\n\nDo you want to view that profile instead?`)) {
        setShowAddModal(false);
        handleOpen360Profile(duplicate);
      }
      return;
    }

    const hubObj = hubs.find(h => h.id === newHubId);
    const newPartner: Partner = {
      id: `partner-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      email: newEmail.trim() || '',
      phone: cleanPh,
      avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&q=80',
      status: 'active',
      isOnline: true,
      assignedHubId: newHubId,
      assignedHubName: hubObj?.name || 'Patna Central Hub',
      approvedCategories: selectedSkills,
      rating: 5.0,
      totalJobs: 0,
      totalEarnings: 0,
      kycVerified: true,
      currentLocation: { lat: 25.609, lng: 85.137 }
    };

    const updated = [newPartner, ...partners];
    onUpdatePartners(updated);
    onAuditLog?.('ONBOARD_PARTNER', newPartner.id, `Onboarded partner ${newPartner.name} mapped to ${newPartner.assignedHubName}`);
    alert(`Technician ${newPartner.name} successfully onboarded and certified for ${newPartner.assignedHubName}!`);
    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
  };

  // Toggle Partner Status (Suspend / Reactivate / Blacklist)
  const handleSetStatus = (partnerId: string, newStatus: Partner['status']) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    if (!window.confirm(`Confirm Action: Set status of ${partner.name} to ${newStatus.toUpperCase()}?`)) return;

    const updated = partners.map(p => {
      if (p.id === partnerId) {
        return {
          ...p,
          status: newStatus,
          isOnline: newStatus === 'active'
        };
      }
      return p;
    });

    onUpdatePartners(updated);
    if (selectedProfilePartner?.id === partnerId) {
      setSelectedProfilePartner({ ...selectedProfilePartner, status: newStatus, isOnline: newStatus === 'active' });
    }
    onAuditLog?.('UPDATE_PARTNER_STATUS', partnerId, `Status changed to ${newStatus} for ${partner.name}`);
  };

  // Delete Partner Profile
  const handleDeletePartner = (partnerId: string) => {
    const target = partners.find(p => p.id === partnerId);
    if (!window.confirm(`CRITICAL CONFIRMATION:\nPermanently delete partner ${target?.name} (${target?.phone})? This action cannot be undone.`)) return;

    const updated = partners.filter(p => p.id !== partnerId);
    onUpdatePartners(updated);
    if (selectedProfilePartner?.id === partnerId) {
      setSelectedProfilePartner(null);
    }
    onAuditLog?.('DELETE_PARTNER', partnerId, `Permanently deleted partner profile for ${target?.name}`);
    alert(`Partner profile for ${target?.name} deleted.`);
  };

  // Export Partners CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'LoginUserID', 'Name', 'Phone', 'Email', 'Hub', 'Status', 'Rating', 'TotalJobs', 'Earnings'];
    const rows = filteredPartners.map(p => [
      p.id,
      p.loginUserId || '',
      `"${p.name.replace(/"/g, '""')}"`,
      p.phone,
      p.email || '',
      `"${p.assignedHubName}"`,
      p.status,
      p.rating,
      p.totalJobs,
      p.totalEarnings
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bharat_pro_partners_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Module 08 &amp; 09 &bull; Partner Operations
            </span>
            <span className="text-xs text-[#8E8E93]">Cleaning Technicians, KYC &amp; 360° Profile Management</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Certified Partner Fleet &amp; Quality Execution
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Complete lifecycle controls: Step-by-step KYC onboarding, search by mobile number, 360° profile view, duplicate detection, and live status actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4A24E]" />
            <span>Onboard New Technician</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5EA] pb-3">
        {[
          { 
            id: 'PENDING_APPROVALS', 
            label: `Pending Approvals (${pendingPartners.length})`, 
            icon: Clock,
            badge: pendingPartners.length > 0 ? `${pendingPartners.length} Action Needed` : undefined,
            badgeColor: 'bg-amber-500 text-slate-950 font-black animate-pulse'
          },
          { id: 'FLEET', label: `Active Fleet (${partners.length})`, icon: Users },
          { id: 'SKILLS_EQUIPMENT', label: 'Skills & Mandatory Equipment Matrix', icon: Wrench },
          { id: 'PROOF_OF_WORK', label: 'Proof-of-Work & Job Lifecycle Audit', icon: Camera }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white hover:bg-[#F2F2F7] text-[#48484A] border border-[#E5E5EA]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW 0: PENDING APPROVALS */}
      {activeSubTab === 'PENDING_APPROVALS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Owner Approval Gateway &bull; {OWNER_EMAIL}</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Partners who register cannot log in until verified. Approving activates their login ID &amp; password.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-mono font-bold shrink-0">
              {pendingPartners.length} Applications Awaiting Review
            </span>
          </div>

          {pendingPartners.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5EA] space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-[#1C1C1E]">No Pending Partner Registrations</h4>
              <p className="text-xs text-[#8E8E93]">
                All registered partner applications have been processed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingPartners.map((partner) => (
                <div 
                  key={partner.id}
                  className="p-5 rounded-3xl bg-white border-2 border-amber-300 shadow-md space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold uppercase tracking-wider">
                        Pending Owner Approval
                      </span>
                      <h4 className="text-base font-bold text-[#1C1C1E] mt-1.5">{partner.name}</h4>
                      <p className="text-xs text-[#8E8E93]">{partner.assignedHubName} &bull; {partner.city}</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                      {partner.loginUserId || 'TEMP_ID'}
                    </span>
                  </div>

                  <div className="bg-[#F8F9FB] rounded-2xl p-3 text-xs space-y-2 text-[#48484A]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E8E93]">Phone (Calling/SMS):</span>
                      <span className="font-mono font-bold text-[#1C1C1E]">{partner.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E8E93]">Email Address:</span>
                      <span className="font-mono text-[#1C1C1E]">{partner.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E8E93]">Operational Hub:</span>
                      <span className="font-medium text-[#1C1C1E]">{partner.assignedHubName}</span>
                    </div>
                    <div className="pt-2 border-t border-[#E5E5EA]">
                      <span className="text-[11px] text-[#8E8E93] block mb-1">Applied Categories:</span>
                      <div className="flex flex-wrap gap-1">
                        {partner.approvedCategories?.map((cat) => (
                          <span key={cat} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Owner */}
                  <div className="pt-2 border-t border-[#E5E5EA] flex items-center gap-2">
                    <button
                      onClick={() => handleApprovePartner(partner.id)}
                      disabled={processingId === partner.id}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{processingId === partner.id ? 'Approving...' : 'Approve & Make ID Live'}</span>
                    </button>
                    <button
                      onClick={() => handleRejectPartner(partner.id)}
                      disabled={processingId === partner.id}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: FLEET DIRECTORY WITH MOBILE SEARCH & 360° PROFILE */}
      {activeSubTab === 'FLEET' && (
        <div className="space-y-4">
          {/* Top Priority Search Bar: By Mobile Number, Partner ID, Name */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Primary Identifier: Search by Mobile Number (10 digits), Partner ID, or Name..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            {/* Auto-suggest dropdown for quick mobile lookup */}
            {autoSuggestMatches.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Suggestions:</span>
                {autoSuggestMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleOpen360Profile(m)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer border border-blue-200"
                  >
                    <span>{m.name}</span>
                    <span className="text-blue-900 font-bold">({m.phone})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Partners Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={partner.avatarUrl}
                      alt={partner.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-black/10 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1C1C1E]">{partner.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                          {partner.kycVerified ? 'KYC VERIFIED' : 'PENDING'}
                        </span>
                      </div>
                      <p className="text-xs text-[#8E8E93] flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-blue-600" /> {partner.phone}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    partner.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {partner.status.toUpperCase()}
                  </span>
                </div>

                {/* Login Credentials & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Login ID: <strong className="text-black">{partner.loginUserId || partner.id}</strong></span>
                  </div>
                  {partner.loginPassword && (
                    <div className="text-slate-600 text-[11px]">
                      Pass: <span className="text-black font-bold">{partner.loginPassword}</span>
                    </div>
                  )}
                </div>

                {/* Performance & Hub Mapping */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs">
                  <div>
                    <span className="text-[10px] text-[#8E8E93] block">Assigned Hub</span>
                    <span className="font-bold text-indigo-700 block mt-0.5 truncate">
                      {partner.assignedHubName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8E8E93] block">Lifetime Payout</span>
                    <span className="font-black text-[#1F8A3B] block mt-0.5">
                      ₹{partner.totalEarnings.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8E8E93] block">Performance</span>
                    <span className="font-bold text-[#1C1C1E] block mt-0.5">
                      ★ {partner.rating} ({partner.totalJobs} jobs)
                    </span>
                  </div>
                </div>

                {/* Actions: 360° Profile Button + Suspend/Reactivate */}
                <div className="pt-2 border-t border-[#F2F2F7] flex items-center justify-between text-xs gap-2">
                  <button
                    onClick={() => handleOpen360Profile(partner)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4A24E]" />
                    <span>360° Profile &amp; KYC</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSetStatus(partner.id, partner.status === 'active' ? 'inactive' : 'active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        partner.status === 'active'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {partner.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: SKILLS & EQUIPMENT MATRIX */}
      {activeSubTab === 'SKILLS_EQUIPMENT' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-6">
          <div>
            <h4 className="text-base font-black text-[#1C1C1E]">
              Mandatory Cleaning Toolkits &amp; Service Eligibility Matrix
            </h4>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Partners cannot accept dispatches for services where mandatory industrial tools are unverified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h5 className="font-bold text-xs text-[#1C1C1E]">Hospital-Grade Diversey Chemicals</h5>
              </div>
              <p className="text-xs text-[#8E8E93]">
                R1 (Bathroom), R2 (Hard Surfaces), R3 (Glass/Mirror), R4 (Furniture Polish), R5 (Air Freshener), R6 (Heavy Toilet Bowl Cleaner).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h5 className="font-bold text-xs text-[#1C1C1E]">German Extraction &amp; Scrubbing Machinery</h5>
              </div>
              <p className="text-xs text-[#8E8E93]">
                Kärcher wet &amp; dry industrial vacuum, high-pressure single disc scrubbing machine, microfiber color-coded wipes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: PROOF OF WORK */}
      {activeSubTab === 'PROOF_OF_WORK' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-4">
          <h4 className="text-base font-black text-[#1C1C1E]">
            Before / After Proof of Work &amp; Job Audits
          </h4>
          <p className="text-xs text-[#8E8E93]">
            Real job photographs captured by technicians at job start and completion with timestamp &amp; GPS coordinates.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bookings.slice(0, 3).map((b) => (
              <div key={b.id} className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold font-mono">#{b.bookingNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {b.status}
                  </span>
                </div>
                <div className="h-32 rounded-xl bg-slate-200 overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80"
                    alt="Proof"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                    Start OTP Verified
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <span>Tech: <strong>{b.assignedPartnerName || 'Assigned Tech'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 360° PARTNER PROFILE VIEW MODAL (ALL 12 SECTIONS) */}
      {/* ========================================================= */}
      {selectedProfilePartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-white border border-[#E5E5EA] shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedProfilePartner.avatarUrl} 
                  alt={selectedProfilePartner.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-white/20"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&q=80';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black">{selectedProfilePartner.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      selectedProfilePartner.status === 'active' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}>
                      {selectedProfilePartner.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>ID: {selectedProfilePartner.loginUserId || selectedProfilePartner.id}</span>
                    <span>&bull;</span>
                    <span>Phone: {selectedProfilePartner.phone}</span>
                    <span>&bull;</span>
                    <span>Hub: {selectedProfilePartner.assignedHubName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isEditingProfile ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{isEditingProfile ? 'Editing...' : 'Edit Details'}</span>
                </button>
                <button
                  onClick={() => setSelectedProfilePartner(null)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Navigation Tabs (12 Functional Dimensions) */}
            <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs shrink-0 font-semibold">
              {[
                { id: 'BASIC', label: '1. Basic Info' },
                { id: 'KYC', label: '2. KYC Docs' },
                { id: 'SERVICES', label: '3. Verticals' },
                { id: 'JOBS', label: '4. Jobs & Performance' },
                { id: 'PAYOUTS', label: '5. Finance & Payout' },
                { id: 'TICKETS', label: '6. Support & Safety' },
                { id: 'AUDIT', label: '7. Actions & Logs' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setProfileActiveTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                    profileActiveTab === t.id ? 'bg-white text-black shadow-xs font-bold' : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Profile Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              
              {/* TAB 1: BASIC INFORMATION (EDITABLE) */}
              {profileActiveTab === 'BASIC' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="font-bold text-sm text-[#1C1C1E]">Technician Personal &amp; Operational Info</h4>
                    {isEditingProfile && (
                      <button
                        onClick={handleSaveProfileEdits}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                      >
                        Save Profile Changes
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Primary Mobile Number (Calling / WhatsApp)
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        disabled={!isEditingProfile}
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white disabled:bg-slate-50"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">10-digit Indian mobile identifier</span>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                      <input
                        type="email"
                        disabled={!isEditingProfile}
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Operational Hub</label>
                      <select
                        disabled={!isEditingProfile}
                        value={editHubId}
                        onChange={(e) => setEditHubId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white disabled:bg-slate-50"
                      >
                        {hubs.map(h => (
                          <option key={h.id} value={h.id}>{h.city} &bull; {h.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Partner Operational Status</label>
                      <select
                        disabled={!isEditingProfile}
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white disabled:bg-slate-50"
                      >
                        <option value="active">Active (Online &amp; Eligible for Jobs)</option>
                        <option value="inactive">Suspended / Paused</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Coverage Radius (km)</label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        defaultValue="12 km"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KYC DOCUMENTS & VERIFICATION */}
              {profileActiveTab === 'KYC' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="font-bold text-sm text-[#1C1C1E]">KYC Documents Verification Gate</h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
                      VERIFIED BY OWNER
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Aadhar */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Aadhar Card (Front &amp; Back)</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">VERIFIED</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="font-mono font-bold">XXXX-XXXX-8920</span>
                        <span className="text-slate-500 text-[11px]">Govt UIDAI Match</span>
                      </div>
                    </div>

                    {/* PAN */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">PAN Card</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">VERIFIED</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="font-mono font-bold">ABCDE1234F</span>
                        <span className="text-slate-500 text-[11px]">ITD Taxpayer Record</span>
                      </div>
                    </div>

                    {/* Bank Account */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Bank Account &amp; IFSC</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">ACTIVE FOR PAYOUTS</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">A/C:</span>
                          <span className="font-mono font-bold">918000XXXXX</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">IFSC:</span>
                          <span className="font-mono font-bold">SBIN0001234</span>
                        </div>
                      </div>
                    </div>

                    {/* Police Verification */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Police Criminal Background Check</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">CLEAN RECORD</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <span>Jurisdiction: State Crime Bureau</span>
                        <span className="text-emerald-700 font-bold">No Records</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: APPROVED SERVICE VERTICALS */}
              {profileActiveTab === 'SERVICES' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="font-bold text-sm text-[#1C1C1E]">Approved Service Verticals</h4>
                    {isEditingProfile && (
                      <button
                        onClick={handleSaveProfileEdits}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer"
                      >
                        Save Categories
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((c) => {
                      const isSelected = editCategories.includes(c.id);
                      return (
                        <label 
                          key={c.id} 
                          className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                            isSelected ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!isEditingProfile}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditCategories([...editCategories, c.id]);
                              } else {
                                setEditCategories(editCategories.filter(cat => cat !== c.id));
                              }
                            }}
                            className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">{c.label}</span>
                            <span className="text-[10px] text-slate-500">Certified for this category</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: JOBS & PERFORMANCE */}
              {profileActiveTab === 'JOBS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="font-bold text-sm text-[#1C1C1E]">Job History &amp; Quality Score</h4>
                    <span className="font-bold text-amber-700">Overall Rating: ★ {selectedProfilePartner.rating} ({selectedProfilePartner.totalJobs} jobs)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Total Completed</span>
                      <span className="text-base font-black text-slate-900">{selectedProfilePartner.totalJobs}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Cancellation Rate</span>
                      <span className="text-base font-black text-emerald-700">0.0%</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Customer Feedback</span>
                      <span className="text-base font-black text-amber-600">99.2% Positive</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700">Recent Executed Bookings</h5>
                    {bookings.slice(0, 4).map((b) => (
                      <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold font-mono">#{b.bookingNumber} &bull; {b.serviceName}</span>
                          <span className="text-[11px] text-slate-500 block">{b.date} at {b.timeSlot} &bull; {b.customerName}</span>
                        </div>
                        <span className="font-black text-emerald-700 font-mono">₹{b.totalAmount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: PAYOUTS & COMMISSION LEDGER */}
              {profileActiveTab === 'PAYOUTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="font-bold text-sm text-[#1C1C1E]">Commission Ledger &amp; Weekly Payouts</h4>
                    <span className="font-black text-emerald-700 text-sm">
                      Total Payouts: ₹{selectedProfilePartner.totalEarnings.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Available Payout Balance</span>
                      <span className="text-xl font-black">₹3,450.00</span>
                    </div>
                    <button
                      onClick={() => alert(`Manual Payout of ₹3,450 released to partner account ${selectedProfilePartner.name}!`)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer"
                    >
                      Release Payout (Mark as Paid)
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700">Recent Settlement Transactions</h5>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                      <div>
                        <span className="font-bold block">Weekly Settlement Cycle &bull; Direct Bank IMPS</span>
                        <span className="text-[10px] text-slate-500">UTR: BPE_PAY_2026_0928_8921</span>
                      </div>
                      <span className="font-bold text-emerald-700">₹8,500 (PAID)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SUPPORT & SAFETY */}
              {profileActiveTab === 'TICKETS' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#1C1C1E]">Customer Tickets &amp; Partner Safety Flags</h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center py-8">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span className="font-bold text-slate-800 block">Clean Safety Record</span>
                    <span className="text-slate-500 text-xs">No active customer complaints or misconduct tickets logged for this technician.</span>
                  </div>
                </div>
              )}

              {/* TAB 7: ACTIONS & AUDIT */}
              {profileActiveTab === 'AUDIT' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#1C1C1E]">Quick Administrative Actions &amp; Lifecycle Audit</h4>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => handleSetStatus(selectedProfilePartner.id, selectedProfilePartner.status === 'active' ? 'inactive' : 'active')}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold bg-white hover:bg-slate-100 cursor-pointer"
                    >
                      {selectedProfilePartner.status === 'active' ? 'Suspend Partner' : 'Reactivate Partner'}
                    </button>
                    <button
                      onClick={() => {
                        const newPh = window.prompt('Enter new 10-digit mobile number for partner:', selectedProfilePartner.phone);
                        if (newPh && newPh.length === 10) {
                          setEditPhone(newPh);
                          alert(`Mobile number updated to ${newPh}. Live on system.`);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold bg-white hover:bg-slate-100 cursor-pointer"
                    >
                      Change Mobile Number
                    </button>
                    <button
                      onClick={() => handleDeletePartner(selectedProfilePartner.id)}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                    >
                      Delete Profile Permanently
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedProfilePartner(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold cursor-pointer hover:bg-slate-900"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Modal with DUPLICATE DETECTION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E5E5EA] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#D4A24E]" />
                <h4 className="text-base font-bold text-[#1C1C1E]">Onboard New Certified Technician</h4>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleOnboardPartner} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1C1C1E] mb-1">Technician Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D1D1D6] font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1E] mb-1">Primary Mobile Number (10 digits) *</label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D1D1D6] font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Duplicate detection is active. Existing numbers will be flagged.</span>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1E] mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="technician@bharatpro.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D1D1D6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1E] mb-1">Operational Hub *</label>
                <select
                  value={newHubId}
                  onChange={(e) => setNewHubId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D1D1D6] font-medium"
                >
                  {hubs.map(h => (
                    <option key={h.id} value={h.id}>{h.city} &bull; {h.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1E] mb-1">Approved Cleaning Verticals</label>
                <div className="space-y-1.5 mt-1">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSkills([...selectedSkills, cat.id]);
                          } else {
                            setSelectedSkills(selectedSkills.filter(s => s !== cat.id));
                          }
                        }}
                        className="rounded accent-[#1C1C1E]"
                      />
                      <span>{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white font-bold cursor-pointer"
                >
                  Confirm &amp; Issue ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPartnerSuite;
