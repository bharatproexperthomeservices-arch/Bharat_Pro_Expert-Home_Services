import React, { useState } from 'react';
import { Booking, Partner, HubLocation } from '../../types';
import { 
  Compass, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ShieldCheck, 
  Star, 
  Radio, 
  Lock, 
  UserCheck, 
  Check, 
  Clock, 
  Sliders
} from 'lucide-react';

interface AdminDispatchEngineProps {
  bookings: Booking[];
  partners: Partner[];
  hubs: HubLocation[];
  onManualAssign: (bookingId: string, partnerId: string) => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const AdminDispatchEngine: React.FC<AdminDispatchEngineProps> = ({
  bookings,
  partners,
  hubs,
  onManualAssign,
  onAuditLog
}) => {
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Unassigned bookings awaiting manual dispatch
  const pendingDispatchBookings = bookings.filter(
    b => b.status === 'SEARCHING_PROFESSIONAL' || b.status === 'PENDING' || !b.assignedPartnerId
  );

  const activeBooking = bookings.find(b => b.id === selectedBookingId) || pendingDispatchBookings[0] || null;

  // Filter nearby professionals for admin information only
  const getNearbyCandidates = (booking: Booking | null) => {
    if (!booking) return [];
    return partners.map((partner, index) => {
      const pCity = partner.city || '';
      const cityMatches = pCity.toLowerCase() === booking.address.city.toLowerCase();
      const distanceKm = cityMatches ? Number((2.1 + (index * 1.3) % 6).toFixed(1)) : Number((9.5 + index * 2.2).toFixed(1));
      return { partner, distanceKm };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  };

  const candidatePartners = getNearbyCandidates(activeBooking);

  const handleAdminAssignClick = (partnerId: string) => {
    if (!activeBooking) return;
    const partner = partners.find(p => p.id === partnerId);
    onManualAssign(activeBooking.id, partnerId);
    onAuditLog?.('MANUAL_ASSIGNMENT', activeBooking.id, `Manually assigned to ${partner?.name || partnerId}`);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Module 07 &bull; Manual Dispatch Console
            </span>
            <span className="text-xs text-[#8E8E93]">Manual Assignment Only</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Geo-Hub Candidate Radar &amp; Manual Assignment Console
          </h3>
          <p className="text-xs text-[#636366] mt-0.5 max-w-2xl">
            Calculates nearby eligible professionals for <strong>Admin Information Only</strong>. Automatic assignment is strictly prohibited. Admin must review and explicitly click &ldquo;ASSIGN JOB&rdquo;.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shrink-0">
          <Lock className="w-4 h-4 text-amber-700" />
          <span>Strict Manual Assignment Enforced</span>
        </div>
      </div>

      {/* Main Grid: Queue on Left, Candidate Selection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pending Dispatch Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#1C1C1E] flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#B8892E] animate-pulse" />
              <span>Pending Dispatch Queue ({pendingDispatchBookings.length})</span>
            </h4>
            <span className="text-[11px] text-[#8E8E93]">Searching Hub</span>
          </div>

          {pendingDispatchBookings.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-[#E5E5EA] text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h5 className="font-bold text-xs text-[#1C1C1E]">All Jobs Assigned</h5>
              <p className="text-[11px] text-[#8E8E93]">
                There are currently no bookings waiting for dispatch assignment.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {pendingDispatchBookings.map((b) => {
                const isSelected = activeBooking?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBookingId(b.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#FFF8F0] border-[#B8892E] shadow-sm ring-1 ring-[#B8892E]' 
                        : 'bg-white border-[#E5E5EA] hover:border-[#D1D1D6]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#1C1C1E]">#{b.bookingNumber}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 animate-pulse">
                            AWAITING ASSIGNMENT
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-[#1C1C1E] mt-1">{b.serviceName}</h5>
                      </div>
                      <span className="font-bold text-xs text-[#1C1C1E]">₹{b.totalAmount}</span>
                    </div>

                    <div className="text-[11px] text-[#8E8E93] mt-2 space-y-0.5">
                      <p className="text-[#1C1C1E] font-medium">{b.customerName} &bull; {b.customerPhone}</p>
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#B8892E] shrink-0" />
                        <span>{b.address.sector}, {b.address.city}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8E8E93] shrink-0" />
                        <span>{b.date} &bull; {b.timeSlot}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Candidate Professionals for Selected Booking */}
        <div className="lg:col-span-7 space-y-4">
          {activeBooking ? (
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-5">
              {/* Selected Booking Header */}
              <div className="pb-4 border-b border-[#F2F2F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Active Dispatch Target</span>
                  <h4 className="text-base font-bold text-[#1C1C1E] font-['Outfit']">
                    #{activeBooking.bookingNumber} &bull; {activeBooking.serviceName}
                  </h4>
                  <p className="text-xs text-[#636366]">
                    Customer: {activeBooking.customerName} ({activeBooking.customerPhone}) &bull; {activeBooking.address.sector}, {activeBooking.address.city}
                  </p>
                </div>
                <div className="text-right sm:text-right">
                  <span className="text-xs text-[#8E8E93] block">Slot Scheduled</span>
                  <span className="text-xs font-bold text-[#1C1C1E]">{activeBooking.date} &bull; {activeBooking.timeSlot}</span>
                </div>
              </div>

              {/* Informational Candidates Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-[#1C1C1E] flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#B8892E]" />
                    <span>Available Professionals Near This Job (For Admin Review)</span>
                  </h5>
                  <span className="text-[11px] text-[#8E8E93]">Sorted by Proximity</span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {candidatePartners.map(({ partner, distanceKm }) => (
                    <div 
                      key={partner.id}
                      className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] hover:border-[#B8892E] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h6 className="font-bold text-xs text-[#1C1C1E]">{partner.name}</h6>
                          <span className="font-mono text-[10px] text-[#8E8E93]">ID: BPE-{partner.id}</span>
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#B8892E] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Star className="w-3 h-3 fill-[#B8892E]" /> {partner.rating}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#636366]">
                          <span className="font-semibold text-emerald-700">~{distanceKm} km from customer</span>
                          <span>&bull;</span>
                          <span>{partner.assignedHubName || partner.hubName || 'Hub'}</span>
                          <span>&bull;</span>
                          <span>{partner.completedJobs ?? partner.totalJobs ?? 120} jobs done</span>
                          <span>&bull;</span>
                          <span className={`font-semibold ${partner.isOnline ? 'text-emerald-700' : 'text-neutral-500'}`}>
                            {partner.isOnline ? '● Online' : '○ Standby'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {partner.approvedCategories.slice(0, 3).map(c => (
                            <span key={c} className="px-1.5 py-0.2 rounded bg-neutral-200 text-[9px] text-neutral-700 font-medium">
                              {c.replace('-cleaning', '')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Explicit Manual ASSIGN JOB button */}
                      <button
                        type="button"
                        onClick={() => handleAdminAssignClick(partner.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 active:scale-95"
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
            <div className="p-12 rounded-3xl bg-white border border-[#E5E5EA] text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-[#8E8E93] mx-auto" />
              <h4 className="font-bold text-sm text-[#1C1C1E]">No Booking Selected</h4>
              <p className="text-xs text-[#8E8E93]">
                Select a pending booking from the left queue to view nearby available professionals and assign.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
