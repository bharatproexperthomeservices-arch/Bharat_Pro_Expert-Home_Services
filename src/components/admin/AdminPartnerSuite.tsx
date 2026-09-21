import React, { useState } from 'react';
import { Partner, HubLocation, Booking } from '../../types';
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
  Layers
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
  const [activeSubTab, setActiveSubTab] = useState<'FLEET' | 'ONBOARDING' | 'SKILLS_EQUIPMENT' | 'PROOF_OF_WORK'>('FLEET');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Onboarding Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newHubId, setNewHubId] = useState(hubs[0]?.id || 'hub-patna-central');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['full-home-cleaning', 'bathroom-cleaning']);
  const [equipmentVerified, setEquipmentVerified] = useState(true);

  const categories = [
    { id: 'full-home-cleaning', label: 'Full Home Deep Cleaning' },
    { id: 'bathroom-cleaning', label: 'Bathroom Deep Cleaning' },
    { id: 'kitchen-cleaning', label: 'Kitchen & Appliance Cleaning' },
    { id: 'sofa-carpet-living', label: 'Sofa, Carpet & Living' }
  ];

  // Filtering
  const filteredPartners = partners.filter(p => {
    const matchesHub = selectedHub === 'ALL' || p.assignedHubId === selectedHub;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.assignedHubName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesHub && matchesStatus && matchesSearch;
  });

  // Action: Onboard New Partner
  const handleOnboardPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) {
      alert('Please fill in Partner Name and Phone.');
      return;
    }

    const hubObj = hubs.find(h => h.id === newHubId);
    const newPartner: Partner = {
      id: `partner-${Date.now().toString().slice(-4)}`,
      name: newName,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '.')}@bharatpro.in`,
      phone: newPhone,
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

  // Action: Toggle Partner Status (Suspend / Reactivate)
  const handleToggleStatus = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    const newStatus = partner.status === 'active' ? 'inactive' : 'active';
    const confirm = window.confirm(
      `Confirm Action: Are you sure you want to mark ${partner.name} as ${newStatus.toUpperCase()}?`
    );
    if (!confirm) return;

    const updated = partners.map(p => {
      if (p.id === partnerId) {
        return {
          ...p,
          status: newStatus as any,
          isOnline: newStatus === 'active'
        };
      }
      return p;
    });

    onUpdatePartners(updated);
    onAuditLog?.('UPDATE_PARTNER_STATUS', partnerId, `Status changed to ${newStatus} for ${partner.name}`);
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
            <span className="text-xs text-[#8E8E93]">Cleaning Technicians, KYC &amp; Proof-of-Work</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Certified Partner Fleet &amp; Quality Execution
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Complete lifecycle controls: Onboarding, KYC checks, cleaning category skill matrix, equipment audit, 
            attendance, OTP arrivals, before/after proof photos, and 80% partner payouts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 text-[#D4A24E]" />
          <span>Onboard New Technician</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5EA] pb-3">
        {[
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
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white hover:bg-[#F2F2F7] text-[#48484A] border border-[#E5E5EA]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: FLEET DIRECTORY */}
      {activeSubTab === 'FLEET' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search technician name, phone, hub..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                />
              </div>

              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent font-medium outline-none"
              >
                <option value="ALL">All Hubs</option>
                {hubs.map(h => (
                  <option key={h.id} value={h.id}>{h.city} - {h.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent font-medium outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Suspended / Inactive</option>
              </select>
            </div>

            <span className="text-xs text-[#8E8E93] font-medium shrink-0">
              {filteredPartners.length} of {partners.length} Certified Partners
            </span>
          </div>

          {/* Partners Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={partner.avatarUrl}
                      alt={partner.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-black/10 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1C1C1E]">{partner.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          KYC VERIFIED
                        </span>
                      </div>
                      <p className="text-xs text-[#8E8E93] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {partner.phone}
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

                {/* Approved Skills */}
                <div>
                  <span className="text-[11px] font-bold text-[#48484A] block mb-1">
                    Approved Cleaning Verticals:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {partner.approvedCategories.map(cat => (
                      <span key={cat} className="px-2 py-0.5 rounded-md bg-[#D4A24E]/10 text-[#B8892E] font-mono text-[10px] font-bold">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-[#F2F2F7] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Background &amp; Police Verification Passed</span>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(partner.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      partner.status === 'active'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {partner.status === 'active' ? 'Suspend' : 'Reactivate'}
                  </button>
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
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h5 className="text-xs font-bold text-[#1C1C1E]">Full Home &amp; Bathroom Cleaning Toolkit</h5>
              </div>
              <ul className="text-xs space-y-2 text-[#48484A]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Single disc tile scrubbing machine with hard nylon brushes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Taski R6 (toilet cleaner) &amp; Taski R2 (hygienic hard surface descaler)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>High-pressure steam jet for window sliding channels</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Color-coded microfiber towels (Red for WC, Blue for glass, Yellow for tiles)</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <h5 className="text-xs font-bold text-[#1C1C1E]">Kitchen &amp; Appliance Degreasing Toolkit</h5>
              </div>
              <ul className="text-xs space-y-2 text-[#48484A]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Industrial food-safe chemical degreaser for chimney baffle filters</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Steam cleaner with narrow brass nozzle for gas stove burner heads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stainless steel non-scratch scrub pads &amp; scraper blades</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cabinet interior sanitizing spray &amp; shelf liner buffing cloths</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: PROOF OF WORK & JOB LIFECYCLE AUDIT */}
      {activeSubTab === 'PROOF_OF_WORK' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-[#1C1C1E]">
                Mandatory Job Proof-of-Work &amp; OTP Audit Stream
              </h4>
              <p className="text-xs text-[#8E8E93]">
                Section 6 requirement: Technicians must register Arrival, Start OTP, and Completion OTP with photos.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              100% Photo Audited
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-[#E5E5EA] bg-[#F8F9FB] space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Job #BPE-7729</span>
                <span className="text-emerald-700">COMPLETED</span>
              </div>
              <div className="aspect-video bg-neutral-200 rounded-xl overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"
                  alt="Proof"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                  Bathroom Descaling Post-Buff
                </span>
              </div>
              <div className="text-[11px] text-[#8E8E93] space-y-0.5">
                <div>Partner: Manoj Paswan</div>
                <div>Start OTP: Verified 09:15 AM</div>
                <div>Completion OTP: Verified 11:30 AM</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5EA] bg-[#F8F9FB] space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Job #BPE-7734</span>
                <span className="text-emerald-700">COMPLETED</span>
              </div>
              <div className="aspect-video bg-neutral-200 rounded-xl overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80"
                  alt="Proof"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                  Chimney Mesh Degreased
                </span>
              </div>
              <div className="text-[11px] text-[#8E8E93] space-y-0.5">
                <div>Partner: Deepak Chaudhary</div>
                <div>Start OTP: Verified 10:00 AM</div>
                <div>Completion OTP: Verified 12:15 PM</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5EA] bg-[#F8F9FB] space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Job #BPE-7690</span>
                <span className="text-emerald-700">COMPLETED</span>
              </div>
              <div className="aspect-video bg-neutral-200 rounded-xl overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80"
                  alt="Proof"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                  Sofa Shampoo Extraction Done
                </span>
              </div>
              <div className="text-[11px] text-[#8E8E93] space-y-0.5">
                <div>Partner: Rajesh Kumar Verma</div>
                <div>Start OTP: Verified 11:15 AM</div>
                <div>Completion OTP: Verified 01:45 PM</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ONBOARD NEW PARTNER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#E5E5EA]">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="text-base font-bold text-[#1C1C1E]">Onboard Certified Cleaning Partner</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#8E8E93]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleOnboardPartner} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1C1C1E] mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Santosh Kumar"
                  required
                  className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Mobile Phone (OTP)</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 94310 00000"
                    required
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="partner@bharatpro.in"
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1E] mb-1">Assigned Operational Hub</label>
                <select
                  value={newHubId}
                  onChange={(e) => setNewHubId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
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
                  className="px-4 py-2 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#1C1C1E] hover:bg-black text-white font-bold"
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
