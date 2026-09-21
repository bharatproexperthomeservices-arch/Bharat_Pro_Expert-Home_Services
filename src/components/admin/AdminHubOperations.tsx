import React, { useState } from 'react';
import { HubLocation, LocationZone, Partner, HubStatus } from '../../types';
import { INITIAL_HUBS, INITIAL_ZONES } from '../../data';
import { 
  MapPin, 
  Plus, 
  Copy, 
  PauseCircle, 
  PlayCircle, 
  Archive, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Users, 
  Compass, 
  Clock, 
  Settings, 
  ArrowRightLeft,
  Search,
  Filter,
  Sliders,
  ShieldAlert,
  Edit2,
  Phone,
  UserCheck
} from 'lucide-react';

interface AdminHubOperationsProps {
  hubs: HubLocation[];
  partners: Partner[];
  onUpdateHubs: (updated: HubLocation[]) => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const AdminHubOperations: React.FC<AdminHubOperationsProps> = ({
  hubs,
  partners,
  onUpdateHubs,
  onAuditLog
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [zones, setZones] = useState<LocationZone[]>(INITIAL_ZONES);
  const [activeSubTab, setActiveSubTab] = useState<'HUBS' | 'ZONES' | 'CAPACITY' | 'MULTI_CITY_CLUSTER'>('HUBS');

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHub, setEditingHub] = useState<HubLocation | null>(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formState, setFormState] = useState('Bihar');
  const [formCity, setFormCity] = useState('Patna');
  const [formDistrict, setFormDistrict] = useState('Patna District');
  const [formAddress, setFormAddress] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formOperatingHours, setFormOperatingHours] = useState('08:00 - 20:00');
  const [formSectors, setFormSectors] = useState('');
  const [formPincodes, setFormPincodes] = useState('');
  const [formRadius, setFormRadius] = useState('8');
  const [formMaxJobsPerDay, setFormMaxJobsPerDay] = useState('80');
  const [formPartnerCapacity, setFormPartnerCapacity] = useState('25');
  const [formBackupHubId, setFormBackupHubId] = useState('');
  const [formStatus, setFormStatus] = useState<HubStatus>('ACTIVE');

  // Extract unique cities
  const cities = ['ALL', ...Array.from(new Set(hubs.map(h => h.city)))];

  // Filtering
  const filteredHubs = hubs.filter(hub => {
    const matchesCity = selectedCity === 'ALL' || hub.city === selectedCity;
    const matchesStatus = statusFilter === 'ALL' || (hub.status || (hub.active ? 'ACTIVE' : 'PAUSED')) === statusFilter;
    const matchesSearch = hub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hub.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hub.code && hub.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      hub.coveredSectors.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCity && matchesStatus && matchesSearch;
  });

