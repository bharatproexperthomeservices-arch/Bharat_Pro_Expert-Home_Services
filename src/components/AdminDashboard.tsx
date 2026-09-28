import React, { useState, useEffect } from 'react';
import { BharatProLogo } from './BharatProLogo';
import { Booking, Partner, HubLocation, CleaningService, WhatsAppLog } from '../types';
import { 
  getAllBookings, 
  getPartnersList, 
  updateBookingStatusWithOtp, 
  getWhatsAppLogs,
  getAllServices,
  assignPartnerManually,
  getAllHubs,
  saveAllHubs
} from '../services/dbService';
import { INITIAL_HUBS, INITIAL_SERVICES, BUMPER_OFFERS, WHATSAPP_NUMBER } from '../data';
import { OWNER_EMAIL } from '../services/emailService';
import { 
  clearAdminSession, 
  getAllAdminRequests, 
  approveAdminLogin, 
  rejectAdminLogin,
  updateAdminActivity 
} from '../services/adminAuthService';
import { AdminLoginRequest } from '../types';
import { AdminCatalogueTab } from './admin/AdminCatalogueTab';
import { AdminPricingEngine } from './admin/AdminPricingEngine';
import { AdminBookingsTab } from './admin/AdminBookingsTab';
import { AdminHubOperations } from './admin/AdminHubOperations';
import { AdminDispatchEngine } from './admin/AdminDispatchEngine';
import { AdminPartnerSuite } from './admin/AdminPartnerSuite';
import { AdminQualityAndTraining } from './admin/AdminQualityAndTraining';
import { AdminInventorySupplies } from './admin/AdminInventorySupplies';
import { AdminCustomerAndCMS } from './admin/AdminCustomerAndCMS';
import { AdminGovernanceAndAudit } from './admin/AdminGovernanceAndAudit';
import { AdminFinanceAndSettlementSuite } from './admin/AdminFinanceAndSettlementSuite';
import { 
  BarChart3, 
  Users, 
  Layers, 
  MapPin, 
  ShieldCheck, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Key, 
  DollarSign,
  Briefcase,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Percent,
  Receipt,
  PiggyBank,
  Zap,
  GraduationCap,
  Package,
  Globe,
  Tag,
  Shield,
  Sliders,
  Database,
  LogOut,
  Clock,
  UserCheck
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToCustomerSite: () => void;
  onSignOut?: () => void;
}

