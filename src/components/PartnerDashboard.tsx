import React, { useState, useEffect } from 'react';
import { Booking, Partner } from '../types';
import { 
  getAllBookings, 
  getPartnersList, 
  updateBookingStatusWithOtp,
  sendWhatsAppNotification 
} from '../services/dbService';
import { 
  getPartnerSession, 
  savePartnerSession, 
  clearPartnerSession, 
  verifyPartnerLogin, 
  submitPartnerApplication,
  getOrSeedPartners 
} from '../services/partnerAuthService';
import { 
  getSettlementConfig, 
  calculateSettlementBreakdown, 
  getAllSettlements, 
  getPartnerBankAccount, 
  savePartnerBankAccount, 
  getPartnerKYC, 
  savePartnerKYC 
} from '../services/settlementService';
import { 
  Settlement, 
  SettlementConfiguration, 
  PartnerBankAccount, 
  PartnerKYC 
} from '../types';
import { OWNER_EMAIL } from '../services/emailService';
import { INITIAL_HUBS } from '../data';
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
  ExternalLink,
  LogOut,
  Send,
  UserPlus,
  Building,
  Check
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
  const [authenticatedPartner, setAuthenticatedPartner] = useState<Partner | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<PartnerTab>('ASSIGNED_JOBS');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Auth Gate State
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loginUserId, setLoginUserId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Register Partner Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCity, setRegCity] = useState('Gurugram');
  const [regHubId, setRegHubId] = useState('hub-gurugram-cyber');
  const [regCategories, setRegCategories] = useState<string[]>(['bathroom-cleaning', 'full-home-cleaning']);
  const [regSuccessApplication, setRegSuccessApplication] = useState<Partner | null>(null);
  
  // OTP input modal / form state
  const [otpBookingId, setOtpBookingId] = useState<string | null>(null);
  const [otpType, setOtpType] = useState<'START' | 'COMPLETION'>('START');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Settlement & Financial State
  const [settlementConfig, setSettlementConfig] = useState<SettlementConfiguration | null>(null);
  const [partnerSettlements, setPartnerSettlements] = useState<Settlement[]>([]);
  const [bankAccount, setBankAccount] = useState<PartnerBankAccount | null>(null);
  const [kycRecord, setKycRecord] = useState<PartnerKYC | null>(null);

  // Bank Form State
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankUpiId, setBankUpiId] = useState('');
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);

  // KYC Form State
  const [kycFullName, setKycFullName] = useState('');
  const [kycPan, setKycPan] = useState('');
  const [kycAadhaar, setKycAadhaar] = useState('');
  const [kycSaving, setKycSaving] = useState(false);
  const [kycSuccess, setKycSuccess] = useState<string | null>(null);

  // Check saved session on mount
  useEffect(() => {
    const existing = getPartnerSession();
    if (existing) {
      setAuthenticatedPartner(existing);
      setSelectedPartnerId(existing.id);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prts, bks, cfg, setts] = await Promise.all([
        getOrSeedPartners(),
        getAllBookings(),
        getSettlementConfig(),
        getAllSettlements()
      ]);
      setPartners(prts);
      setSettlementConfig(cfg);
      setPartnerSettlements(setts);

      const activeId = authenticatedPartner?.id || selectedPartnerId || (prts[0] ? prts[0].id : '');
      if (prts.length > 0 && !selectedPartnerId && !authenticatedPartner) {
        setSelectedPartnerId(prts[0].id);
      }
      setBookings(bks);

      if (activeId) {
        const [bRec, kRec] = await Promise.all([
          getPartnerBankAccount(activeId),
          getPartnerKYC(activeId)
        ]);
        setBankAccount(bRec);
        setKycRecord(kRec);
        if (bRec) {
          setBankHolderName(bRec.accountHolderName);
          setBankIfsc(bRec.ifsc);
          setBankName(bRec.bankName);
          setBankUpiId(bRec.upiId || '');
        }
        if (kRec) {
          setKycFullName(kRec.fullName);
          setKycPan(kRec.panNumber);
        }
      }
    } catch (e) {
      console.warn('Error loading partner dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('bharatpro_booking_updated', handleUpdate);
    window.addEventListener('bharatpro_partners_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('bharatpro_booking_updated', handleUpdate);
      window.removeEventListener('bharatpro_partners_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Handle Partner Login
  const handlePartnerLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await verifyPartnerLogin(loginUserId, loginPassword);
      if (res.success && res.partner) {
        setAuthenticatedPartner(res.partner);
        setSelectedPartnerId(res.partner.id);
        savePartnerSession(res.partner);
      } else {
        setAuthError(res.error || 'अमान्य क्रेडेंशियल्स');
      }
    } catch {
      setAuthError('लॉगिन के दौरान त्रुटि');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Partner Registration
  const handlePartnerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const hub = INITIAL_HUBS.find(h => h.id === regHubId);
    try {
      const app = await submitPartnerApplication({
        name: regName,
        phone: regPhone,
        email: regEmail,
        city: regCity,
        hubId: regHubId,
        hubName: hub ? `${hub.city} - ${hub.name}` : 'Central Hub',
        categories: regCategories
      });
      setRegSuccessApplication(app);
    } catch {
      setAuthError('पंजीकरण फॉर्म भेजने में विफल');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePartnerLogout = () => {
    clearPartnerSession();
    setAuthenticatedPartner(null);
    setSelectedPartnerId('');
    setLoginUserId('');
    setLoginPassword('');
  };

  // IF NOT AUTHENTICATED: RENDER PARTNER ACCESS GATE
  if (!authenticatedPartner) {
    return (
      <div className="min-h-screen bg-[#071321] text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-amber-600 font-['Inter',sans-serif]">
        <div className="w-full max-w-md mb-6 flex items-center justify-between">
          <button
            onClick={onBackToCustomerSite}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Customer Website</span>
          </button>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-950/70 border border-amber-800/50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Partner Operations Portal
          </span>
        </div>

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl mb-3 text-amber-400">
              <Briefcase className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              Bharat Pro Expert <span className="text-[11px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">Partner</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Service Technician &amp; Professional Portal
            </p>
          </div>

          {/* Toggle Tabs: Sign In / Register */}
          <div className="flex bg-slate-950 p-1 rounded-2xl mb-5 text-xs font-bold">
            <button
              onClick={() => { setAuthView('LOGIN'); setAuthError(null); setRegSuccessApplication(null); }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                authView === 'LOGIN' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Partner Sign In
            </button>
            <button
              onClick={() => { setAuthView('REGISTER'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                authView === 'REGISTER' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              New Partner Apply
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* TAB 1: PARTNER LOGIN */}
          {authView === 'LOGIN' && (
            <form onSubmit={handlePartnerLoginSubmit} className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-amber-100">Owner Approval Mandatory:</span>
                  Partner ID Owner (<strong className="underline text-white">{OWNER_EMAIL}</strong>) द्वारा approve होने के बाद ही Live होती है।
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Partner User ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={loginUserId}
                    onChange={(e) => setLoginUserId(e.target.value.toUpperCase())}
                    placeholder="e.g. BPE-PRO-101"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter assigned password"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In to Partner Portal</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <span>New Service Professional? </span>
                <button
                  type="button"
                  onClick={() => setAuthView('REGISTER')}
                  className="text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Apply for Onboarding →
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PARTNER REGISTRATION */}
          {authView === 'REGISTER' && (
            <div>
              {regSuccessApplication ? (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Application Submitted!</h3>
                  <p className="text-xs text-slate-300">
                    Aapki Partner Application Owner (<strong className="text-amber-400">{OWNER_EMAIL}</strong>) ke paas approval ke liye bhej di gayi hai.
                  </p>
                  <div className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-left space-y-1 text-slate-400">
                    <div>Temporary ID: <span className="text-white font-bold">{regSuccessApplication.loginUserId}</span></div>
                    <div>Status: <span className="text-amber-400 font-bold uppercase">Pending Owner Approval</span></div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Owner dwara approve hote hi aapko User ID aur Password activate ho jayega.
                  </p>
                  <button
                    onClick={() => {
                      setRegSuccessApplication(null);
                      setAuthView('LOGIN');
                    }}
                    className="w-full py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Go to Partner Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePartnerRegisterSubmit} className="space-y-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-200">
                    ℹ️ Register karne par aapka data Owner (<strong className="underline text-white">{OWNER_EMAIL}</strong>) ke paas approval ke liye jayega.
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="pro@gmail.com"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="e.g. Gurugram"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Operational Hub</label>
                      <select
                        value={regHubId}
                        onChange={(e) => setRegHubId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white outline-none"
                      >
                        {INITIAL_HUBS.map(h => (
                          <option key={h.id} value={h.id}>{h.city} - {h.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{authLoading ? 'Submitting Application...' : 'Submit Application for Owner Approval'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    );
  }

  // AUTHENTICATED PARTNER VIEW
  const currentPartner = authenticatedPartner || partners.find(p => p.id === selectedPartnerId) || partners[0];

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

  // Authoritative financial calculations for partner using central SettlementCalculationService
  const activeCfg = settlementConfig || {
    id: 'config_default',
    gstRate: 0.05,
    gstMode: 'INCLUSIVE',
    commissionRate: 0.15,
    commissionBase: 'GROSS',
    platformFeeType: 'FLAT',
    platformFeeAmount: 10,
    settlementHoldPeriodHours: 24,
    minimumPayoutAmount: 100,
    payoutEnabled: true,
    updatedAt: '',
    updatedBy: ''
  };

  const totalEarned = completedJobs.reduce((sum, b) => {
    const calc = calculateSettlementBreakdown(b, activeCfg);
    return sum + calc.partnerPayableAmount;
  }, 0);

  // Handle saving bank details
  const handleSaveBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPartner) return;
    setBankSaving(true);
    setBankSuccess(null);
    try {
      const rec = await savePartnerBankAccount(currentPartner.id, {
        accountHolderName: bankHolderName,
        accountNumber: bankAccountNumber,
        ifsc: bankIfsc,
        bankName: bankName,
        upiId: bankUpiId
      });
      setBankAccount(rec);
      setBankSuccess('Bank account details saved and verified.');
    } catch {
      alert('Failed to save bank details.');
    } finally {
      setBankSaving(false);
    }
  };

  // Handle saving KYC details
  const handleSaveKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPartner) return;
    setKycSaving(true);
    setKycSuccess(null);
    try {
      const rec = await savePartnerKYC(currentPartner.id, {
        fullName: kycFullName,
        mobile: currentPartner.phone,
        panNumber: kycPan,
        aadhaarNumber: kycAadhaar
      });
      setKycRecord(rec);
      setKycSuccess('KYC documents submitted and verified.');
    } catch {
      alert('Failed to save KYC documents.');
    } finally {
      setKycSaving(false);
    }
  };

  const renderJobCard = (b: Booking) => {
    const isNewAssigned = b.status === 'ASSIGNED' || b.status === 'PARTNER_ASSIGNED';
    const isAccepted = b.status === 'ACCEPTED' || b.status === 'PARTNER_ACCEPTED';
    const isOnTheWay = b.status === 'ON_THE_WAY' || b.status === 'PARTNER_ON_THE_WAY';
    const isArrived = b.status === 'ARRIVED';
    const isInProgress = b.status === 'IN_PROGRESS' || b.status === 'STARTED';
    const isFinished = b.status === 'COMPLETED';

    const cleanPhone = (b.customerPhone || '').replace(/\D/g, '');
    const bBreak = calculateSettlementBreakdown(b, activeCfg);

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
              <span className="text-emerald-700 font-bold">Your Net Payout:</span>
              <span className="font-black text-sm text-emerald-700">₹{bBreak.partnerPayableAmount}</span>
            </div>
            <div className="text-[10px] text-[#8E8E93] pt-1 space-y-0.5 border-t border-dashed border-[#E5E5EA]">
              <div className="flex justify-between">
                <span>GST (5%):</span>
                <span>−₹{bBreak.taxAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Company Commission (15%):</span>
                <span>−₹{bBreak.companyCommission}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee:</span>
                <span>−₹{bBreak.platformFee}</span>
              </div>
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
          <BharatProLogo size="md" />
          <span className="px-2.5 py-0.5 rounded-md bg-[#B8892E] text-white text-[10px] font-mono uppercase font-bold tracking-wider">
            PARTNER DASHBOARD
          </span>
        </div>

        {/* Switch Partner & Availability Toggle */}
        <div className="flex items-center gap-3">
          {/* Authenticated Partner Info */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <User className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-bold text-[#1C1C1E]">{currentPartner.name}</span>
            <span className="font-mono text-[11px] text-[#8E8E93] hidden sm:inline">({currentPartner.loginUserId || currentPartner.id})</span>
          </div>

          <button
            onClick={handlePartnerLogout}
            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-rose-200"
            title="Sign out of Partner Account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>

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
                <p className="text-[11px] text-[#8E8E93]">100% verified with Customer OTP</p>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
                <span className="text-xs text-[#8E8E93] font-bold uppercase">Company Rate</span>
                <h3 className="text-2xl font-black text-[#062A49]">15% Comm. + 5% GST</h3>
                <p className="text-[11px] text-[#8E8E93]">Platform safety fee: ₹{activeCfg.platformFeeAmount}</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-[#1C1C1E] text-sm">Audited Payout Settlement History</h4>
                <span className="text-xs text-[#8E8E93]">Daily Direct Remittance</span>
              </div>

              <div className="divide-y divide-[#F2F2F7] text-xs">
                {completedJobs.length === 0 ? (
                  <p className="text-center text-[#8E8E93] py-6">No completed jobs yet.</p>
                ) : (
                  completedJobs.map(j => {
                    const calc = calculateSettlementBreakdown(j, activeCfg);
                    const matchingSettlement = partnerSettlements.find(s => s.bookingId === j.id);
                    return (
                      <div key={j.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1C1C1E]">{j.serviceName}</span>
                            <span className="font-mono text-[#062A49] font-bold">#{j.bookingNumber}</span>
                            {matchingSettlement?.status === 'SUCCESS' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ PAID TO BANK
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                ELIGIBLE &bull; PROCESSING
                              </span>
                            )}
                          </div>
                          <span className="text-[#8E8E93] block text-[11px] mt-0.5">
                            Customer: {j.customerName} &bull; Date: {j.date}
                          </span>
                          <span className="text-[10px] text-[#8E8E93]">
                            Customer Paid: ₹{j.totalAmount} | 5% GST: −₹{calc.taxAmount} | 15% Comm: −₹{calc.companyCommission} | Fee: −₹{calc.platformFee}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-700 text-base block">
                            +₹{calc.partnerPayableAmount}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {matchingSettlement?.payoutReference ? `Ref: ${matchingSettlement.payoutReference}` : 'Pending Next Bank Cycle'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE, KYC & SKILLS */}
        {activeTab === 'PROFILE_KYC' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Details Form */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#1C1C1E] flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#062A49]" />
                  <span>Bank Account for Payouts</span>
                </h4>
                {bankAccount ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    VERIFIED ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    SETUP REQUIRED
                  </span>
                )}
              </div>

              {bankSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{bankSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveBankSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    required
                    value={bankHolderName}
                    onChange={e => setBankHolderName(e.target.value)}
                    placeholder="As per bank passbook"
                    className="w-full p-2.5 rounded-xl border border-[#E5E5EA]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">
                    Bank Account Number {bankAccount?.accountNumberMasked && `(Current: ${bankAccount.accountNumberMasked})`}
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={e => setBankAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    className="w-full p-2.5 rounded-xl border border-[#E5E5EA] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[#1C1C1E] mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full p-2.5 rounded-xl border border-[#E5E5EA]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C1C1E] mb-1">IFSC Code</label>
                    <input
                      type="text"
                      required
                      value={bankIfsc}
                      onChange={e => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full p-2.5 rounded-xl border border-[#E5E5EA] font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">UPI ID (Optional Instant Transfer)</label>
                  <input
                    type="text"
                    value={bankUpiId}
                    onChange={e => setBankUpiId(e.target.value)}
                    placeholder="e.g. name@upi"
                    className="w-full p-2.5 rounded-xl border border-[#E5E5EA]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bankSaving}
                  className="w-full py-2.5 rounded-xl bg-[#062A49] text-white font-bold hover:bg-opacity-90 cursor-pointer shadow-sm"
                >
                  {bankSaving ? 'Saving...' : 'Save & Verify Bank Details'}
                </button>
              </form>
            </div>

            {/* KYC Form */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#1C1C1E] flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>KYC Identification &amp; Verification</span>
                </h4>
                {kycRecord ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    KYC VERIFIED ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    PENDING
                  </span>
                )}
              </div>

              {kycSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{kycSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveKycSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">Full Legal Name (as on PAN/Aadhaar)</label>
                  <input
                    type="text"
                    required
                    value={kycFullName}
                    onChange={e => setKycFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full p-2.5 rounded-xl border border-[#E5E5EA]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={kycPan}
                    onChange={e => setKycPan(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full p-2.5 rounded-xl border border-[#E5E5EA] font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1E] mb-1">
                    Aadhaar Number (12 digits) {kycRecord?.aadhaarNumberMasked && `(${kycRecord.aadhaarNumberMasked})`}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={kycAadhaar}
                    onChange={e => setKycAadhaar(e.target.value.replace(/\D/g, ''))}
                    placeholder="12 digit Aadhaar number"
                    className="w-full p-2.5 rounded-xl border border-[#E5E5EA] font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={kycSaving}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer shadow-sm"
                >
                  {kycSaving ? 'Submitting...' : 'Submit & Verify KYC'}
                </button>
              </form>

              {/* Skills Badge */}
              <div className="pt-3 border-t border-[#E5E5EA] space-y-2">
                <span className="font-bold text-xs text-[#1C1C1E] block">Certified Categories</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentPartner.approvedCategories.map(cat => (
                    <span key={cat} className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                      ✓ {cat.replace(/-/g, ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
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
