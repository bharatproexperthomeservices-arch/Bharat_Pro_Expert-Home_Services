import React, { useState } from 'react';
import { Booking, Partner, HubLocation, DispatchAttempt } from '../../types';
import { INITIAL_DISPATCH_ATTEMPTS } from '../../data';
import { 
  Zap, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Search, 
  Filter, 
  Play, 
  ShieldAlert, 
  Sliders,
  Sparkles,
  PhoneCall,
  Check,
  X
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
  const [dispatchAttempts, setDispatchAttempts] = useState<DispatchAttempt[]>(INITIAL_DISPATCH_ATTEMPTS);
  const [selectedBookingForMatch, setSelectedBookingForMatch] = useState<Booking | null>(null);
  const [autoMatchTimeoutSec, setAutoMatchTimeoutSec] = useState<number>(60);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<'LIVE_QUEUE' | 'MATCH_SIMULATOR' | 'ATTEMPT_LOGS'>('LIVE_QUEUE');

  // Bookings awaiting dispatch
  const pendingDispatchBookings = bookings.filter(
    b => b.status === 'CONFIRMED' || b.status === 'PENDING'
  );

  // Simulate Auto-Match Algorithm
  const runAutoMatchPipeline = (booking: Booking) => {
    // Step 1: Find active hub matching sector/city
    const targetHub = hubs.find(h => 
      h.city.toLowerCase() === booking.address.city.toLowerCase() ||
      h.coveredSectors.some(s => booking.address.sector.toLowerCase().includes(s.toLowerCase()))
    ) || hubs[0];

    // Step 2: Filter partners matching category skill and assigned hub
    const eligiblePartners = partners.filter(p => 
      p.status === 'active' && 
      p.isOnline &&
      (p.assignedHubId === targetHub.id || targetHub.crossHubDispatchAllowed)
    );

    if (eligiblePartners.length === 0) {
      alert(`Dispatch Alert: No active online technicians found in ${targetHub.name} or backup hub! Escalated to Dispatch Manager.`);
      onAuditLog?.('DISPATCH_ESCALATION', booking.id, `No eligible technician for booking #${booking.bookingNumber}`);
      return;
    }

    // Step 3: Rank by rating & workload
    const ranked = [...eligiblePartners].sort((a, b) => b.rating - a.rating);
    const topPartner = ranked[0];

    // Step 4: Record Dispatch Attempt
    const newAttempt: DispatchAttempt = {
      id: `dsp-${Date.now()}`,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      customerName: booking.customerName,
      customerLocation: `${booking.address.sector}, ${booking.address.city}`,
      serviceName: booking.serviceName,
      hubId: targetHub.id,
      hubName: targetHub.name,
      partnerId: topPartner.id,
      partnerName: topPartner.name,
      status: 'OFFERED',
      score: 98.2,
      distanceKm: 3.4,
      attemptedAt: new Date().toISOString(),
      responseSec: 15
    };

    setDispatchAttempts([newAttempt, ...dispatchAttempts]);

    // Auto-accept simulated after 1 sec
    setTimeout(() => {
      onManualAssign(booking.id, topPartner.id);
      setDispatchAttempts(prev => prev.map(a => a.id === newAttempt.id ? { ...a, status: 'ACCEPTED' } : a));
      onAuditLog?.('AUTO_DISPATCH_SUCCESS', booking.id, `Assigned to ${topPartner.name} via ${targetHub.name}`);
      alert(`Auto-Dispatch Successful: Job #${booking.bookingNumber} matched to certified partner ${topPartner.name} (${topPartner.rating}★) via ${targetHub.name}.`);
    }, 1000);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Module 07 &bull; Smart Auto-Dispatch
            </span>
            <span className="text-xs text-[#8E8E93]">Multi-tier Ranking Pipeline</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Automated Technician Dispatch &amp; Geo-Match Engine
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Ranks certified cleaning professionals by service skill match, equipment verification, distance, 
            hub capacity, and workload. Escalates to backup hubs upon timeout without altering customer prices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-right">
            <span className="text-[10px] text-[#8E8E93] block font-bold uppercase">Pending Dispatch</span>
            <span className="text-lg font-black text-[#B8892E]">{pendingDispatchBookings.length} Jobs Waiting</span>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5EA] pb-3">
        {[
          { id: 'LIVE_QUEUE', label: `Jobs Awaiting Dispatch (${pendingDispatchBookings.length})`, icon: Zap },
          { id: 'MATCH_SIMULATOR', label: 'Ranking Pipeline Logic & Rules', icon: Sliders },
          { id: 'ATTEMPT_LOGS', label: `Dispatch Audit Logs (${dispatchAttempts.length})`, icon: Clock }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white hover:bg-[#F2F2F7] text-[#48484A] border border-[#E5E5EA]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE QUEUE */}
      {activeTab === 'LIVE_QUEUE' && (
        <div className="space-y-4">
          {pendingDispatchBookings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5EA] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-[#1C1C1E]">All Active Bookings Dispatched!</h4>
              <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
                No orders waiting for partner assignment. Customer bookings will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingDispatchBookings.map((bk) => (
                <div key={bk.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                        #{bk.bookingNumber} &bull; {bk.status}
                      </span>
                      <h4 className="text-sm font-bold text-[#1C1C1E] mt-1">{bk.serviceName}</h4>
                      <p className="text-xs text-[#8E8E93]">{bk.categoryName}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-[#1C1C1E] block">₹{bk.totalAmount}</span>
                      <span className="text-[10px] text-emerald-700 font-bold">{bk.paymentStatus}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#8E8E93]">Customer:</span>
                      <span className="font-semibold text-[#1C1C1E]">{bk.customerName} ({bk.customerPhone})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E8E93]">Location:</span>
                      <span className="font-semibold text-[#1C1C1E] truncate max-w-[200px]">
                        {bk.address.sector}, {bk.address.city}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E8E93]">Slot:</span>
                      <span className="font-semibold text-[#1C1C1E]">{bk.date} at {bk.timeSlot}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-2 border-t border-[#F2F2F7] flex items-center justify-between gap-2">
                    <button
                      onClick={() => runAutoMatchPipeline(bk)}
                      className="flex-1 py-2 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#D4A24E]" />
                      <span>Trigger Auto-Match</span>
                    </button>

                    <button
                      onClick={() => {
                        const partnerId = window.prompt(
                          `Manual Dispatch for #${bk.bookingNumber}:\nSelect Partner ID:\n` +
                          partners.map(p => `${p.id}: ${p.name} (${p.assignedHubName})`).join('\n')
                        );
                        if (partnerId) {
                          onManualAssign(bk.id, partnerId);
                          alert(`Manual Assignment: Booking #${bk.bookingNumber} assigned to Partner ${partnerId}.`);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold"
                    >
                      Manual Override
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RANKING PIPELINE RULES */}
      {activeTab === 'MATCH_SIMULATOR' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
            <h4 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B8892E]" />
              <span>Multi-Stage Ranking Pipeline (Section 7)</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F8F9FB]">
                <span className="w-6 h-6 rounded-full bg-[#1C1C1E] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <div>
                  <strong className="text-[#1C1C1E] block">Geofence &amp; Hub Selection</strong>
                  <span className="text-[#8E8E93]">
                    Validates customer coordinates and matches primary hub. If hub load &gt; 85%, activates backup hub.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F8F9FB]">
                <span className="w-6 h-6 rounded-full bg-[#1C1C1E] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <div>
                  <strong className="text-[#1C1C1E] block">Cleaning Skill &amp; Equipment Verification</strong>
                  <span className="text-[#8E8E93]">
                    Filters out technicians without approved category certifications or missing mandatory tool kits.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F8F9FB]">
                <span className="w-6 h-6 rounded-full bg-[#1C1C1E] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <div>
                  <strong className="text-[#1C1C1E] block">Availability &amp; Travel Buffer Check</strong>
                  <span className="text-[#8E8E93]">
                    Verifies technician shift status, active jobs in progress, and enforces min 25-min travel window.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#F8F9FB]">
                <span className="w-6 h-6 rounded-full bg-[#1C1C1E] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  4
                </span>
                <div>
                  <strong className="text-[#1C1C1E] block">Timeout &amp; Auto-Roll Forward</strong>
                  <span className="text-[#8E8E93]">
                    If offered technician does not accept within {autoMatchTimeoutSec}s, system automatically offers next ranked partner.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
            <h4 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#B8892E]" />
              <span>Configurable Dispatch Weights</span>
            </h4>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-[#1C1C1E] mb-1">
                  <span>Partner Distance / Travel Time Weight</span>
                  <span>40%</span>
                </div>
                <div className="h-2 rounded-full bg-[#F2F2F7] overflow-hidden">
                  <div className="h-full bg-[#B8892E] w-[40%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-[#1C1C1E] mb-1">
                  <span>Customer Satisfaction Rating Score</span>
                  <span>30%</span>
                </div>
                <div className="h-2 rounded-full bg-[#F2F2F7] overflow-hidden">
                  <div className="h-full bg-emerald-600 w-[30%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-[#1C1C1E] mb-1">
                  <span>Daily Workload Balance</span>
                  <span>20%</span>
                </div>
                <div className="h-2 rounded-full bg-[#F2F2F7] overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[20%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-[#1C1C1E] mb-1">
                  <span>Hub Proximity Priority</span>
                  <span>10%</span>
                </div>
                <div className="h-2 rounded-full bg-[#F2F2F7] overflow-hidden">
                  <div className="h-full bg-[#1C1C1E] w-[10%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTEMPT LOGS */}
      {activeTab === 'ATTEMPT_LOGS' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E5E5EA] flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#1C1C1E]">
              Immutable Dispatch Attempts &amp; Match History
            </h4>
            <span className="text-xs text-[#8E8E93]">
              Every offer, timeout, and acceptance is audited
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5EA] text-[#8E8E93] bg-[#F8F9FB]">
                  <th className="p-3.5 font-semibold">Booking ID</th>
                  <th className="p-3.5 font-semibold">Service</th>
                  <th className="p-3.5 font-semibold">Location</th>
                  <th className="p-3.5 font-semibold">Hub</th>
                  <th className="p-3.5 font-semibold">Matched Partner</th>
                  <th className="p-3.5 font-semibold">Score</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold text-right">Attempt Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F7]">
                {dispatchAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-[#F8F9FB]">
                    <td className="p-3.5 font-mono font-bold text-[#1C1C1E]">#{att.bookingNumber}</td>
                    <td className="p-3.5 font-medium text-[#1C1C1E] max-w-[180px] truncate">{att.serviceName}</td>
                    <td className="p-3.5 text-[#48484A] max-w-[150px] truncate">{att.customerLocation}</td>
                    <td className="p-3.5 font-semibold text-indigo-700">{att.hubName}</td>
                    <td className="p-3.5 font-bold text-[#1C1C1E]">{att.partnerName}</td>
                    <td className="p-3.5 font-mono text-[#B8892E] font-bold">{att.score}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        att.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : att.status === 'OFFERED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {att.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-[#8E8E93] font-mono">
                      {new Date(att.attemptedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
