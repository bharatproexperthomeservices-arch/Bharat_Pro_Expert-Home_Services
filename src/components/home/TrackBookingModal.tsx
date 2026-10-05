import React, { useState } from 'react';
import { X, Search, CheckCircle2, Clock, Phone, MapPin, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { Booking } from '../../types';
import { getAllBookings } from '../../services/dbService';

interface TrackBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveTrackingModal: (booking: Booking) => void;
}

export const TrackBookingModal: React.FC<TrackBookingModalProps> = ({
  isOpen,
  onClose,
  onOpenLiveTrackingModal
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundBookings, setFoundBookings] = useState<Booking[] | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQ = query.trim();
    if (!cleanQ) {
      setError('Please enter a Booking ID or 10-digit Mobile Number.');
      return;
    }

    setLoading(true);
    setError(null);
    setFoundBookings(null);

    try {
      const all = await getAllBookings();
      const cleanDigits = cleanQ.replace(/\D/g, '');

      const matches = all.filter(b => {
        // Direct ID match
        if (b.id && b.id.toLowerCase() === cleanQ.toLowerCase()) return true;
        // Booking Number match
        if (b.bookingNumber && b.bookingNumber.toLowerCase().includes(cleanQ.toLowerCase())) return true;
        // Phone number match (10 digits)
        if (cleanDigits.length >= 10 && b.customerPhone && b.customerPhone.replace(/\D/g, '').includes(cleanDigits)) return true;
        return false;
      });

      if (matches.length === 0) {
        setError(`No bookings found for "${cleanQ}". Please verify your Booking ID or mobile number.`);
      } else {
        setFoundBookings(matches);
      }
    } catch (err: any) {
      setError('Failed to fetch booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">Job Completed</span>;
      case 'STARTED':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">Cleaning In Progress</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">Arrived at Location</span>;
      case 'ON_THE_WAY':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">Partner On The Way</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold">Specialist Assigned</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold animate-pulse">Finding Best Specialist</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] font-['Inter',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Track Your Service Booking</h3>
              <p className="text-[11px] text-slate-500">Live professional assignment, ETA &amp; start OTP</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 px-6 border-b border-slate-100 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Enter Booking ID (e.g. BPE-1001) or 10-digit Mobile..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#062040] hover:bg-[#04162C] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <p className="text-[11px] text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-200">
              {error}
            </p>
          )}
        </div>

        {/* Results Container */}
        <div className="p-4 px-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/30">
          {!foundBookings && !loading && (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <span className="text-4xl block">🔍</span>
              <p className="text-xs font-medium text-slate-500">
                Aapne jo service book ki hai uska Booking ID (jaise <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">BPE-1001</code>) ya 10-digit mobile number enter karke track karein.
              </p>
            </div>
          )}

          {foundBookings && foundBookings.map((bk) => (
            <div 
              key={bk.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-500/50 transition-all shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                    #{bk.bookingNumber || bk.id}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{bk.serviceName}</h4>
                  <p className="text-[11px] text-slate-500">
                    📅 {bk.date} &bull; ⏱️ {bk.timeSlot}
                  </p>
                </div>
                <div>{getStatusBadge(bk.status)}</div>
              </div>

              {/* Specialist Info */}
              {bk.assignedPartnerName ? (
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {bk.assignedPartnerName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {bk.assignedPartnerName}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Background Verified Specialist
                      </span>
                    </div>
                  </div>
                  {bk.assignedPartnerPhone && (
                    <a
                      href={`tel:${bk.assignedPartnerPhone}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-blue-700"
                    >
                      <Phone className="w-3 h-3" /> Call
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                  ⚡ Bharat Pro Dispatch Engine is allocating the highest rated specialist in your hub.
                </div>
              )}

              {/* Start OTP & Live Tracking Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-500">Start OTP: </span>
                  <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    {bk.startOtp || '****'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenLiveTrackingModal(bk);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#071E36] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
