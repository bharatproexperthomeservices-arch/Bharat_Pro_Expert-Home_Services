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
  RotateCcw,
  Tag,
  Wallet,
  Gift,
  Copy,
  ExternalLink
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
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'addresses' | 'payments' | 'offers' | 'reviews' | 'notifications'>('bookings');
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
            Profile &amp; Account
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
            onClick={() => setActiveTab('offers')}
            className={`py-3 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'offers' ? 'border-b-2 border-[#0B2A4A] text-[#0B2A4A]' : 'text-gray-400 hover:text-[#0B2A4A]'
            }`}
          >
            Offers &amp; Wallet
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
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {bk.address?.city || 'Gurugram'}</span>
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

          {/* TAB 2: PROFILE & UNIFIED ACCOUNT */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl space-y-5">
              {/* Premium Customer Identity Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B2A4A] via-[#0E355D] to-[#071E36] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4A24E]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {profile?.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt={profile?.name || 'Customer'} 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4A24E] shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-[#D4A24E] text-[#D4A24E] font-black text-2xl flex items-center justify-center shadow-md">
                        {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4A24E] bg-[#D4A24E]/20 px-2 py-0.5 rounded-md">
                          Verified Customer
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">
                          {profile?.status || 'ACTIVE'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {profile?.name || user?.displayName || 'Valued Customer'}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                        <span className="text-slate-400">ID:</span>
                        <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded select-all">
                          {profile?.customerId || 'BPE-CUST-100245'}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(profile?.customerId || 'BPE-CUST-100245');
                            showToast('Customer ID copied to clipboard!');
                          }}
                          className="p-1 hover:text-[#D4A24E] transition-colors cursor-pointer"
                          title="Copy Customer ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Wallet & Cashback Balance */}
                  <div className="bg-white/10 border border-white/15 rounded-xl p-3.5 sm:text-right shrink-0 backdrop-blur-sm">
                    <span className="text-[10px] text-slate-300 font-medium block flex items-center gap-1 sm:justify-end">
                      <Wallet className="w-3 h-3 text-[#D4A24E]" />
                      BPE Cashback Wallet
                    </span>
                    <span className="text-xl font-black text-[#D4A24E] tracking-tight">
                      ₹{profile?.walletBalance ?? 250}
                    </span>
                    <span className="text-[10px] text-emerald-300 block font-semibold">
                      ● Active for next booking
                    </span>
                  </div>
                </div>

                {/* Identity Badges: Google & Mobile */}
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Google Status */}
                  <div className="bg-black/20 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span className="font-semibold text-slate-200">Google:</span>
                    </div>
                    {profile?.googleLinked || profile?.googleProviderId || user?.providerData?.some((p: any) => p.providerId === 'google.com') ? (
                      <span className="font-bold text-[#D4A24E] bg-[#D4A24E]/20 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#D4A24E]" />
                        Connected
                      </span>
                    ) : (
                      <span className="font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded text-[11px]">
                        Not Connected
                      </span>
                    )}
                  </div>

                  {/* Mobile Status */}
                  <div className="bg-black/20 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-slate-200">Mobile:</span>
                    </div>
                    {profile?.mobileVerified || profile?.phone ? (
                      <span className="font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                        Verified
                      </span>
                    ) : (
                      <span className="font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded text-[11px]">
                        Not Verified
                      </span>
                    )}
                  </div>

                  {/* Login Provider */}
                  <div className="bg-black/20 rounded-xl p-2.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Method:</span>
                    <span className="font-bold text-white uppercase text-[10px] bg-white/10 px-2 py-0.5 rounded tracking-wider">
                      {profile?.loginProvider === 'google_and_mobile' 
                        ? 'Google + Mobile' 
                        : profile?.loginProvider === 'google' 
                        ? 'Google' 
                        : 'Mobile OTP'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details Form */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B2A4A]">
                  Profile Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0B2A4A]">Full Name</label>
                    <input
                      type="text"
                      defaultValue={profile?.name || user?.displayName || 'Valued Customer'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold outline-none focus:border-[#0B2A4A] focus:ring-1 focus:ring-[#0B2A4A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0B2A4A] flex items-center justify-between">
                      <span>Mobile Number</span>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {profile?.mobileVerified ? '● Verified' : '● Verification Pending'}
                      </span>
                    </label>
                    <input
                      type="tel"
                      defaultValue={profile?.phone ? (profile.phone.startsWith('+91') ? profile.phone : `+91 ${profile.phone}`) : '+91 8920252647'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold outline-none focus:border-[#0B2A4A] focus:ring-1 focus:ring-[#0B2A4A]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-[#0B2A4A] flex items-center justify-between">
                      <span>Email Address</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {profile?.googleLinked ? '● Synced with Google Account' : '● Standard Email'}
                      </span>
                    </label>
                    <input
                      type="email"
                      defaultValue={profile?.email || user?.email || 'customer@bharatproexpert.com'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold outline-none focus:border-[#0B2A4A] focus:ring-1 focus:ring-[#0B2A4A]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => showToast('Profile details updated successfully!')}
                    className="px-6 py-2.5 rounded-full bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#071E36] transition-all cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('addresses')}
                      className="px-4 py-2 rounded-full border border-gray-300 text-xs font-semibold text-[#0B2A4A] hover:bg-gray-50 cursor-pointer"
                    >
                      Manage Addresses
                    </button>
                    <button
                      onClick={() => {
                        onSignOut();
                        onClose();
                      }}
                      className="px-4 py-2 rounded-full border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
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

          {/* TAB: OFFERS & WALLET */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              {/* Wallet Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0B2A4A] to-[#164273] text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-[#D4A24E]/40 text-[#D4A24E] flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-300 uppercase tracking-widest font-extrabold block">
                      Bharat Pro Wallet Balance
                    </span>
                    <h3 className="text-2xl font-black text-[#D4A24E]">
                      ₹{profile?.walletBalance ?? 250}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                    Auto-Applied on Checkout
                  </span>
                </div>
              </div>

              {/* Exclusive Promo Coupons */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#0B2A4A] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#D4A24E]" />
                  <span>Available Coupons &amp; Instant Discounts</span>
                </h4>

                <div className="p-4 rounded-xl border-2 border-dashed border-[#D4A24E] bg-gradient-to-r from-amber-50 to-orange-50 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#0B2A4A] bg-[#D4A24E]/30 px-3 py-1 rounded-lg border border-[#D4A24E]/60 shadow-xs">
                        BHARAT10
                      </span>
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        10% OFF Active
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('BHARAT10');
                        showToast('Coupon BHARAT10 copied!');
                      }}
                      className="text-xs font-bold text-[#0B2A4A] hover:underline flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-xs cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </button>
                  </div>
                  <h5 className="text-sm font-black text-[#0B2A4A]">Flat 10% Instant Discount (Only 10% Discount)</h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Get an instant 10% discount on every cleaning service booked across India. Use promo code <b>BHARAT10</b> at checkout.
                  </p>
                </div>
              </div>
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
