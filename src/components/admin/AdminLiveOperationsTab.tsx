import React, { useState } from 'react';
import { 
  Activity, 
  MapPin, 
  Clock, 
  Phone, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  Filter,
  Search,
  UserCheck
} from 'lucide-react';
import { Booking, Partner } from '../../types';

interface AdminLiveOperationsTabProps {
  bookings: Booking[];
  partners: Partner[];
  onSelectBooking?: (booking: Booking) => void;
}

export const AdminLiveOperationsTab: React.FC<AdminLiveOperationsTabProps> = ({
  bookings,
  partners,
  onSelectBooking
}) => {
  const [filterCity, setFilterCity] = useState<'ALL' | 'Gurugram' | 'Patna' | 'Ranchi'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredBookings = bookings.filter(b => {
    const city = b.address?.city || 'Gurugram';
    const matchesCity = filterCity === 'ALL' || city.toLowerCase().includes(filterCity.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesCity && matchesStatus;
  });

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="bg-[#0F172A] text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Live Operations &bull; National Booking Floor
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time live queue: incoming bookings, atomic broadcasts, technician transit, Diversey sanitization SLA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
            {filteredBookings.filter(b => b.status !== 'COMPLETED' && !b.status.startsWith('CANCELLED')).length} ACTIVE JOBS
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Filter Hub:</span>
          {(['ALL', 'Gurugram', 'Patna', 'Ranchi'] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterCity(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterCity === c
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNMENT_PENDING">Pending Assignment</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ON_THE_WAY">En Route / On The Way</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Live Operational Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookings.map((b) => {
          const assignedPartner = partners.find(p => p.id === b.assignedPartnerId);
          const isPending = b.status === 'PENDING' || b.status === 'ASSIGNMENT_PENDING' || b.status === 'SEARCHING_PROFESSIONAL';
          const isEnRouteOrActive = b.status === 'ON_THE_WAY' || b.status === 'PARTNER_ON_THE_WAY' || b.status === 'IN_PROGRESS' || b.status === 'STARTED';
          const isCompleted = b.status === 'COMPLETED' || b.status === 'SETTLED' || b.status === 'SETTLEMENT_PROCESSING';
          const isCancelled = b.status.startsWith('CANCELLED');

          return (
            <div 
              key={b.id} 
              className={`p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between space-y-4 ${
                isPending 
                  ? 'bg-amber-50/60 border-amber-200' 
                  : isEnRouteOrActive
                  ? 'bg-blue-50/60 border-blue-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-900">
                    {b.bookingNumber || b.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : isCancelled
                      ? 'bg-rose-100 text-rose-800'
                      : isPending
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{b.serviceName}</h4>
                <div className="text-xs text-slate-600 space-y-1 mt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{b.address?.street ? `${b.address.street}, ${b.address.city}` : b.address?.city || 'Gurugram Sector'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Slot: {b.date} &bull; {b.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 pt-1">
                    <span>₹{b.totalAmount}</span>
                    <span className="text-[10px] font-normal text-emerald-700 font-mono">
                      (Payment: {b.paymentStatus || 'PAID'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Technician and Actions */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {assignedPartner ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                        {assignedPartner.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">{assignedPartner.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{assignedPartner.phone}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Unassigned
                    </span>
                  )}
                </div>

                {onSelectBooking && (
                  <button
                    onClick={() => onSelectBooking(b)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                  >
                    Details
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminLiveOperationsTab;