type AdminModuleTab = 
  | 'OVERVIEW'
  | 'HUBS'
  | 'DISPATCH'
  | 'PARTNERS'
  | 'CATALOGUE'
  | 'PRICING'
  | 'QUALITY'
  | 'INVENTORY'
  | 'BOOKINGS'
  | 'FINANCE'
  | 'COUPONS'
  | 'CUSTOMERS'
  | 'CMS'
  | 'GOVERNANCE';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onBackToCustomerSite,
  onSignOut 
}) => {
  const [activeTab, setActiveTab] = useState<AdminModuleTab>('OVERVIEW');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [hubs, setHubs] = useState<HubLocation[]>(INITIAL_HUBS);
  const [services, setServices] = useState<CleaningService[]>(INITIAL_SERVICES);
  const [waLogs, setWaLogs] = useState<WhatsAppLog[]>([]);
  const [adminRequests, setAdminRequests] = useState<AdminLoginRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Admin state
  const loadData = async () => {
    setLoading(true);
    try {
      const [bks, prts, logs, srvs, loadedHubs, reqs] = await Promise.all([
        getAllBookings(),
        getPartnersList(),
        getWhatsAppLogs(),
        getAllServices(),
        getAllHubs(),
        getAllAdminRequests()
      ]);
      setBookings(bks);
      setPartners(prts);
      setWaLogs(logs);
      setAdminRequests(reqs);
      if (srvs && srvs.length > 0) {
        setServices(srvs);
      }
      if (loadedHubs && loadedHubs.length > 0) {
        setHubs(loadedHubs);
      }
    } catch (e) {
      console.warn('Error loading admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Inactivity auto-logout (15 minutes idle limit for enhanced security)
  useEffect(() => {
    let inactivityTimer: any;
    const resetTimer = () => {
      updateAdminActivity();
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        clearAdminSession();
        onSignOut?.();
      }, 15 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [onSignOut]);

  const pendingPartners = partners.filter(p => p.onboardingStatus === 'pending_approval');
  const pendingAdminRequests = adminRequests.filter(r => r.status === 'PENDING');

  const handleApproveAdminRequest = async (reqId: string) => {
    const res = await approveAdminLogin(reqId, OWNER_EMAIL);
    if (res.success) {
      setAdminRequests(prev => prev.map(r => r.id === reqId ? res.request! : r));
      alert(`Admin access approved for ${res.request?.requesterEmail}! Confirmation dispatched to ${OWNER_EMAIL}.`);
    }
  };

  const handleRejectAdminRequest = async (reqId: string) => {
    const reason = window.prompt('Reason for rejecting admin login:', 'Unauthorized external attempt');
    if (!reason) return;
    const res = await rejectAdminLogin(reqId, reason);
    if (res.success) {
      setAdminRequests(prev => prev.map(r => r.id === reqId ? res.request! : r));
      alert(`Admin login request rejected. Alert dispatched to ${OWNER_EMAIL}.`);
    }
  };

  const handleAuditLog = (action: string, targetId: string, details: string) => {
    console.log(`[AUDIT] Action: ${action} | Target: ${targetId} | Details: ${details}`);
  };

  const handleManualAssign = async (bookingId: string, partnerId: string) => {
    const res = await assignPartnerManually(bookingId, partnerId, 'admin_dispatch', 'Admin Manual Assignment');
    if (res.success && res.booking) {
      setBookings(prev => prev.map(b => b.id === bookingId ? res.booking! : b));
      alert(`Success: Partner assigned to Booking #${res.booking.bookingNumber}! Customer has been updated in real time.`);
    } else {
      alert(`Assignment error: ${res.error || 'Could not assign partner'}`);
    }
  };

  // Financial calculations
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const totalCustomerSavings = bookings.reduce((sum, b) => {
    return sum + (b.priceSnapshot?.customerSavings || Math.max(0, Math.round(b.basePrice / 0.85) - b.basePrice));
  }, 0);

  const totalGstCollected = bookings.reduce((sum, b) => sum + (b.taxesGst || Math.round(b.basePrice * 0.18)), 0);
  const totalPlatformFees = bookings.reduce((sum, b) => sum + (b.convenienceFee || 49), 0);
  const completedJobsCount = bookings.filter(b => b.status === 'COMPLETED').length;
  const inProgressJobsCount = bookings.filter(b => b.status === 'IN_PROGRESS').length;
  const pendingJobsCount = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PARTNER_ASSIGNED').length;

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 liquid-glass bg-white/95 border-b border-[#E5E5EA] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToCustomerSite}
            className="p-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Customer Website</span>
          </button>
          <div className="h-6 w-px bg-[#E5E5EA]" />
          <BharatProLogo size="sm" variant="horizontal" />
          <span className="px-2.5 py-0.5 rounded-md bg-[#1C1C1E] text-white text-[10px] font-mono uppercase font-bold tracking-widest">
            SUPER ADMIN &bull; 22 MODULES
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="font-mono">{OWNER_EMAIL}</span>
          </div>

          <button
            onClick={() => {
              clearAdminSession();
              if (onSignOut) {
                onSignOut();
              } else {
                onBackToCustomerSite();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200"
            title="Sign out of Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white border border-[#E5E5EA] hover:bg-[#F2F2F7] text-[#1C1C1E] transition-all cursor-pointer"
            title="Reload live database metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Admin Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 shrink-0 space-y-4">
          {/* Group 1: Operations Core */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider px-3">
              Operations &amp; Dispatch
            </span>
            {[
              { key: 'OVERVIEW', label: '01 Executive Dashboard', icon: BarChart3 },
              { key: 'HUBS', label: '02-03 Hub Operations', icon: MapPin, count: hubs.length },
              { key: 'DISPATCH', label: '07 Auto-Dispatch Engine', icon: Zap, count: bookings.filter(b => b.status === 'CONFIRMED').length },
              { 
                key: 'PARTNERS', 
                label: '08-09 Partner Operations', 
                icon: Users, 
                count: partners.length,
                pending: pendingPartners.length
              }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1C1C1E] text-white shadow-md'
                      : 'bg-white hover:bg-white/80 text-[#48484A] border border-[#E5E5EA]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
                    <span>{tab.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tab.pending !== undefined && tab.pending > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                        {tab.pending} wait
                      </span>
                    )}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#F2F2F7] text-[#8E8E93]'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Group 2: Service, Quality & Training */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider px-3">
              Service &amp; Quality
            </span>
            {[
              { key: 'CATALOGUE', label: '04 Master Catalogue', icon: Layers, count: services.length },
              { key: 'PRICING', label: '05 Pricing Engine (15%)', icon: Percent },
              { key: 'QUALITY', label: '10-11 Quality SOP & Training', icon: GraduationCap },
              { key: 'INVENTORY', label: '12 Inventory & Cleaning Kits', icon: Package }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1C1C1E] text-white shadow-md'
                      : 'bg-white hover:bg-white/80 text-[#48484A] border border-[#E5E5EA]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#F2F2F7] text-[#8E8E93]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Group 3: Commerce, CRM & Finance */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider px-3">
              Orders &amp; Finance
            </span>
            {[
              { key: 'BOOKINGS', label: '06 Bookings & Snapshots', icon: ShieldCheck, count: bookings.length },
              { key: 'FINANCE', label: '15 Finance & Settlements (5% GST)', icon: Receipt },
              { key: 'COUPONS', label: '13, 14, 16 CRM, CMS & Offers', icon: Tag }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1C1C1E] text-white shadow-md'
                      : 'bg-white hover:bg-white/80 text-[#48484A] border border-[#E5E5EA]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#F2F2F7] text-[#8E8E93]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Group 4: Governance, RBAC & Audit */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider px-3">
              Governance &amp; Security
            </span>
            {[
              { key: 'GOVERNANCE', label: '17-22 RBAC & Audit Center', icon: Database }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1C1C1E] text-white shadow-md'
                      : 'bg-white hover:bg-white/80 text-[#48484A] border border-[#E5E5EA]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Dynamic Admin Pane */}
        <main className="flex-1 space-y-6">
          {/* MODULE 01: EXECUTIVE OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              
              {/* URGENT OWNER APPROVAL ALERT BANNER */}
              {(pendingPartners.length > 0 || pendingAdminRequests.length > 0) && (
                <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-400 text-amber-950 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold">
                        <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#1C1C1E] flex items-center gap-2">
                          <span>Owner Approvals Required</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase font-black">
                            Action Needed
                          </span>
                        </h4>
                        <p className="text-xs text-amber-900 mt-0.5">
                          Target Account: <strong className="underline">{OWNER_EMAIL}</strong> &bull; Any partner registration or admin access requires your explicit sign-off.
                        </p>
                      </div>
                    </div>

                    {pendingPartners.length > 0 && (
                      <button
                        onClick={() => setActiveTab('PARTNERS')}
                        className="px-4 py-2 bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
                      >
                        <Users className="w-4 h-4 text-[#D4A24E]" />
                        <span>Review {pendingPartners.length} Partner Applications →</span>
                      </button>
                    )}
                  </div>

                  {/* List of pending admin requests if any */}
                  {pendingAdminRequests.length > 0 && (
                    <div className="pt-2 border-t border-amber-300/60 space-y-2">
                      <span className="text-xs font-bold text-amber-900 block">
                        Admin Login Access Requests ({pendingAdminRequests.length}):
                      </span>
                      {pendingAdminRequests.map(req => (
                        <div key={req.id} className="p-3 rounded-xl bg-white border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-bold text-[#1C1C1E]">{req.requesterEmail}</span>
                            <span className="text-[11px] text-[#8E8E93] ml-2 font-mono">({new Date(req.requestedAt).toLocaleTimeString()})</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveAdminRequest(req.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Approve Access
                            </button>
                            <button
                              onClick={() => handleRejectAdminRequest(req.id)}
                              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm">
                  <span className="text-xs text-[#8E8E93] font-medium block">Total Revenue (GMV)</span>
                  <p className="text-2xl sm:text-3xl font-black text-[#1C1C1E] mt-1">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-[#1F8A3B] font-bold mt-1 inline-flex items-center gap-1">
                    100% Real Gateway Audited
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm">
                  <span className="text-xs text-[#8E8E93] font-medium block">Customer Savings (15%)</span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                    ₹{totalCustomerSavings.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-[#1F8A3B] font-bold mt-1 inline-flex items-center gap-1">
                    Delivered via 15% Standard
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm">
                  <span className="text-xs text-[#8E8E93] font-medium block">Total Bookings</span>
                  <p className="text-2xl sm:text-3xl font-black text-[#1C1C1E] mt-1">
                    {bookings.length}
                  </p>
                  <span className="text-[11px] text-[#B8892E] font-bold mt-1 inline-flex items-center gap-1">
                    {inProgressJobsCount} In Progress &bull; {completedJobsCount} Done
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm">
                  <span className="text-xs text-[#8E8E93] font-medium block">Active Cleaning Fleet</span>
                  <p className="text-2xl sm:text-3xl font-black text-[#1C1C1E] mt-1">
                    {partners.filter(p => p.isOnline).length} / {partners.length}
                  </p>
                  <span className="text-[11px] text-indigo-700 font-bold mt-1 block">
                    {hubs.filter(h => h.active).length} Hubs Operational
                  </span>
                </div>
              </div>

              {/* Bumper Offers Overview */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-['Outfit'] text-[#1C1C1E]">
                    Active Bumper Combo Offers
                  </h3>
                  <span className="text-xs font-bold text-[#E07B1A] bg-[#FFF8F0] px-2.5 py-1 rounded-lg border border-[#E0B050]/40">
                    Auto-Unlocked at Checkout
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {BUMPER_OFFERS.map((offer) => (
                    <div key={offer.id} className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E0B050] space-y-2">
                      <span className="px-2 py-0.5 rounded bg-[#E07B1A] text-white text-[10px] font-bold uppercase">
                        {offer.badge}
                      </span>
                      <h4 className="text-sm font-bold text-[#1C1C1E]">{offer.headline}</h4>
                      <p className="text-xs text-[#1F8A3B] font-semibold">{offer.freeItemDescription}</p>
                      <span className="block text-[11px] text-[#8E8E93]">Worth ₹{offer.freeItemValue} free to customer</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Operational Status */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-['Outfit'] text-[#1C1C1E]">
                    Recent Live Bookings &amp; Service Pipeline
                  </h3>
                  <button 
                    onClick={() => setActiveTab('BOOKINGS')}
                    className="text-xs font-bold text-[#B8892E] hover:underline"
                  >
                    View All Bookings &rarr;
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div className="py-8 text-center text-[#8E8E93] text-sm">
                    No bookings logged yet. Place a test booking on the customer site to see real-time pipeline tracking.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((b) => (
                      <div 
                        key={b.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1C1C1E]">#{b.bookingNumber}</span>
                            <span className="text-xs font-semibold text-[#1C1C1E]">&bull; {b.customerName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#8E8E93] mt-1">
                            {b.serviceName} | {b.address.sector}, {b.address.city} | Slot: {b.timeSlot}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-[#1C1C1E]">₹{b.totalAmount}</span>
                          <span className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-[#E5E5EA]">
                            Start OTP: <strong>{b.startOtp}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODULE 02-03: HUB OPERATIONS & MULTI-CLUSTER */}
          {activeTab === 'HUBS' && (
            <AdminHubOperations
              hubs={hubs}
              partners={partners}
              onUpdateHubs={async (updated) => {
                setHubs(updated);
                await saveAllHubs(updated);
              }}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* MODULE 07: AUTO-DISPATCH ENGINE */}
          {activeTab === 'DISPATCH' && (
            <AdminDispatchEngine
              bookings={bookings}
              partners={partners}
              hubs={hubs}
              onManualAssign={handleManualAssign}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* MODULE 08-09: PARTNER SUITE & OPERATIONS */}
          {activeTab === 'PARTNERS' && (
            <AdminPartnerSuite
              partners={partners}
              hubs={hubs}
              bookings={bookings}
              onUpdatePartners={(updated) => setPartners(updated)}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* MODULE 04: MASTER CATALOGUE */}
          {activeTab === 'CATALOGUE' && (
            <AdminCatalogueTab
              services={services}
              onRefresh={loadData}
            />
          )}

          {/* MODULE 05: PRICING ENGINE */}
          {activeTab === 'PRICING' && (
            <AdminPricingEngine
              services={services}
              onServiceUpdated={loadData}
            />
          )}

          {/* MODULE 10-11: QUALITY & TRAINING */}
          {activeTab === 'QUALITY' && (
            <AdminQualityAndTraining
              partners={partners}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* MODULE 12: INVENTORY & CLEANING KITS */}
          {activeTab === 'INVENTORY' && (
            <AdminInventorySupplies
              hubs={hubs}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* MODULE 06: BOOKINGS & FROZEN PRICE SNAPSHOTS */}
          {activeTab === 'BOOKINGS' && (
            <AdminBookingsTab
              bookings={bookings}
              partners={partners}
              onRefresh={loadData}
              onManualAssign={handleManualAssign}
            />
          )}

          {/* MODULE 13, 14, 16: CRM, CMS & COUPONS */}
          {activeTab === 'COUPONS' && (
            <AdminCustomerAndCMS
              hubs={hubs}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* MODULE 15: FINANCE & SETTLEMENT ENGINE */}
          {activeTab === 'FINANCE' && (
            <AdminFinanceAndSettlementSuite
              bookings={bookings}
              partners={partners}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* MODULE 17-22: GOVERNANCE, RBAC, COMPLAINTS, AUDIT */}
          {activeTab === 'GOVERNANCE' && (
            <AdminGovernanceAndAudit
              bookings={bookings}
              partners={partners}
              hubs={hubs}
              onAuditLog={handleAuditLog}
            />
          )}
        </main>
      </div>
    </div>
  );
};
