import React, { useState } from 'react';
import { Booking, CustomerUser } from '../types';
import { BharatProLogo } from './BharatProLogo';
import { 
  User, 
  Clock, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Star, 
  Bell, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  AlertCircle,
  FileText,
  Phone,
  LogOut,
  ChevronRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface CustomerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onSignOut: () => void;
  myBookings: Booking[];
  onTrackBooking: (booking: Booking) => void;
}

export const CustomerDashboardModal: React.FC<CustomerDashboardModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onSignOut,
  myBookings,
  onTrackBooking
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'addresses' | 'payments' | 'reviews' | 'notifications'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const filteredBookings = myBookings.filter(b => {
    if (bookingFilter === 'upcoming') {
      return b.status !== 'COMPLETED' && b.status !== 'CANCELLED';
    }
    if (bookingFilter === 'completed') {
      return b.status === 'COMPLETED';
    }
    if (bookingFilter === 'cancelled') {
      return b.status === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-[#E2E8F0] overflow-hidden relative my-auto animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col font-['Inter',sans-serif]"
      >
        {/* Top Header */}
        <div className="p-4 px-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
            <BharatProLogo size="md" />
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0B2A4A] text-white flex items-center justify-center font-bold text-xs">
                {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0B2A4A]">
                  {profile?.name || user?.email?.split('@')[0] || 'Customer Account'}
                </h3>
                <span className="text-[10px] text-gray-500">{user?.email || 'bharatproexpert@gmail.com'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-[#0B2A4A] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] px-6 gap-6 text-xs font-bold text-[#0B2A4A] overflow-x-auto shrink-0 bg-[#F8FAFC]">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'bookings' ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' : 'text-gray-400 hover:text-[#0B2A4A]'
            }`}
          >
            My Bookings ({myBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile' ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' : 'text-gray-400 hover:text-[#0B2A4A]'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'addresses' ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' : 'text-gray-400 hover:text-[#0B2A4A]'
            }`}
          >
            Saved Addresses
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payments' ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' : 'text-gray-400 hover:text-[#0B2A4A]'
            }`}
          >
            Payments &amp; Receipts
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews' ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' : 'text-gray-400 hover:text-[#0B2A4A]'
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notifications' ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' : 'text-gray-400 hover:text-[#0B2A4A]'
            }`}
          >
            Notifications
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {successToast && (
            <div className="p-3 rounded-xl bg-[#EBF8EE] border border-[#C6ECD2] text-[#2FA84F] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* TAB 1: MY BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setBookingFilter(filter)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                        bookingFilter === filter 
                          ? 'bg-[#0B2A4A] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-400">{filteredBookings.length} order(s)</span>
              </div>

              {filteredBookings.length > 0 ? (
                <div className="space-y-3">
                  {filteredBookings.map(bk => (
                    <div 
                      key={bk.id} 
                      className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B2A4A]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#0B2A4A]">#{bk.bookingNumber || bk.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            bk.status === 'COMPLETED' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : bk.status === 'CANCELLED' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {bk.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#0B2A4A]">{bk.serviceName}</h4>
                        <div className="text-xs text-gray-500 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {bk.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {bk.timeSlot}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {bk.address.city}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0">
                        <div className="text-base font-black text-[#0B2A4A]">
                          ₹{bk.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              onClose();
                              onTrackBooking(bk);
                            }}
                            className="px-4 py-2 rounded-full bg-[#0B2A4A] hover:bg-[#071E36] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>Live Tracking</span>
                            <ArrowRight className="w-3 h-3 text-[#F5A400]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 space-y-2">
                  <Clock className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-sm font-semibold">No bookings found in this category.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-md space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B2A4A]">Full Name</label>
                <input
                  type="text"
                  defaultValue={profile?.name || 'Customer'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold outline-none focus:border-[#0B2A4A]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B2A4A]">Email Address</label>
                <input
                  type="email"
                  disabled
                  defaultValue={user?.email || 'customer@gmail.com'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B2A4A]">Mobile Number</label>
                <input
                  type="tel"
                  defaultValue={profile?.phone || '8920252647'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold outline-none focus:border-[#0B2A4A]"
                />
              </div>

              <button
                onClick={() => showToast('Profile details updated successfully!')}
                className="px-6 py-2.5 rounded-full bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#071E36] transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0B2A4A]">Home (Primary)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Default</span>
                  </div>
                  <p className="text-xs text-gray-600">Flat 602, Tower B, Palm Springs Residency, DLF Phase 5, Gurugram, Haryana - 122002</p>
                </div>
                <button 
                  onClick={() => showToast('Address copied')} 
                  className="text-xs font-bold text-[#0B2A4A] hover:underline"
                >
                  Edit
                </button>
              </div>

              <button
                onClick={() => showToast('New address form opened')}
                className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-xs font-bold text-[#0B2A4A] hover:border-[#0B2A4A] transition-all cursor-pointer"
              >
                + Add New Address
              </button>
            </div>
          )}

          {/* TAB 4: PAYMENTS & RECEIPTS */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              {myBookings.map(bk => (
                <div key={bk.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#0B2A4A] flex items-center gap-2">
                      <span>Invoice for #{bk.bookingNumber || bk.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        bk.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {bk.paymentStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">{bk.date} &bull; {bk.paymentMethod || 'UPI'}</div>
                    {bk.transactionId && (
                      <div className="text-[10px] text-gray-400 font-mono">Txn ID: {bk.transactionId}</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="font-extrabold text-xs text-[#0B2A4A]">₹{bk.totalAmount}</span>
                    <button
                      onClick={() => showToast(`Invoice #${bk.bookingNumber} downloaded`)}
                      className="px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 text-xs font-bold text-[#0B2A4A] flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="p-6 text-center text-gray-500 space-y-2">
              <Star className="w-8 h-8 text-[#F5A400] mx-auto fill-[#F5A400]" />
              <div className="text-xs font-bold text-[#0B2A4A]">Your Verified Reviews</div>
              <p className="text-xs text-gray-400">You haven&apos;t left any pending reviews. Rate your completed service anytime from the tracking screen!</p>
            </div>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-[#EEF7FD] border border-[#D0E7F9] flex items-start gap-3">
                <Bell className="w-4 h-4 text-[#0B2A4A] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#0B2A4A]">Festive Cleaning Discount Active</div>
                  <p className="text-[11px] text-gray-600">Use code BHARATPRO20 or SHINE300 to claim your special savings on your next booking.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
