import React, { useState } from 'react';
import { Booking, BookingPriceSnapshot } from '../../types';
import { updateBookingStatusWithOtp } from '../../services/dbService';
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
  Gift
} from 'lucide-react';

interface AdminBookingsTabProps {
  bookings: Booking[];
  onRefresh: () => void;
}

export const AdminBookingsTab: React.FC<AdminBookingsTabProps> = ({
  bookings,
  onRefresh
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectBooking, setInspectBooking] = useState<Booking | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const filtered = bookings.filter(b => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSearch = 
      b.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.serviceName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
        if (inspectBooking && inspectBooking.id === bookingId) {
          setInspectBooking(res.booking || null);
        }
      } else {
        alert(`Override failed: ${res.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">CONFIRMED</span>;
      case 'PARTNER_ASSIGNED':
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">PARTNER ASSIGNED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] animate-pulse">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-bold text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6" id="admin-bookings-tab">
      {/* Top Header */}
      <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase">
              Dispatch &amp; Orders
            </span>
            <span className="text-xs text-[#8E8E93]">Cleaning Service Appointments</span>
          </div>
          <h2 className="text-lg font-bold font-['Outfit'] text-[#1C1C1E]">
            Bookings &amp; Frozen Price Snapshots
          </h2>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'CONFIRMED', 'PARTNER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white border border-[#E5E5EA] text-[#48484A] hover:bg-[#F2F2F7]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, booking number, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D1D1D6] bg-white text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#E07B1A]"
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#E5E5EA] text-sm text-[#8E8E93]">
            No bookings found matching current filters.
          </div>
        ) : (
          filtered.map((b) => {
            const snap = b.priceSnapshot;
            const refPrice = snap?.referencePrice || Math.round(b.basePrice / 0.85);
            const savings = snap?.customerSavings || (refPrice - b.basePrice);

            return (
              <div 
                key={b.id} 
                className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm hover:border-[#D1D1D6] transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2F2F7]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#E07B1A] bg-[#FFF8F0] px-2.5 py-1 rounded-lg border border-[#E0B050]/40">
                      #{b.bookingNumber}
                    </span>
                    {getStatusBadge(b.status)}
                    <span className="text-xs text-[#8E8E93]">
                      Placed {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectBooking(b)}
                      className="px-3 py-1.5 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5 transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[#E07B1A]" />
                      <span>Price Snapshot</span>
                    </button>

                    {b.status === 'PARTNER_ASSIGNED' && (
                      <button
                        type="button"
                        onClick={() => handleMasterBypass(b.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Bypass Start OTP</span>
                      </button>
                    )}

                    {b.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        onClick={() => handleMasterBypass(b.id, 'COMPLETED')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Bypass End OTP</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Customer Info */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#8E8E93] uppercase">Customer &amp; Location</span>
                    <h4 className="font-bold text-[#1C1C1E] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#8E8E93]" /> {b.customerName}
                    </h4>
                    <p className="text-[#48484A] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#8E8E93]" /> {b.customerPhone}
                    </p>
                    <p className="text-[#8E8E93] flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#8E8E93] shrink-0" /> {b.address.street}, {b.address.sector}, {b.address.city}
                    </p>
                  </div>

                  {/* Service & Schedule */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#8E8E93] uppercase">Service &amp; Slot</span>
                    <h4 className="font-bold text-[#1C1C1E]">{b.serviceName}</h4>
                    <p className="text-[#48484A] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8E8E93]" /> {b.date} &bull; {b.timeSlot}
                    </p>
                    {b.assignedPartnerName ? (
                      <p className="text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Partner: {b.assignedPartnerName}
                      </p>
                    ) : (
                      <p className="text-amber-600 font-semibold">Awaiting Dispatch Assignment</p>
                    )}
                  </div>

                  {/* Financial & 15% Transparent Discount Breakdown */}
                  <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[#8E8E93]">Total Amount:</span>
                      <span className="text-sm font-black text-[#1C1C1E]">₹{b.totalAmount}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#8E8E93]">Benchmark Ref:</span>
                      <span className="text-[#8E8E93] line-through">₹{refPrice}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-emerald-700 font-bold">15% Savings:</span>
                      <span className="text-emerald-700 font-bold">Saved ₹{savings}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-[#E5E5EA]">
                      <span className="text-[#8E8E93]">Payment:</span>
                      <span className="font-semibold text-[#1C1C1E]">{b.paymentMethod} ({b.paymentStatus})</span>
                    </div>
                  </div>
                </div>

                {/* Bumper Offer or Addons */}
                {(b.unlockedBumperOffer || (b.selectedAddons && b.selectedAddons.length > 0)) && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F2F2F7]">
                    {b.unlockedBumperOffer && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#E07B1A]/10 text-[#E07B1A] font-bold text-[10px] flex items-center gap-1">
                        <Gift className="w-3 h-3" /> Unlocked Free Bumper: {b.unlockedBumperOffer}
                      </span>
                    )}
                    {b.selectedAddons?.map(a => (
                      <span key={a.id} className="px-2.5 py-0.5 rounded-lg bg-neutral-100 text-neutral-700 font-medium text-[10px]">
                        + {a.name} (₹{a.price})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Immutable Frozen Price Snapshot Inspector */}
      {inspectBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#E5E5EA] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#E07B1A]" />
                <h3 className="text-base font-bold text-[#1C1C1E]">
                  Frozen Price Snapshot
                </h3>
              </div>
              <button
                onClick={() => setInspectBooking(null)}
                className="p-1 rounded-full hover:bg-[#F2F2F7]"
              >
                <X className="w-4 h-4 text-[#8E8E93]" />
              </button>
            </div>

            <div className="space-y-1 text-xs text-[#8E8E93]">
              <p>Booking Number: <strong className="text-[#1C1C1E]">#{inspectBooking.bookingNumber}</strong></p>
              <p>Service: <strong className="text-[#1C1C1E]">{inspectBooking.serviceName}</strong></p>
              <p>Locked at: <strong className="text-[#1C1C1E]">{new Date(inspectBooking.createdAt).toLocaleString()}</strong></p>
            </div>

            {/* Snapshot Values Card */}
            <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#E0B050] space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#48484A]">Market Reference Baseline:</span>
                <span className="font-bold text-[#1C1C1E]">
                  ₹{inspectBooking.priceSnapshot?.referencePrice || Math.round(inspectBooking.basePrice / 0.85)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#48484A]">Standard Customer Discount:</span>
                <span className="font-bold text-emerald-700">
                  {inspectBooking.priceSnapshot?.discountPct || 15}% Transparent Savings
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#48484A]">Customer Direct Savings:</span>
                <span className="font-black text-[#1F8A3B]">
                  ₹{inspectBooking.priceSnapshot?.customerSavings || (Math.round(inspectBooking.basePrice / 0.85) - inspectBooking.basePrice)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E0B050]/40">
                <span className="text-[#48484A]">Bharat Pro Base Price:</span>
                <span className="font-bold text-[#1C1C1E]">₹{inspectBooking.basePrice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#48484A]">Add-ons Total:</span>
                <span className="font-bold text-[#1C1C1E]">₹{inspectBooking.addonsPrice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#48484A]">Taxes (18% GST):</span>
                <span className="font-bold text-[#1C1C1E]">₹{inspectBooking.taxesGst}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#48484A]">Safety &amp; Platform Fee:</span>
                <span className="font-bold text-[#1C1C1E]">₹{inspectBooking.convenienceFee}</span>
              </div>
              {inspectBooking.discount > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span>Coupon Promo Discount:</span>
                  <span>-₹{inspectBooking.discount}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-[#E0B050] text-sm">
                <span className="font-bold text-[#1C1C1E]">Customer Paid Total:</span>
                <span className="font-black text-[#E07B1A]">₹{inspectBooking.totalAmount}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F9FB] border border-[#E5E5EA] text-[11px] text-[#8E8E93] space-y-1">
              <p>Security Audit: This snapshot is immutable and stored with the booking contract to prevent any retrospective price disputes.</p>
              <p>Pricing Engine Version: <strong>{inspectBooking.priceSnapshot?.priceVersion || 'v1.0.0'}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
