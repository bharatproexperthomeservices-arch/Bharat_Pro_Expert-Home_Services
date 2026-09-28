import React, { useState } from 'react';
import { Booking, Partner, AssignmentHistoryEntry } from '../../types';
import { 
  assignPartnerManually, 
  reassignPartnerManually, 
  updateBookingStatusWithOtp 
} from '../../services/dbService';
import { 
  Search, 
  Filter, 
  Eye, 
  Key, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  ShieldCheck, 
  Receipt, 
  Sparkles,
  RefreshCw,
  UserCheck,
  RotateCcw,
  Ban,
  Check,
  Radio,
  Star,
  Compass,
  ArrowRight,
  History,
  Briefcase
} from 'lucide-react';

interface AdminBookingsTabProps {
  bookings: Booking[];
  partners?: Partner[];
  onRefresh: () => void;
  onManualAssign?: (bookingId: string, partnerId: string, reason?: string) => void;
}

export const AdminBookingsTab: React.FC<AdminBookingsTabProps> = ({
  bookings,
  partners = [],
  onRefresh,
  onManualAssign
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectBooking, setInspectBooking] = useState<Booking | null>(null);
  const [reassignBookingId, setReassignBookingId] = useState<string | null>(null);
  const [reassignReason, setReassignReason] = useState<string>('Operational schedule optimization');
  const [selectedPartnerForReassign, setSelectedPartnerForReassign] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showHistoryForBookingId, setShowHistoryForBookingId] = useState<string | null>(null);

  // Status categories matching user request:
  // ALL | SEARCHING_PROFESSIONAL | ASSIGNED | ON_THE_WAY | IN_PROGRESS | COMPLETED | CANCELLED
  const statusOptions = [
    { key: 'ALL', label: 'All Bookings' },
    { key: 'SEARCHING_PROFESSIONAL', label: 'Searching Professional (New)' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'ON_THE_WAY', label: 'On The Way' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' }
  ];

  const filtered = bookings.filter(b => {
    let matchesStatus = true;
    if (statusFilter === 'SEARCHING_PROFESSIONAL') {
      matchesStatus = b.status === 'SEARCHING_PROFESSIONAL' || b.status === 'PENDING' || !b.assignedPartnerId;
    } else if (statusFilter === 'ASSIGNED') {
      matchesStatus = b.status === 'ASSIGNED' || b.status === 'PARTNER_ASSIGNED' || b.status === 'CONFIRMED';
    } else if (statusFilter === 'ON_THE_WAY') {
      matchesStatus = b.status === 'ON_THE_WAY' || b.status === 'PARTNER_ON_THE_WAY' || b.status === 'ARRIVED';
    } else if (statusFilter === 'IN_PROGRESS') {
      matchesStatus = b.status === 'IN_PROGRESS' || b.status === 'STARTED';
    } else if (statusFilter !== 'ALL') {
      matchesStatus = b.status === statusFilter;
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      b.bookingNumber?.toLowerCase().includes(q) ||
      b.customerName?.toLowerCase().includes(q) ||
      b.customerPhone?.toLowerCase().includes(q) ||
      b.serviceName?.toLowerCase().includes(q) ||
      b.address.sector?.toLowerCase().includes(q) ||
      b.address.city?.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  // Calculate simulated distance and candidate ranking for admin view only
  const getCandidatePartnersForBooking = (booking: Booking): { partner: Partner; distanceKm: number }[] => {
    return partners.map((partner, index) => {
      // Deterministic distance calculation based on index and city match
      const pCity = partner.city || '';
      const cityMatches = pCity.toLowerCase() === booking.address.city.toLowerCase();
      const distanceKm = cityMatches ? Number((2.1 + (index * 1.3) % 6).toFixed(1)) : Number((9.5 + index * 2.2).toFixed(1));
      return { partner, distanceKm };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  };

  // Admin executes manual assignment
  const handleAssignClick = async (bookingId: string, partnerId: string, reason: string = 'Admin Manual Assignment') => {
    setIsUpdating(true);
    try {
      const res = await assignPartnerManually(bookingId, partnerId, 'admin_dispatch', reason);
      if (res.success && res.booking) {
        alert(`Success: Professional ${res.booking.assignedPartnerName} assigned to Booking #${res.booking.bookingNumber}. Customer screen updated in real time.`);
        onRefresh();
      } else {
        alert(`Assignment failed: ${res.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Network or server error during assignment.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Reassignment with audit history
  const handleConfirmReassign = async (bookingId: string) => {
    if (!selectedPartnerForReassign) {
      alert('Please select a new professional to reassign.');
      return;
    }
    setIsUpdating(true);
    try {
      const res = await reassignPartnerManually(
        bookingId, 
        selectedPartnerForReassign, 
        'admin_dispatch', 
        reassignReason || 'Operational Reassignment'
      );
      if (res.success && res.booking) {
        alert(`Reassignment Complete: Booking #${res.booking.bookingNumber} reassigned to ${res.booking.assignedPartnerName}.`);
        setReassignBookingId(null);
        setSelectedPartnerForReassign('');
        onRefresh();
      } else {
        alert(`Reassignment failed: ${res.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Status Change override (e.g. Cancel booking, Mark On The Way, etc.)
  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    if (newStatus === 'CANCELLED') {
      const confirmCancel = window.confirm("Are you sure you want to cancel this booking? This will notify the customer.");
      if (!confirmCancel) return;
    }

    setIsUpdating(true);
    try {
      const res = await updateBookingStatusWithOtp(bookingId, newStatus, undefined, true);
      if (res.success) {
        alert(`Status updated to ${newStatus}.`);
        onRefresh();
      } else {
        alert(`Status change failed: ${res.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Master Admin OTP Bypass
  const handleMasterBypass = async (bookingId: string, targetStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    const reason = window.prompt("Emergency Master Override: Enter reason to bypass customer OTP verification:");
    if (!reason) return;

    setIsUpdating(true);
    try {
      const res = await updateBookingStatusWithOtp(bookingId, targetStatus, undefined, true);
      if (res.success) {
        alert(`Master Override executed successfully. Booking #${res.booking?.bookingNumber} is now ${targetStatus}.`);
        onRefresh();
      } else {
        alert(`Override failed: ${res.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (b: Booking) => {
    const isSearching = b.status === 'SEARCHING_PROFESSIONAL' || b.status === 'PENDING' || !b.assignedPartnerId;
    if (isSearching) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] animate-pulse border border-amber-300 flex items-center gap-1">
          <Radio className="w-3 h-3 text-[#B8892E]" />
          SEARCHING PROFESSIONAL
        </span>
      );
    }
    switch (b.status) {
      case 'ASSIGNED':
      case 'PARTNER_ASSIGNED':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px]">ASSIGNED</span>;
      case 'ON_THE_WAY':
      case 'PARTNER_ON_THE_WAY':
        return <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px]">ON THE WAY</span>;
      case 'IN_PROGRESS':
      case 'STARTED':
        return <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px] animate-pulse">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 font-bold text-[10px]">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-bold text-[10px]">{b.status}</span>;
    }
  };

  return (
    <div className="space-y-6" id="admin-bookings-tab">
      {/* Top Header */}
      <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase">
              Manual Dispatch Control
            </span>
            <span className="text-xs text-[#8E8E93]">Zero Auto-Assignment Policy</span>
          </div>
          <h2 className="text-xl font-bold font-['Outfit'] text-[#1C1C1E] mt-1">
            Bookings &amp; Manual Professional Assignment
          </h2>
          <p className="text-xs text-[#636366]">
            Every booking awaits manual Admin approval and partner assignment. Customers see live radar &quot;Finding the best professional on Hub&quot; until you click Assign.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>Refresh Bookings</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === opt.key
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white border border-[#E5E5EA] text-[#48484A] hover:bg-[#F2F2F7]'
              }`}
            >
              {opt.label}
              {opt.key === 'SEARCHING_PROFESSIONAL' && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px]">
                  {bookings.filter(b => b.status === 'SEARCHING_PROFESSIONAL' || b.status === 'PENDING' || !b.assignedPartnerId).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, booking number, sector or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D1D1D6] bg-white text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#B8892E]"
          />
        </div>
      </div>

      {/* Bookings Feed */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5EA] text-sm text-[#8E8E93] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold text-[#1C1C1E]">No bookings match this filter.</p>
            <p className="text-xs">Create a new booking from customer portal to test manual partner assignment.</p>
          </div>
        ) : (
          filtered.map((b) => {
            const isUnassigned = !b.assignedPartnerId || 
              b.status === 'SEARCHING_PROFESSIONAL' || 
              b.status === 'PENDING';
            const candidates = getCandidatePartnersForBooking(b);

            return (
              <div 
                key={b.id} 
                className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all space-y-5 shadow-sm ${
                  isUnassigned 
                    ? 'border-amber-300 ring-2 ring-amber-100' 
                    : 'border-[#E5E5EA] hover:border-[#D1D1D6]'
                }`}
              >
                {/* Booking Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2F2F7]">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-bold text-[#B8892E] bg-[#FFF8F0] px-2.5 py-1 rounded-lg border border-[#F0D5AA]">
                      #{b.bookingNumber}
                    </span>
                    {getStatusBadge(b)}
                    <span className="text-xs text-[#8E8E93]">
                      Created {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectBooking(b)}
                      className="px-3 py-1.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5 transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[#B8892E]" />
                      <span>Financial Snapshot</span>
                    </button>

                    {b.assignmentHistory && b.assignmentHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowHistoryForBookingId(showHistoryForBookingId === b.id ? null : b.id)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5 transition-all"
                      >
                        <History className="w-3.5 h-3.5 text-neutral-600" />
                        <span>History ({b.assignmentHistory.length})</span>
                      </button>
                    )}

                    {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(b.id, 'CANCELLED')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition-all"
                        title="Cancel this booking"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Booking Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Customer Information */}
                  <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-1.5">
                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider block">Customer &amp; Location</span>
                    <h4 className="font-bold text-[#1C1C1E] text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#8E8E93]" /> {b.customerName}
                    </h4>
                    <p className="text-[#48484A] font-semibold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#8E8E93]" /> {b.customerPhone}
                    </p>
                    <p className="text-[#636366] leading-relaxed flex items-start gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#B8892E] shrink-0 mt-0.5" />
                      <span>{b.address.street}, {b.address.sector}, {b.address.city} - {b.address.pincode || '122001'}</span>
                    </p>
                  </div>

                  {/* Service & Schedule Information */}
                  <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-1.5">
                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider block">Service &amp; Time Slot</span>
                    <h4 className="font-bold text-[#1C1C1E] text-sm">{b.serviceName}</h4>
                    <p className="text-[#8E8E93]">Category: {b.categoryName || 'Deep Cleaning Services'}</p>
                    <p className="text-[#1C1C1E] font-semibold flex items-center gap-1.5 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-[#B8892E]" /> {b.date} &bull; {b.timeSlot}
                    </p>
                    <p className="text-[11px] text-[#8E8E93]">
                      Hub: <span className="font-semibold text-indigo-700">{b.assignedHubName || b.address.city + ' Central Hub'}</span>
                    </p>
                  </div>

                  {/* Payment & OTP State */}
                  <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-1.5">
                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider block">Payment &amp; OTP Status</span>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8E8E93]">Amount:</span>
                      <span className="font-black text-sm text-[#1C1C1E]">₹{b.totalAmount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8E8E93]">Method:</span>
                      <span className="font-bold text-[#1C1C1E]">{b.paymentMethod} ({b.paymentStatus})</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-[#E5E5EA]">
                      <span className="text-[#8E8E93]">Start OTP:</span>
                      <span className="font-mono font-bold text-[#1C1C1E] bg-white px-2 py-0.5 rounded border border-[#E5E5EA]">
                        {b.startOtp}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#8E8E93]">Completion OTP:</span>
                      <span className="font-mono font-bold text-[#1C1C1E] bg-white px-2 py-0.5 rounded border border-[#E5E5EA]">
                        {b.completionOtp}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assignment History View (Collapsible) */}
                {showHistoryForBookingId === b.id && b.assignmentHistory && (
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
                    <h5 className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-neutral-600" />
                      Assignment &amp; Reassignment History Log
                    </h5>
                    <div className="divide-y divide-neutral-200">
                      {b.assignmentHistory.map((h, i) => (
                        <div key={h.id || i} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                          <div>
                            <span className="font-bold text-neutral-900">{h.newPartnerName}</span>
                            {h.previousPartnerName && (
                              <span className="text-neutral-500"> (Reassigned from {h.previousPartnerName})</span>
                            )}
                            <span className="text-neutral-600 block">Reason: {h.reason}</span>
                          </div>
                          <div className="text-neutral-500 font-mono text-[10px]">
                            {new Date(h.createdAt).toLocaleDateString('en-IN')} {new Date(h.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} &bull; By {h.assignedByAdminId}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ============================================================= */}
                {/* 1. UNASSIGNED STATE: "AVAILABLE PROFESSIONALS NEAR THIS JOB" */}
                {/* ============================================================= */}
                {isUnassigned ? (
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                          !
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-amber-950 font-['Outfit']">
                            Awaiting Manual Partner Assignment
                          </h4>
                          <p className="text-[11px] text-amber-800">
                            Customer is currently seeing &ldquo;Finding the best professional on Hub&rdquo;. Select an expert below and click ASSIGN JOB.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 self-start sm:self-auto">
                        NO AUTO-ASSIGNMENT ACTIVE
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2.5 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-[#B8892E]" />
                        Available Professionals Near This Job (Admin Selection Only)
                      </h5>

                      {/* Candidate Professionals Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {candidates.slice(0, 6).map(({ partner, distanceKm }) => (
                          <div 
                            key={partner.id}
                            className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs hover:border-[#B8892E] transition-all space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h6 className="font-bold text-xs text-[#1C1C1E]">{partner.name}</h6>
                                  <span className="font-mono text-[10px] text-[#8E8E93]">
                                    ID: BPE-{partner.id}
                                  </span>
                                </div>
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#B8892E] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  <Star className="w-3 h-3 fill-[#B8892E]" /> {partner.rating}
                                </span>
                              </div>

                              <div className="text-[11px] text-[#48484A] space-y-0.5">
                                <div className="flex justify-between">
                                  <span className="text-[#8E8E93]">Distance:</span>
                                  <span className="font-semibold text-emerald-700">~{distanceKm} km from job</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#8E8E93]">Hub:</span>
                                  <span className="truncate max-w-[130px] font-medium">{partner.assignedHubName || partner.hubName || 'Hub'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#8E8E93]">Completed:</span>
                                  <span className="font-semibold text-[#1C1C1E]">{partner.completedJobs ?? partner.totalJobs ?? 120} jobs</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#8E8E93]">Status:</span>
                                  <span className={`font-bold ${partner.isOnline ? 'text-emerald-700' : 'text-[#8E8E93]'}`}>
                                    {partner.isOnline ? 'Online & Ready' : 'Standby'}
                                  </span>
                                </div>
                              </div>

                              <div className="pt-1.5">
                                <span className="text-[9px] uppercase font-bold text-[#8E8E93] block">Skills:</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {partner.approvedCategories.slice(0, 3).map(cat => (
                                    <span key={cat} className="px-1.5 py-0.2 rounded bg-neutral-100 text-[9px] font-medium text-neutral-700">
                                      {cat.replace('-cleaning', '')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Prominent ASSIGN JOB Button */}
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleAssignClick(b.id, partner.id)}
                              className="w-full py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#F9D976]" />
                              <span>ASSIGN JOB</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ============================================================= */
                  /* 2. ASSIGNED STATE: CURRENT PARTNER + REASSIGN CONTROL         */
                  /* ============================================================= */
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                        <ShieldCheck className="w-6 h-6 text-[#F9D976]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 uppercase">
                            Assigned Professional
                          </span>
                          <span className="text-xs font-mono text-emerald-800">
                            ID: BPE-{b.assignedPartnerId}
                          </span>
                        </div>
                        <h5 className="text-sm sm:text-base font-bold text-[#1C1C1E] mt-0.5">
                          {b.assignedPartnerName} &bull; <span className="text-xs font-normal text-[#48484A]">{b.assignedPartnerPhone}</span>
                        </h5>
                        <p className="text-xs text-[#8E8E93]">
                          ★ {b.partnerRating || 4.85} &bull; {b.partnerCompletedJobs || 340}+ jobs completed &bull; Assigned: {b.assignedAt ? new Date(b.assignedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Confirmed'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Reassign Button */}
                      <button
                        type="button"
                        onClick={() => setReassignBookingId(b.id)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-[#D1D1D6] hover:bg-[#F2F2F7] text-[#1C1C1E] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#B8892E]" />
                        <span>Reassign Professional</span>
                      </button>

                      {/* Status Override Shortcuts */}
                      {b.status === 'ASSIGNED' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(b.id, 'ON_THE_WAY')}
                          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all"
                        >
                          Mark On The Way
                        </button>
                      )}

                      {(b.status === 'ASSIGNED' || b.status === 'ON_THE_WAY') && (
                        <button
                          type="button"
                          onClick={() => handleMasterBypass(b.id, 'IN_PROGRESS')}
                          className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Key className="w-3 h-3" />
                          <span>Start (Bypass OTP)</span>
                        </button>
                      )}

                      {b.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={() => handleMasterBypass(b.id, 'COMPLETED')}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Finish (Bypass OTP)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* REASSIGNMENT MODAL */}
      {reassignBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <h3 className="text-base font-bold text-[#1C1C1E]">
                Reassign Professional to Booking #{bookings.find(b => b.id === reassignBookingId)?.bookingNumber}
              </h3>
              <button 
                onClick={() => setReassignBookingId(null)}
                className="p-1 rounded-full text-[#8E8E93] hover:text-[#1C1C1E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">
                  Select New Professional:
                </label>
                <select
                  value={selectedPartnerForReassign}
                  onChange={(e) => setSelectedPartnerForReassign(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#D1D1D6] bg-white font-medium text-[#1C1C1E]"
                >
                  <option value="">-- Choose New Expert --</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ID: BPE-{p.id}) &bull; {p.assignedHubName || p.hubName || 'Hub'} &bull; ★ {p.rating}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1C1C1E] block mb-1">
                  Reassignment Reason (Logged to Audit History):
                </label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Previous technician had vehicle breakdown"
                  className="w-full p-2.5 rounded-xl border border-[#D1D1D6] bg-white text-[#1C1C1E]"
                />
              </div>

              <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                Reassigning will record a permanent audit entry with timestamp, notify the new partner on WhatsApp, and instantly update the customer&apos;s live tracking screen.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setReassignBookingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E8E93] hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating || !selectedPartnerForReassign}
                onClick={() => handleConfirmReassign(reassignBookingId)}
                className="px-5 py-2 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {isUpdating ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT PRICE SNAPSHOT MODAL */}
      {inspectBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <h3 className="text-base font-bold text-[#1C1C1E]">
                Frozen Price Snapshot &bull; #{inspectBooking.bookingNumber}
              </h3>
              <button 
                onClick={() => setInspectBooking(null)}
                className="p-1 rounded-full text-[#8E8E93] hover:text-[#1C1C1E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F2F2F7]">
                <span className="text-[#8E8E93]">Base Service:</span>
                <span className="font-bold text-[#1C1C1E]">₹{inspectBooking.basePrice}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F2F7]">
                <span className="text-[#8E8E93]">Reference Price (15% Savings Base):</span>
                <span className="font-bold text-[#8E8E93]">₹{Math.round(inspectBooking.basePrice / 0.85)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F2F7]">
                <span className="text-[#8E8E93]">Add-ons Total:</span>
                <span className="font-bold text-[#1C1C1E]">₹{inspectBooking.addonsPrice || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F2F7]">
                <span className="text-[#8E8E93]">Taxes (GST 18%):</span>
                <span className="font-bold text-[#1C1C1E]">₹{inspectBooking.taxesGst}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F2F7]">
                <span className="text-[#8E8E93]">Platform Convenience Fee:</span>
                <span className="font-bold text-[#1C1C1E]">₹{inspectBooking.convenienceFee}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F2F2F7]">
                <span className="text-emerald-700 font-bold">Promo / Unlocked Discount:</span>
                <span className="font-bold text-emerald-700">-₹{inspectBooking.discount}</span>
              </div>
              <div className="flex justify-between pt-2 font-black text-sm text-[#1C1C1E]">
                <span>Total Amount Charged:</span>
                <span>₹{inspectBooking.totalAmount}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E5EA] flex justify-end">
              <button
                type="button"
                onClick={() => setInspectBooking(null)}
                className="px-5 py-2 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
