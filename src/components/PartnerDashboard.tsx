import React, { useState, useEffect } from 'react';
import { Booking, Partner } from '../types';
import { 
  getAllBookings, 
  getPartnersList, 
  updateBookingStatusWithOtp,
  sendWhatsAppNotification 
} from '../services/dbService';
import { BharatProLogo } from './BharatProLogo';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  ArrowLeft, 
  KeyRound, 
  Navigation, 
  DollarSign, 
  User, 
  Star, 
  Award, 
  FileCheck, 
  Power, 
  Calendar, 
  MessageSquare,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface PartnerDashboardProps {
  onBackToCustomerSite: () => void;
}

type PartnerTab = 
  | 'ASSIGNED_JOBS'
  | 'TODAY'
  | 'UPCOMING'
  | 'COMPLETED'
  | 'EARNINGS'
  | 'PROFILE_KYC';

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ onBackToCustomerSite }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('prt-01');
  const [activeTab, setActiveTab] = useState<PartnerTab>('ASSIGNED_JOBS');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  // OTP input modal / form state
  const [otpBookingId, setOtpBookingId] = useState<string | null>(null);
  const [otpType, setOtpType] = useState<'START' | 'COMPLETION'>('START');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prts, bks] = await Promise.all([
        getPartnersList(),
        getAllBookings()
      ]);
      setPartners(prts);
      if (prts.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(prts[0].id);
      }
      setBookings(bks);
    } catch (e) {
      console.warn('Error loading partner dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Real-time listener for newly assigned jobs
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('bharatpro_booking_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('bharatpro_booking_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const currentPartner = partners.find(p => p.id === selectedPartnerId) || partners[0] || {
    id: 'prt-01',
    name: 'Rahul Kumar',
    phone: '+91 98110 44219',
    assignedHubId: 'hub-gurugram-cyber',
    hubName: 'Gurugram Central Hub',
    city: 'Gurugram',
    rating: 4.88,
    completedJobs: 342,
    approvedCategories: ['bathroom-cleaning', 'kitchen-cleaning', 'sofa-cleaning'],
    kycStatus: 'VERIFIED',
    isOnline: true,
    status: 'active'
  };

  // Filter jobs explicitly assigned by Admin to THIS partner
  // RULE: Partner must NOT receive jobs automatically. Only jobs with assignedPartnerId === currentPartner.id
  const assignedJobs = bookings.filter(b => b.assignedPartnerId === currentPartner.id);

  const newAssignedJobs = assignedJobs.filter(b => 
    b.status === 'ASSIGNED' || b.status === 'PARTNER_ASSIGNED'
  );
  
  const todayJobs = assignedJobs.filter(b => 
    b.status === 'ACCEPTED' || 
    b.status === 'ON_THE_WAY' || 
    b.status === 'PARTNER_ON_THE_WAY' || 
    b.status === 'ARRIVED' || 
    b.status === 'IN_PROGRESS' || 
    b.status === 'STARTED'
  );

  const completedJobs = assignedJobs.filter(b => b.status === 'COMPLETED');
  const cancelledJobs = assignedJobs.filter(b => b.status === 'CANCELLED');

  // Partner status transition actions
  const handlePartnerAction = async (
    bookingId: string, 
    targetStatus: Booking['status']
  ) => {
    setActionLoading(true);
    try {
      const res = await updateBookingStatusWithOtp(bookingId, targetStatus);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || 'Action failed.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle OTP verification to START or COMPLETE service
  const handleVerifyOtpSubmit = async () => {
    if (!otpBookingId) return;
    setOtpError(null);
    setActionLoading(true);

    try {
      const targetStatus = otpType === 'START' ? 'IN_PROGRESS' : 'COMPLETED';
      const res = await updateBookingStatusWithOtp(otpBookingId, targetStatus, enteredOtp);
      if (res.success) {
        alert(otpType === 'START' ? 'Start OTP Verified! Job has officially commenced.' : 'Completion OTP Verified! Job completed successfully.');
        setOtpBookingId(null);
        setEnteredOtp('');
        await loadData();
      } else {
        setOtpError(res.error || 'Invalid OTP code. Please check with customer.');
      }
    } catch {
      setOtpError('Network error verifying OTP.');
    } finally {
      setActionLoading(false);
    }
  };

  // Financial calculations for partner
  const totalEarned = completedJobs.reduce((sum, b) => {
    // Partner receives 80% net payout
    return sum + Math.round(b.totalAmount * 0.80);
  }, 0);

  const renderJobCard = (b: Booking) => {
    const isNewAssigned = b.status === 'ASSIGNED' || b.status === 'PARTNER_ASSIGNED';
    const isAccepted = b.status === 'ACCEPTED';
    const isOnTheWay = b.status === 'ON_THE_WAY' || b.status === 'PARTNER_ON_THE_WAY';
    const isArrived = b.status === 'ARRIVED';
    const isInProgress = b.status === 'IN_PROGRESS' || b.status === 'STARTED';
    const isFinished = b.status === 'COMPLETED';

    const cleanPhone = (b.customerPhone || '').replace(/\D/g, '');

    return (
      <div 
        key={b.id}
        className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4 hover:border-[#B8892E] transition-all"
      >
        {/* Card Top */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F2F2F7]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/5 text-[#1C1C1E]">
              #{b.bookingNumber}
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              isNewAssigned ? 'bg-amber-100 text-amber-900 animate-pulse' :
              isInProgress ? 'bg-purple-100 text-purple-900 animate-pulse' :
              isFinished ? 'bg-emerald-100 text-emerald-900' :
              'bg-blue-100 text-blue-900'
            }`}>
              {b.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#1C1C1E]">{b.date} &bull; {b.timeSlot}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Customer & Address */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider block">Customer Details</span>
            <h4 className="font-bold text-[#1C1C1E] text-sm flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#8E8E93]" /> {b.customerName}
            </h4>
            <p className="text-[#48484A] font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" /> {b.customerPhone}
            </p>
            <p className="text-[#636366] leading-relaxed flex items-start gap-1.5 pt-1">
              <MapPin className="w-4 h-4 text-[#B8892E] shrink-0 mt-0.5" />
              <span>{b.address.street}, {b.address.sector}, {b.address.city}</span>
            </p>
          </div>

          {/* Service & Financials */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider block">Service &amp; Payout</span>
            <h4 className="font-bold text-[#1C1C1E] text-sm">{b.serviceName}</h4>
            <div className="flex justify-between items-center pt-1 text-xs">
              <span className="text-[#8E8E93]">Customer Total:</span>
              <span className="font-bold text-[#1C1C1E]">₹{b.totalAmount} ({b.paymentMethod})</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-700 font-bold">Your Net Payout (80%):</span>
              <span className="font-black text-sm text-emerald-700">₹{Math.round(b.totalAmount * 0.80)}</span>
            </div>
            {b.assignedAt && (
              <p className="text-[11px] text-[#8E8E93] pt-1">
                Assigned by Admin: {new Date(b.assignedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Quick Communication & Map Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F2F2F7]">
          <a
            href={`tel:${b.customerPhone}`}
            className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-[#1C1C1E] flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Call Customer</span>
          </a>

          <a
            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${b.customerName}, I am ${currentPartner.name} from Bharat Pro Expert. I have been assigned to your booking #${b.bookingNumber}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </a>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.address.street}, ${b.address.sector}, ${b.address.city}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-800 flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Open GPS Route</span>
          </a>
        </div>

        {/* Status Flow Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          {/* ASSIGNED -> ACCEPTED */}
          {isNewAssigned && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handlePartnerAction(b.id, 'ACCEPTED')}
              className="px-5 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F9D976]" />
              <span>ACCEPT ASSIGNED JOB</span>
            </button>
          )}

          {/* ACCEPTED -> ON_THE_WAY */}
          {isAccepted && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handlePartnerAction(b.id, 'ON_THE_WAY')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>START TRAVEL (ON THE WAY)</span>
            </button>
          )}

          {/* ON_THE_WAY -> ARRIVED */}
          {isOnTheWay && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handlePartnerAction(b.id, 'ARRIVED')}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>MARK ARRIVED AT LOCATION</span>
            </button>
          )}

          {/* ARRIVED -> VERIFY START OTP -> STARTED */}
          {isArrived && (
            <button
              type="button"
              onClick={() => {
                setOtpBookingId(b.id);
                setOtpType('START');
                setEnteredOtp('');
                setOtpError(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all animate-pulse"
            >
              <KeyRound className="w-4 h-4 text-[#F9D976]" />
              <span>ENTER START OTP TO BEGIN SERVICE</span>
            </button>
          )}

          {/* IN_PROGRESS -> VERIFY COMPLETION OTP -> COMPLETED */}
          {isInProgress && (
            <button
              type="button"
              onClick={() => {
                setOtpBookingId(b.id);
                setOtpType('COMPLETION');
                setEnteredOtp('');
                setOtpError(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ENTER COMPLETION OTP &amp; FINISH JOB</span>
            </button>
          )}

          {isFinished && (
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Job Successfully Completed &amp; Payout Credited</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Top Header */}
      <header className="sticky top-0 z-30 liquid-glass bg-white/95 border-b border-[#E5E5EA] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={onBackToCustomerSite}
            className="p-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Customer Site</span>
          </button>
          <div className="h-6 w-px bg-[#E5E5EA]" />
          <BharatProLogo size="sm" variant="horizontal" />
          <span className="px-2.5 py-0.5 rounded-md bg-[#B8892E] text-white text-[10px] font-mono uppercase font-bold tracking-wider">
            PARTNER DASHBOARD
          </span>
        </div>

        {/* Switch Partner & Availability Toggle */}
        <div className="flex items-center gap-3">
          {/* Demo Partner Selector */}
          <div className="hidden md:flex items-center gap-1.5 text-xs">
            <span className="text-[#8E8E93]">Logged Partner:</span>
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="px-2 py-1 rounded-lg border border-[#D1D1D6] bg-white font-bold text-[#1C1C1E] text-xs outline-none"
            >
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.assignedHubName || p.hubName || 'Hub'})</option>
              ))}
            </select>
          </div>

          {/* Online Toggle */}
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              isOnline 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-neutral-200 text-neutral-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOnline ? 'Online (Ready)' : 'Offline'}</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white border border-[#E5E5EA] hover:bg-[#F2F2F7] text-[#1C1C1E]"
            title="Reload live assigned jobs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Partner Profile Strip */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] border-2 border-[#D4A24E] text-white flex items-center justify-center font-bold text-xl shadow-xs">
              <User className="w-7 h-7 text-[#F9D976]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-['Outfit'] text-[#1C1C1E]">
                  {currentPartner.name}
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  KYC VERIFIED ✓
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#8E8E93]">
                <span className="font-mono">ID: BPE-{currentPartner.id}</span>
                <span>&bull;</span>
                <span className="font-semibold text-indigo-700">{currentPartner.assignedHubName || currentPartner.hubName || 'Central Hub'}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 font-bold text-[#B8892E]">
                  <Star className="w-3 h-3 fill-[#B8892E]" /> {currentPartner.rating}
                </span>
                <span>&bull;</span>
                <span className="font-bold text-[#1C1C1E]">{currentPartner.completedJobs ?? currentPartner.totalJobs ?? 150} Lifetime Jobs</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-center min-w-[110px]">
              <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Assigned Queue</span>
              <span className="text-lg font-black text-amber-600">{newAssignedJobs.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-center min-w-[110px]">
              <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Net Earnings</span>
              <span className="text-lg font-black text-emerald-700">₹{totalEarned}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-[#E5E5EA] pb-2">
          {[
            { key: 'ASSIGNED_JOBS', label: 'New Assigned Jobs', count: newAssignedJobs.length },
            { key: 'TODAY', label: "Today's Active Jobs", count: todayJobs.length },
            { key: 'COMPLETED', label: 'Completed Jobs', count: completedJobs.length },
            { key: 'EARNINGS', label: 'Earnings & Payouts' },
            { key: 'PROFILE_KYC', label: 'Profile, KYC & Skills' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as PartnerTab)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === t.key
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white border border-[#E5E5EA] text-[#48484A] hover:bg-[#F2F2F7]'
              }`}
            >
              {t.label}
              {typeof t.count === 'number' && t.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px]">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: NEW ASSIGNED JOBS */}
        {activeTab === 'ASSIGNED_JOBS' && (
          <div className="space-y-4">
            {newAssignedJobs.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5EA] space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-[#1C1C1E]">No Pending Assigned Jobs</h3>
                <p className="text-xs text-[#8E8E93]">
                  When Bharat Pro dispatch admin manually selects you for a customer job, it will immediately appear here.
                </p>
              </div>
            ) : (
              newAssignedJobs.map(renderJobCard)
            )}
          </div>
        )}

        {/* TAB 2: TODAY'S ACTIVE JOBS */}
        {activeTab === 'TODAY' && (
          <div className="space-y-4">
            {todayJobs.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5EA] space-y-2">
                <Clock className="w-8 h-8 text-[#8E8E93] mx-auto" />
                <h3 className="font-bold text-[#1C1C1E]">No Jobs Currently in Progress</h3>
                <p className="text-xs text-[#8E8E93]">
                  Accept jobs from the &quot;New Assigned Jobs&quot; tab to proceed with transit and on-site OTP verification.
                </p>
              </div>
            ) : (
              todayJobs.map(renderJobCard)
            )}
          </div>
        )}

        {/* TAB 3: COMPLETED JOBS */}
        {activeTab === 'COMPLETED' && (
          <div className="space-y-4">
            {completedJobs.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5EA] text-[#8E8E93] text-sm">
                No completed jobs recorded yet in this session.
              </div>
            ) : (
              completedJobs.map(renderJobCard)
            )}
          </div>
        )}

        {/* TAB 4: EARNINGS & PAYOUTS */}
        {activeTab === 'EARNINGS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
                <span className="text-xs text-[#8E8E93] font-bold uppercase">Net Earned</span>
                <h3 className="text-2xl font-black text-emerald-700">₹{totalEarned}</h3>
                <p className="text-[11px] text-[#8E8E93]">Direct daily bank settlement</p>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
                <span className="text-xs text-[#8E8E93] font-bold uppercase">Jobs Closed</span>
                <h3 className="text-2xl font-black text-[#1C1C1E]">{completedJobs.length}</h3>
                <p className="text-[11px] text-[#8E8E93]">100% verified with OTP</p>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
                <span className="text-xs text-[#8E8E93] font-bold uppercase">Commission Rate</span>
                <h3 className="text-2xl font-black text-[#B8892E]">80% Partner / 20% Hub</h3>
                <p className="text-[11px] text-[#8E8E93]">Guaranteed floor pricing</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3">
              <h4 className="font-bold text-[#1C1C1E] text-sm">Payout Settlement History</h4>
              <div className="divide-y divide-[#F2F2F7] text-xs">
                {completedJobs.map(j => (
                  <div key={j.id} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#1C1C1E] block">{j.serviceName} &bull; #{j.bookingNumber}</span>
                      <span className="text-[#8E8E93]">{j.date} &bull; Customer: {j.customerName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-700 block">+₹{Math.round(j.totalAmount * 0.80)}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">UTR-BPE-{j.id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE, KYC & SKILLS */}
        {activeTab === 'PROFILE_KYC' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-[#1C1C1E] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>KYC &amp; Police Verification Status</span>
              </h4>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 text-emerald-900">
                <div className="flex justify-between">
                  <span className="font-semibold">Aadhaar Card:</span>
                  <span className="font-bold">Verified (UIDAI Biometric)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Police Clearance Certificate:</span>
                  <span className="font-bold">Clear (Valid till 2027)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Bank Account:</span>
                  <span className="font-bold">HDFC Bank (Linked for UPI Instant)</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-[#1C1C1E] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#B8892E]" />
                <span>Certified Service Skills</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentPartner.approvedCategories.map(cat => (
                  <span key={cat} className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                    ✓ {cat.replace(/-/g, ' ').toUpperCase()}
                  </span>
                ))}
              </div>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                Bharat Pro Expert certified technician with certified German chemicals (Taski R-Series) and extraction vacuum authorization.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* OTP ENTRY MODAL */}
      {otpBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#1C1C1E] text-white flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6 text-[#F9D976]" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#1C1C1E]">
                {otpType === 'START' ? 'Enter Customer Start OTP' : 'Enter Customer Completion OTP'}
              </h3>
              <p className="text-xs text-[#8E8E93] mt-1">
                {otpType === 'START' 
                  ? 'Ask the customer for the 4-digit Start OTP shown on their screen to begin work.'
                  : 'Ask the customer for their Completion OTP after final inspection.'}
              </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold">
                {otpError}
              </div>
            )}

            <input
              type="text"
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4-digit OTP"
              className="w-full py-3 px-4 rounded-xl border border-[#D1D1D6] font-mono text-2xl font-bold text-center tracking-widest outline-none focus:ring-2 focus:ring-[#B8892E]"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOtpBookingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#D1D1D6] text-xs font-semibold text-[#8E8E93] hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || enteredOtp.length < 4}
                onClick={handleVerifyOtpSubmit}
                className="flex-1 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