  // Action: Create or Update Hub
  const handleSaveHub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCity || !formSectors) {
      alert('Please fill in Hub Name, City, and Covered Sectors.');
      return;
    }

    const sectorsArray = formSectors.split(',').map(s => s.trim()).filter(Boolean);
    const pincodesArray = formPincodes.split(',').map(p => p.trim()).filter(Boolean);
    const backupHubObj = hubs.find(h => h.id === formBackupHubId);

    if (editingHub) {
      // Update
      const updated = hubs.map(h => {
        if (h.id === editingHub.id) {
          return {
            ...h,
            name: formName,
            code: formCode || h.code,
            state: formState,
            city: formCity,
            district: formDistrict,
            address: formAddress,
            contactPhone: formContact,
            managerName: formManager,
            operatingHours: formOperatingHours,
            coveredSectors: sectorsArray,
            pincodes: pincodesArray,
            serviceRadiusKm: parseFloat(formRadius) || 8,
            backupHubId: formBackupHubId,
            backupHubName: backupHubObj?.name,
            status: formStatus,
            active: formStatus === 'ACTIVE',
            capacity: {
              ...(h.capacity || {
                maxJobsPerHour: 10,
                maxJobsPerDay: 80,
                partnerCapacity: 25,
                peakCapacity: 100,
                bookingBufferMinutes: 30,
                travelBufferMinutes: 20,
                emergencyCapacity: 12
              }),
              maxJobsPerDay: parseInt(formMaxJobsPerDay) || 80,
              partnerCapacity: parseInt(formPartnerCapacity) || 25
            }
          };
        }
        return h;
      });
      onUpdateHubs(updated);
      onAuditLog?.('UPDATE_HUB', editingHub.id, `Updated hub configuration for ${formName} (${formCode})`);
      alert(`Hub "${formName}" updated successfully.`);
    } else {
      // Create
      const newId = `hub-${formCity.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const newHub: HubLocation = {
        id: newId,
        code: formCode || `BPE-${formCity.substring(0, 3).toUpperCase()}-${hubs.length + 1}`,
        name: formName,
        state: formState,
        city: formCity,
        district: formDistrict,
        address: formAddress || `${formCity} Center Operations Facility`,
        contactPhone: formContact || '+91 98765 00000',
        managerName: formManager || 'Operations Lead',
        operatingHours: formOperatingHours,
        coveredSectors: sectorsArray,
        pincodes: pincodesArray,
        lat: 25.60 + Math.random() * 0.1,
        lng: 85.10 + Math.random() * 0.1,
        serviceRadiusKm: parseFloat(formRadius) || 8,
        allowedPropertyTypes: ['Apartment', 'Villa', 'Duplex', 'Independent Floor', 'Commercial/Office'],
        capacity: {
          maxJobsPerHour: 10,
          maxJobsPerDay: parseInt(formMaxJobsPerDay) || 80,
          partnerCapacity: parseInt(formPartnerCapacity) || 25,
          peakCapacity: 100,
          bookingBufferMinutes: 30,
          travelBufferMinutes: 20,
          emergencyCapacity: 15
        },
        dispatchPriority: 'PRIMARY',
        backupHubId: formBackupHubId,
        backupHubName: backupHubObj?.name,
        crossHubDispatchAllowed: true,
        overflowThresholdPct: 85,
        dispatchTimeoutSec: 60,
        status: formStatus,
        active: formStatus === 'ACTIVE'
      };

      const updated = [newHub, ...hubs];
      onUpdateHubs(updated);
      onAuditLog?.('CREATE_HUB', newId, `Created new operational hub ${formName} for ${formCity}`);
      alert(`New Operational Hub "${newHub.name}" (${newHub.code}) created and activated!`);
    }

    resetForm();
  };

  const resetForm = () => {
    setShowCreateModal(false);
    setEditingHub(null);
    setFormName('');
    setFormCode('');
    setFormState('Bihar');
    setFormCity('Patna');
    setFormDistrict('Patna District');
    setFormAddress('');
    setFormContact('');
    setFormManager('');
    setFormSectors('');
    setFormPincodes('');
    setFormRadius('8');
    setFormMaxJobsPerDay('80');
    setFormPartnerCapacity('25');
    setFormBackupHubId('');
    setFormStatus('ACTIVE');
  };

  const handleEditClick = (hub: HubLocation) => {
    setEditingHub(hub);
    setFormName(hub.name);
    setFormCode(hub.code || '');
    setFormState(hub.state);
    setFormCity(hub.city);
    setFormDistrict(hub.district || `${hub.city} District`);
    setFormAddress(hub.address || '');
    setFormContact(hub.contactPhone || '');
    setFormManager(hub.managerName || '');
    setFormOperatingHours(hub.operatingHours || '08:00 - 20:00');
    setFormSectors(hub.coveredSectors.join(', '));
    setFormPincodes((hub.pincodes || []).join(', '));
    setFormRadius(String(hub.serviceRadiusKm));
    setFormMaxJobsPerDay(String(hub.capacity?.maxJobsPerDay || 80));
    setFormPartnerCapacity(String(hub.capacity?.partnerCapacity || 25));
    setFormBackupHubId(hub.backupHubId || '');
    setFormStatus(hub.status || (hub.active ? 'ACTIVE' : 'PAUSED'));
    setShowCreateModal(true);
  };

  // Action: Duplicate Hub
  const handleDuplicateHub = (hub: HubLocation) => {
    const duplicated: HubLocation = {
      ...hub,
      id: `${hub.id}-copy-${Date.now()}`,
      code: `${hub.code || 'BPE'}-COPY`,
      name: `${hub.name} (Duplicate Cluster)`,
      status: 'DRAFT',
      active: false
    };
    onUpdateHubs([duplicated, ...hubs]);
    onAuditLog?.('DUPLICATE_HUB', duplicated.id, `Cloned configuration from ${hub.name}`);
    alert(`Duplicated Hub "${duplicated.name}". Initial status set to DRAFT.`);
  };

  // Action: Toggle Status (Pause / Activate / Maintenance)
  const handleSetStatus = (hubId: string, newStatus: HubStatus) => {
    const hub = hubs.find(h => h.id === hubId);
    if (!hub) return;

    if (newStatus === 'ARCHIVED' || newStatus === 'CLOSED') {
      const confirmAction = window.confirm(
        `Critical Hub Operation: Are you sure you want to mark "${hub.name}" as ${newStatus}?\n\n` +
        `Rule: Historical bookings remain intact for audit reporting. Hub serviceability will be stopped.`
      );
      if (!confirmAction) return;
    }

    const updated = hubs.map(h => {
      if (h.id === hubId) {
        return {
          ...h,
          status: newStatus,
          active: newStatus === 'ACTIVE'
        };
      }
      return h;
    });

    onUpdateHubs(updated);
    onAuditLog?.('SET_HUB_STATUS', hubId, `Changed hub status of ${hub.name} to ${newStatus}`);
  };

  // 3-Hub Multi-Cluster Patna Demo View
  const patnaHubs = hubs.filter(h => h.city.toLowerCase() === 'patna');

  return (
    <div className="space-y-6">
      {/* Top Banner with Architecture Hierarchy */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Module 02 &bull; Hub Operations
            </span>
            <span className="text-xs text-[#8E8E93]">Company &rarr; State &rarr; City &rarr; Hub &rarr; Zone</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Master Hub Operations &amp; City Service Clusters
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Centralized operational management. Create, edit, duplicate, activate, pause, or archive hubs. 
            Supports multiple hubs per city (e.g., 3 hubs in Patna) with automated backup overflow routing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4A24E]" />
            <span>Create New Hub</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs for Operational Perspectives */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5EA] pb-3">
        {[
          { id: 'HUBS', label: `Operational Hubs (${hubs.length})`, icon: MapPin },
          { id: 'MULTI_CITY_CLUSTER', label: '3-Hub Multi-Cluster (Patna Example)', icon: ArrowRightLeft },
          { id: 'ZONES', label: `Service Zones & Sectors (${zones.length})`, icon: Compass },
          { id: 'CAPACITY', label: 'Live Capacity & Overflow Rules', icon: Sliders }
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

      {/* VIEW 1: OPERATIONAL HUBS DIRECTORY */}
      {activeSubTab === 'HUBS' && (
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
                  placeholder="Search hub name, code, sector..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                />
              </div>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent font-medium outline-none"
              >
                {cities.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'All Cities' : c}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#F2F2F7] border border-transparent font-medium outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OVERLOADED">Overloaded</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <span className="text-xs text-[#8E8E93] font-medium shrink-0">
              Showing {filteredHubs.length} of {hubs.length} Hubs
            </span>
          </div>

          {/* Hubs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredHubs.map((hub) => {
              const assignedPartners = partners.filter(p => p.assignedHubId === hub.id);
              const currentStatus = hub.status || (hub.active ? 'ACTIVE' : 'PAUSED');

              const statusColor = {
                ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                PAUSED: 'bg-amber-100 text-amber-800 border-amber-200',
                MAINTENANCE: 'bg-blue-100 text-blue-800 border-blue-200',
                OVERLOADED: 'bg-rose-100 text-rose-800 border-rose-200',
                DRAFT: 'bg-neutral-100 text-neutral-800 border-neutral-200',
                CLOSED: 'bg-red-100 text-red-800 border-red-200',
                ARCHIVED: 'bg-stone-200 text-stone-800 border-stone-300'
              }[currentStatus] || 'bg-emerald-100 text-emerald-800';

              return (
                <div key={hub.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase text-[#B8892E] bg-[#D4A24E]/10 px-2 py-0.5 rounded">
                          {hub.code || 'BPE-HUB'}
                        </span>
                        <span className="text-xs text-[#8E8E93] font-semibold">
                          {hub.state} &bull; {hub.city}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#1C1C1E] mt-1">{hub.name}</h4>
                      <p className="text-xs text-[#8E8E93] mt-0.5">{hub.address || `${hub.city} District Operations Unit`}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${statusColor}`}>
                        {currentStatus}
                      </span>
                      <span className="text-[10px] text-[#8E8E93] font-mono">
                        Radius: {hub.serviceRadiusKm} km
                      </span>
                    </div>
                  </div>

                  {/* Manager & Operational Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs">
                    <div>
                      <span className="text-[10px] text-[#8E8E93] block">Hub Manager</span>
                      <span className="font-semibold text-[#1C1C1E] flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3 text-[#B8892E]" />
                        {hub.managerName || 'Operations Lead'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E8E93] block">Operating Hours</span>
                      <span className="font-semibold text-[#1C1C1E] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[#B8892E]" />
                        {hub.operatingHours || '08:00 - 20:00'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E8E93] block">Backup Overflow Hub</span>
                      <span className="font-semibold text-indigo-600 block mt-0.5 truncate">
                        {hub.backupHubName || (hub.backupHubId ? 'Assigned' : 'None (Standalone)')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E8E93] block">Partner Fleet</span>
                      <span className="font-bold text-[#1C1C1E] block mt-0.5">
                        {assignedPartners.length} Active Technicians
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E8E93] block">Daily Capacity</span>
                      <span className="font-bold text-[#1C1C1E] block mt-0.5">
                        {hub.capacity?.maxJobsPerDay || 80} jobs/day
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E8E93] block">Contact</span>
                      <span className="font-mono text-[11px] text-[#1C1C1E] block mt-0.5 truncate">
                        {hub.contactPhone || '+91 98765 43210'}
                      </span>
                    </div>
                  </div>

                  {/* Sectors & Pincodes Covered */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-[#48484A]">
                        Covered Sectors &amp; Localities ({hub.coveredSectors.length}):
                      </span>
                      {hub.pincodes && hub.pincodes.length > 0 && (
                        <span className="text-[10px] font-mono text-[#8E8E93]">
                          Pincodes: {hub.pincodes.join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {hub.coveredSectors.map((sector, sIdx) => (
                        <span key={sIdx} className="px-2 py-0.5 rounded-md bg-[#F2F2F7] text-[#1C1C1E] text-[11px] font-medium">
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Bar (Edit, Duplicate, Pause/Resume, Archive) */}
                  <div className="pt-2 border-t border-[#F2F2F7] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditClick(hub)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-semibold flex items-center gap-1"
                        title="Edit Hub Parameters"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateHub(hub)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-semibold flex items-center gap-1"
                        title="Clone configuration to a new cluster"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicate</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {currentStatus === 'ACTIVE' ? (
                        <button
                          onClick={() => handleSetStatus(hub.id, 'PAUSED')}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1"
                        >
                          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pause</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSetStatus(hub.id, 'ACTIVE')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Activate</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleSetStatus(hub.id, 'MAINTENANCE')}
                        className="px-2 py-1.5 rounded-lg bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#48484A] text-[11px] font-semibold"
                        title="Set Maintenance Mode"
                      >
                        Maint.
                      </button>

                      <button
                        onClick={() => handleSetStatus(hub.id, 'ARCHIVED')}
                        className="px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-700 text-[11px] font-semibold flex items-center gap-1"
                        title="Archive Hub (Preserves historic bookings)"
                      >
                        <Archive className="w-3.5 h-3.5 text-red-600" />
                        <span>Archive</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: 3-HUB MULTI-CLUSTER (PATNA DEMO SPECIFICATION) */}
      {activeSubTab === 'MULTI_CITY_CLUSTER' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-300/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-700 text-white font-mono text-[10px] font-bold uppercase">
                Section 3 Benchmark &bull; 3 Hubs in One City
              </span>
              <span className="text-xs font-bold text-amber-900">Patna Operational Cluster</span>
            </div>
            <h4 className="text-base font-black text-amber-950">
              Patna Multi-Hub Architecture with Automated Overflow Routing
            </h4>
            <p className="text-xs text-amber-900 leading-relaxed max-w-3xl">
              In this architecture, a city is not constrained to a single operational node. Patna is partitioned into 
              <strong> Patna Central</strong> (Fraser Road, Kankarbagh), <strong>Patna West</strong> (Bailey Road, Danapur), 
              and <strong>Patna South</strong> (Anisabad, Bypass). When one hub reaches 80-85% capacity threshold, incoming 
              jobs automatically overflow to the designated backup hub.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patnaHubs.map((hub) => (
              <div key={hub.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-[#1C1C1E] text-white font-mono text-[10px] font-bold">
                    {hub.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    NORMAL DISPATCH
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-[#1C1C1E]">{hub.name}</h4>
                  <span className="text-xs text-[#8E8E93]">{hub.district} &bull; {hub.serviceRadiusKm} km</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">Primary Role:</span>
                    <span className="font-semibold text-[#1C1C1E]">Normal Dispatch</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">Overflow Route:</span>
                    <span className="font-bold text-indigo-600">{hub.backupHubName || 'Cross-Cluster'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">Overflow Threshold:</span>
                    <span className="font-mono font-semibold text-amber-700">{hub.overflowThresholdPct || 85}% Load</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">Dispatch Timeout:</span>
                    <span className="font-mono text-[#1C1C1E]">{hub.dispatchTimeoutSec || 60} seconds</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#48484A] block mb-1">
                    Coverage Core Sectors:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {hub.coveredSectors.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-[#F2F2F7] text-[10px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F2F2F7] flex justify-between items-center text-xs">
                  <span className="text-[#8E8E93]">Assigned Fleet:</span>
                  <span className="font-bold text-[#1F8A3B]">
                    {partners.filter(p => p.assignedHubId === hub.id).length} Partners Online
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: LOCATION ZONES & SECTORS */}
      {activeSubTab === 'ZONES' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#1C1C1E]">
                Granular Service Zones, Pincodes &amp; Geofences
              </h4>
              <p className="text-xs text-[#8E8E93]">
                Map customer addresses to specific sub-hub zones with dynamic travel-time buffers.
              </p>
            </div>
            <button
              onClick={() => {
                const zoneName = window.prompt("Enter new Zone Name (e.g., Bailey Road North Zone):");
                if (!zoneName) return;
                const newZone: LocationZone = {
                  id: `zone-${Date.now()}`,
                  name: zoneName,
                  hubId: 'hub-patna-central',
                  hubName: 'Patna Central Hub',
                  state: 'Bihar',
                  city: 'Patna',
                  district: 'Patna District',
                  pincode: '800001',
                  sector: zoneName,
                  radiusKm: 6.0,
                  travelTimeMinutes: 15,
                  serviceable: true
                };
                setZones([newZone, ...zones]);
                alert(`Zone "${zoneName}" added to service directory.`);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A24E]" />
              <span>Add Zone</span>
            </button>
          </div>

          <div className="overflow-x-auto bg-white rounded-3xl border border-[#E5E5EA] shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5EA] text-[#8E8E93] bg-[#F8F9FB]">
                  <th className="p-4 font-semibold">Zone Name</th>
                  <th className="p-4 font-semibold">Assigned Hub</th>
                  <th className="p-4 font-semibold">City / State</th>
                  <th className="p-4 font-semibold">Pincode / Sector</th>
                  <th className="p-4 font-semibold">Radius</th>
                  <th className="p-4 font-semibold">Travel Buffer</th>
                  <th className="p-4 font-semibold text-right">Serviceability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F7]">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-[#F8F9FB]">
                    <td className="p-4 font-bold text-[#1C1C1E]">{zone.name}</td>
                    <td className="p-4 font-medium text-indigo-700">{zone.hubName}</td>
                    <td className="p-4 text-[#48484A]">{zone.city}, {zone.state}</td>
                    <td className="p-4 font-mono text-[#1C1C1E]">
                      <span className="font-bold">{zone.pincode}</span> &bull; {zone.sector}
                    </td>
                    <td className="p-4 font-mono text-[#48484A]">{zone.radiusKm} km</td>
                    <td className="p-4 font-mono text-[#48484A]">{zone.travelTimeMinutes} mins</td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ACTIVE SERVICEABLE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: CAPACITY & OVERFLOW RULES */}
      {activeSubTab === 'CAPACITY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#1C1C1E] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#B8892E]" />
              <span>Platform Capacity Control Rules</span>
            </h4>
            <p className="text-xs text-[#8E8E93]">
              Configure peak capacity thresholds, travel buffers, and automatic load redirection policies.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FB]">
                <div>
                  <span className="font-semibold text-[#1C1C1E] block">Default Overflow Trigger</span>
                  <span className="text-[11px] text-[#8E8E93]">Redirects to backup hub when active jobs cross percentage</span>
                </div>
                <span className="px-3 py-1 rounded-lg bg-white border border-[#E5E5EA] font-mono font-bold text-[#1C1C1E]">
                  85% Load
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FB]">
                <div>
                  <span className="font-semibold text-[#1C1C1E] block">Dispatch Offer Timeout</span>
                  <span className="text-[11px] text-[#8E8E93]">Auto-forwards to next ranked partner after expiry</span>
                </div>
                <span className="px-3 py-1 rounded-lg bg-white border border-[#E5E5EA] font-mono font-bold text-[#1C1C1E]">
                  60 Seconds
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FB]">
                <div>
                  <span className="font-semibold text-[#1C1C1E] block">Mandatory Travel Buffer</span>
                  <span className="text-[11px] text-[#8E8E93]">Enforced gap between sequential partner appointments</span>
                </div>
                <span className="px-3 py-1 rounded-lg bg-white border border-[#E5E5EA] font-mono font-bold text-[#1C1C1E]">
                  25 Minutes
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#1C1C1E] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#B8892E]" />
              <span>Emergency City Overload Switch</span>
            </h4>
            <p className="text-xs text-[#8E8E93]">
              In extreme weather, festival rush, or emergency situations, Super Admin can temporarily restrict 
              same-day bookings and enforce advance booking windows.
            </p>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <span className="font-bold block">Current Operational Status: NORMAL OPERATING DISPATCH</span>
              <p className="text-[11px]">
                All {hubs.filter(h => h.active).length} hubs accepting live same-day bookings with full SLA adherence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE OR EDIT HUB */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5E5EA]">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <div>
                <h3 className="text-lg font-black text-[#1C1C1E]">
                  {editingHub ? 'Edit Operational Hub' : 'Create Operational Hub'}
                </h3>
                <span className="text-xs text-[#8E8E93]">Company &rarr; State &rarr; City &rarr; Hub Model</span>
              </div>
              <button
                onClick={resetForm}
                className="p-1.5 rounded-lg bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#8E8E93]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveHub} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Hub Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Patna Central Hub"
                    required
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Hub Code</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. BPE-PAT-01"
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Patna, Gurugram"
                    required
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">State</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="e.g. Bihar, Haryana"
                    required
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Hub Manager Name</label>
                  <input
                    type="text"
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    placeholder="e.g. Vikramaditya Sahay"
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="e.g. +91 612 223 9001"
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1E] mb-1">
                  Covered Sectors / Localities (Comma Separated)
                </label>
                <textarea
                  rows={2}
                  value={formSectors}
                  onChange={(e) => setFormSectors(e.target.value)}
                  placeholder="e.g. Fraser Road, Dak Bungalow, Kankarbagh Zone, Boring Road"
                  required
                  className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Pincodes (Comma Separated)</label>
                  <input
                    type="text"
                    value={formPincodes}
                    onChange={(e) => setFormPincodes(e.target.value)}
                    placeholder="e.g. 800001, 800020"
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Service Radius (KM)</label>
                  <input
                    type="number"
                    value={formRadius}
                    onChange={(e) => setFormRadius(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Backup Overflow Hub</label>
                  <select
                    value={formBackupHubId}
                    onChange={(e) => setFormBackupHubId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  >
                    <option value="">None (Standalone)</option>
                    {hubs.filter(h => h.id !== editingHub?.id).map(h => (
                      <option key={h.id} value={h.id}>{h.city} - {h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Daily Job Capacity</label>
                  <input
                    type="number"
                    value={formMaxJobsPerDay}
                    onChange={(e) => setFormMaxJobsPerDay(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Partner Fleet Limit</label>
                  <input
                    type="number"
                    value={formPartnerCapacity}
                    onChange={(e) => setFormPartnerCapacity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as HubStatus)}
                    className="w-full p-2.5 rounded-xl bg-[#F2F2F7] border border-transparent focus:border-[#B8892E] outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#1C1C1E] hover:bg-black text-white font-bold"
                >
                  {editingHub ? 'Save Changes' : 'Create & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
