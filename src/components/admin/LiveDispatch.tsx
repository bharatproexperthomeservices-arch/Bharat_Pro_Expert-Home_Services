import React, { useState } from 'react';
import { Booking, Partner, HubLocation } from '../../types';
import { Activity, Radio, AlertTriangle, Users, ArrowRight, RefreshCw, Clock, CheckCircle2, PhoneCall, ShieldAlert } from 'lucide-react';

interface LiveDispatchProps {
  bookings: Booking[];
  partners: Partner[];
  hubs: HubLocation[];
  onManualAssign: (bookingId: string, partnerId: string) => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const LiveDispatch: React.FC<LiveDispatchProps> = ({
  bookings,
  partners,
  hubs,
  onManualAssign,
  onAuditLog
}) => {
  const unassignedBookings = bookings.filter(b => !b.assignedPartnerId || b.status === 'CONFIRMED' || b.status === 'SEARCHING_PROFESSIONAL');
  const activeJobs = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS' || b.status === 'PARTNER_ACCEPTED' || b.status === 'ARRIVED' || b.status === 'STARTED');

  return (
    <div className="space-y-6">
      {/* Control Room Banner */}
      <div className="p-6 bg-[#0B1220] rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wide mb-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>360° Live Operations &amp; Delay Escalation Center</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Live Operations &amp; Dispatch Queue</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time partner live tracking, delay detection alerts, unassigned queue &amp; emergency manual overrides.
          </p>
        </div>
      </div>

      {/* Grid: Dispatch Queue + Live Partner Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Unassigned Dispatch Queue */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Unassigned Dispatch Queue ({unassignedBookings.length})</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {unassignedBookings.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                All bookings are currently assigned to partners. Great job!
              </p>
            ) : (
              unassignedBookings.map(b => (
                <div key={b.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900">Booking #{b.bookingNumber || b.id}</span>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">{b.serviceName} &bull; &#8377;{b.priceSnapshot?.totalAmount || b.totalAmount}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                      {b.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60">
                    <span className="text-slate-500 font-mono">
                      {typeof b.address === 'string'
                        ? b.address
                        : b.address
                          ? `${b.address.street}, ${b.address.city}`
                          : 'Address provided at checkout'}
                    </span>
                    <select
                      onChange={(e) => {
                        const pid = e.target.value;
                        if (pid) {
                          onManualAssign(b.id, pid);
                          onAuditLog?.('MANUAL_ASSIGN', b.id, `Assigned to partner ${pid}`);
                        }
                      }}
                      className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                    >
                      <option value="">-- Assign Partner --</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.city || 'Gurugram'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Active Jobs & Delay Alerts */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Active Jobs &amp; Escalation Queue ({activeJobs.length})</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {activeJobs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No active jobs currently in progress.
              </p>
            ) : (
              activeJobs.map(b => (
                <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">Booking #{b.bookingNumber || b.id}</p>
                      <p className="text-[11px] text-slate-500">{b.serviceName} &bull; {b.customerName || 'Customer'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDispatch;
