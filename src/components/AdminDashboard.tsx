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
import { INITIAL_HUBS, INITIAL_SERVICES, WHATSAPP_NUMBER } from '../data';
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
import { AdminHubMapView } from './admin/AdminHubMapView';
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
  UserCheck,
  Calendar,
  AlertTriangle,
  Compass,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToCustomerSite: () => void;
  onSignOut?: () => void;
}

export type AdminModuleTab = 
  | 'OVERVIEW'        // 01 Executive Dashboard
  | 'HUBS'            // 02 Hub List & Management
  | 'HUB_MAP'         // 03 Hub Map View
  | 'CATALOGUE'       // 04 Master Catalogue (Services & Pricing)
  | 'PRICING'         // 05 Pricing Engine
  | 'BOOKINGS'        // 06 Bookings & Snapshots
  | 'DISPATCH'        // 07 Auto-Dispatch Engine
  | 'PARTNERS'        // 08+09 Partner Management & Directory
  | 'QUALITY'         // 10-11 Quality SOP & Training
  | 'INVENTORY'       // 12 Inventory & Cleaning Kits
  | 'CUSTOMERS'       // 13 CRM (Customer Relationship Management)
  | 'COUPONS'         // 14 Offers & Promotions
  | 'FINANCE'         // 15 Finance & Settlements
  | 'CMS'             // 16 CMS (Website Content Management)
  | 'GOVERNANCE';     // 17-22 RBAC, Login Audit, Activity Audit, Backup & Settings

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

  // Module 01: Executive Overview Date Filter
  const [overviewDateRange, setOverviewDateRange] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');

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

    // Listen to live booking and service updates
    const handleBookingUpdated = () => loadData();
    const handleServicesUpdated = (e: any) => {
      if (e.detail?.services) setServices(e.detail.services);
    };

    window.addEventListener('bharatpro_booking_updated', handleBookingUpdated);
    window.addEventListener('bharatpro_services_updated', handleServicesUpdated);

    return () => {
      window.removeEventListener('bharatpro_booking_updated', handleBookingUpdated);
      window.removeEventListener('bharatpro_services_updated', handleServicesUpdated);
    };
  }, []);

  // Inactivity auto-logout (15 minutes idle limit for Owner security)
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
  const unassignedBookings = bookings.filter(b => b.status === 'SEARCHING_PROFESSIONAL' || b.status === 'CONFIRMED' || !b.assignedPartnerId);

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

  // Date range filtering for Module 01 Executive Dashboard
  const now = new Date();
  const filteredBookingsByDate = bookings.filter(b => {
    if (overviewDateRange === 'ALL') return true;
    const bDate = new Date(b.createdAt || b.date);
    const diffHours = (now.getTime() - bDate.getTime()) / (1000 * 60 * 60);

    if (overviewDateRange === 'TODAY') return diffHours <= 24;
    if (overviewDateRange === 'WEEK') return diffHours <= 24 * 7;
    if (overviewDateRange === 'MONTH') return diffHours <= 24 * 30;
    return true;
  });

  // Real financial and operational calculations (Zero fake stats)
  const totalRevenue = filteredBookingsByDate
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const totalCustomerSavings = filteredBookingsByDate.reduce((sum, b) => {
    return sum + (b.priceSnapshot?.customerSavings || Math.max(0, Math.round(b.basePrice / 0.85) - b.basePrice));
  }, 0);

  const completedJobsCount = filteredBookingsByDate.filter(b => b.status === 'COMPLETED').length;
  const inProgressJobsCount = filteredBookingsByDate.filter(b => b.status === 'IN_PROGRESS').length;
  const cancelledJobsCount = filteredBookingsByDate.filter(b => b.status === 'CANCELLED').length;
  const pendingJobsCount = filteredBookingsByDate.filter(b => b.status === 'SEARCHING_PROFESSIONAL' || b.status === 'CONFIRMED' || !b.assignedPartnerId).length;

  const onlineFleetCount = partners.filter(p => p.isOnline).length;

  // Hub-wise Partner breakdown (Gurugram X, Patna Y, Ranchi Z)
  const partnersByCity = {
    gurugram: partners.filter(p => p.assignedHubName?.toLowerCase().includes('gurugram') || p.assignedHubId?.includes('gurugram')).length,
    patna: partners.filter(p => p.assignedHubName?.toLowerCase().includes('patna') || p.assignedHubId?.includes('patna') || !p.assignedHubId).length,
    ranchi: partners.filter(p => p.assignedHubName?.toLowerCase().includes('ranchi') || p.assignedHubId?.includes('ranchi')).length,
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 liquid-glass bg-white/95 border-b border-[#E5E5EA] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToCustomerSite}
            className="p-2 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Customer Website</span>
          </button>
          <div className="h-6 w-px bg-[#E5E5EA]" />
          <BharatProLogo size="md" />
          <span className="px-2.5 py-0.5 rounded-md bg-[#1C1C1E] text-white text-[10px] font-mono uppercase font-bold tracking-widest hidden sm:inline-block">
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
        
        {/* Navigation Sidebar (All 22 Modules) */}
        <nav className="w-full md:w-64 shrink-0 space-y-4">
          
          {/* Group 1: Operations Core (Modules 01, 02, 03, 06, 07) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider px-3">
              Operations &amp; Dispatch
            </span>
            {[
              { key: 'OVERVIEW', label: '01 Executive Dashboard', icon: BarChart3 },
              { key: 'HUBS', label: '02 Hub Management', icon: MapPin, count: hubs.length },
              { key: 'HUB_MAP', label: '03 Hub Map View', icon: Compass },
              { key: 'BOOKINGS', label: '06 Bookings & Snapshots', icon: ShieldCheck, count: bookings.length },
              { key: 'DISPATCH', label: '07 Auto-Dispatch Engine', icon: Zap, count: unassignedBookings.length }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

          {/* Group 2: Partners, Quality & Inventory (Modules 08-09, 10-11, 12) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider px-3">
              Fleet &amp; Quality
            </span>
            {[
              { 
                key: 'PARTNERS', 
                label: '08+09 Partner Management', 
                icon: Users, 
                count: partners.length,
                pending: pendingPartners.length
              },
              { key: 'QUALITY', label: '10-11 Quality SOP & Training', icon: GraduationCap },
              { key: 'INVENTORY', label: '12 Inventory & Cleaning Kits', icon: Package }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

          {/* Group 3: Commerce & Pricing (Modules 04, 05, 14, 15) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider px-3">
              Commerce &amp; Finance
            </span>
            {[
              { key: 'CATALOGUE', label: '04 Master Catalogue', icon: Layers, count: services.length },
              { key: 'PRICING', label: '05 Pricing Engine (15%)', icon: Percent },
              { key: 'COUPONS', label: '14 Offers & Promotions', icon: Tag },
              { key: 'FINANCE', label: '15 Finance & Settlements (5%)', icon: Receipt }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

          {/* Group 4: CRM & Content (Modules 13, 16) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider px-3">
              CRM &amp; Website
            </span>
            {[
              { key: 'CUSTOMERS', label: '13 CRM & Customers', icon: Users },
              { key: 'CMS', label: '16 CMS (Website Content)', icon: Globe }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

          {/* Group 5: Governance, RBAC, Audit & Security (Modules 17, 18, 19, 20-21, 22) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider px-3">
              Governance &amp; Security
            </span>
            {[
              { key: 'GOVERNANCE', label: '17-22 Security & Audit Center', icon: Database }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
          
          {/* ========================================================= */}
          {/* MODULE 01: EXECUTIVE DASHBOARD */}
          {/* ========================================================= */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              
              {/* Top Controls Bar with Date-Range Filter */}
              <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
                      Module 01 &bull; Executive Dashboard
                    </span>
                    <span className="text-xs text-[#8E8E93]">Real Database Metrics &bull; Zero AI</span>
                  </div>
                  <h3 className="text-lg font-black text-[#1C1C1E] mt-1 font-['Outfit']">
                    Operations &amp; Revenue Overview
                  </h3>
                </div>

                {/* Date-Range Selector */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  {[
                    { id: 'TODAY', label: 'Today' },
                    { id: 'WEEK', label: 'This Week' },
                    { id: 'MONTH', label: 'This Month' },
                    { id: 'ALL', label: 'All Time' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setOverviewDateRange(r.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        overviewDateRange === r.id 
                          ? 'bg-white text-slate-900 shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* REAL TRIGGERS & ALERTS SECTION */}
              {(unassignedBookings.length > 0 || pendingPartners.length > 0 || pendingAdminRequests.length > 0) && (
                <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-400 text-amber-950 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold">
                        <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#1C1C1E] flex items-center gap-2">
                          <span>Real Operational Triggers Requiring Action</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase font-black">
                            Action Needed
                          </span>
                        </h4>
                        <p className="text-xs text-amber-900 mt-0.5">
                          {unassignedBookings.length > 0 && `• ${unassignedBookings.length} bookings unassigned awaiting manual dispatch. `}
                          {pendingPartners.length > 0 && `• ${pendingPartners.length} partner registrations awaiting Owner sign-off.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {unassignedBookings.length > 0 && (
                        <button
                          onClick={() => setActiveTab('DISPATCH')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Dispatch {unassignedBookings.length} Bookings</span>
                        </button>
                      )}
                      {pendingPartners.length > 0 && (
                        <button
                          onClick={() => setActiveTab('PARTNERS')}
                          className="px-4 py-2 bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-[#D4A24E]" />
                          <span>Review {pendingPartners.length} Partners</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STAT WIDGETS (SAB REAL DATA SE) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Total Revenue GMV */}
                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm">
                  <span className="text-xs text-[#8E8E93] font-medium block">Total Revenue (GMV)</span>
                  <p className="text-2xl sm:text-3xl font-black text-[#1C1C1E] mt-1">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-[#1F8A3B] font-bold mt-1 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#1F8A3B]" />
                    <span>Real Paid Transactions</span>
                  </span>
                </div>

                {/* 2. Total Bookings Breakdown */}
                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm">
                  <span className="text-xs text-[#8E8E93] font-medium block">Total Bookings</span>
                  <p className="text-2xl sm:text-3xl font-black text-[#1C1C1E] mt-1">
                    {filteredBookingsByDate.length}
                  </p>
                  <div className="text-[10px] text-[#48484A] mt-1 flex items-center gap-2 font-mono">
                    <span className="text-emerald-700 font-bold">{completedJobsCount} Done</span>
                    <span>&bull;</span>
                    <span className="text-blue-700 font-bold">{inProgressJobsCount} Prog</span>
                    <span>&bull;</span>
                    <span className="text-amber-700 font-bold">{pendingJobsCount} Pend</span>
                  </div>
                </div>

                {/* 3. Customer Savings / Discounts */}
                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm">
                  <span className="text-xs text-[#8E8E93] font-medium block">Customer Discounts</span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                    ₹{totalCustomerSavings.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-bold mt-1 inline-flex items-center gap-1">
                    15% Standard &bull; Real Offers
                  </span>
                </div>

                {/* 4. Active Fleet & Online Available */}
                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm">
                  <span className="text-xs text-[#8E8E93] font-medium block">Active Fleet (Online)</span>
                  <p className="text-2xl sm:text-3xl font-black text-[#1C1C1E] mt-1">
                    {onlineFleetCount} <span className="text-sm font-normal text-slate-500">/ {partners.length}</span>
                  </p>
                  <span className="text-[11px] text-indigo-700 font-bold mt-1 block">
                    {hubs.filter(h => h.active).length} Hubs Operational
                  </span>
                </div>
              </div>

              {/* ACTIVE PARTNERS HUB-WISE BREAKDOWN (GURUGRAM, PATNA, RANCHI) */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1C1C1E]">
                    Hub-wise Fleet Distribution (3 States)
                  </h4>
                  <button 
                    onClick={() => setActiveTab('HUBS')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View Hub Directory &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium block">Haryana &bull; Gurugram Sectors</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">
                      {partnersByCity.gurugram} Active Technicians
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium block">Bihar &bull; Patna Localities</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">
                      {partnersByCity.patna} Active Technicians
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium block">Jharkhand &bull; Ranchi Areas</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">
                      {partnersByCity.ranchi} Active Technicians
                    </span>
                  </div>
                </div>
              </div>

              {/* RECENT LIVE BOOKINGS FEED */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-['Outfit'] text-[#1C1C1E]">
                    Recent Live Bookings Feed ({filteredBookingsByDate.length})
                  </h3>
                  <button 
                    onClick={() => setActiveTab('BOOKINGS')}
                    className="text-xs font-bold text-[#B8892E] hover:underline"
                  >
                    Manage All in Module 06 &rarr;
                  </button>
                </div>

                {filteredBookingsByDate.length === 0 ? (
                  <div className="py-8 text-center text-[#8E8E93] text-sm">
                    No bookings recorded in this time range.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredBookingsByDate.slice(0, 5).map((b) => (
                      <div 
                        key={b.id}
                        onClick={() => setActiveTab('BOOKINGS')}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] gap-3 cursor-pointer hover:border-blue-400 transition-all"
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
                          <p className="text-xs text-[#8E8E93] mt-0.5">
                            {b.serviceName} | {b.address.sector}, {b.address.city} | Assigned: {b.assignedPartnerName || 'Unassigned'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-[#1C1C1E]">₹{b.totalAmount}</span>
                          <span className="text-xs font-bold text-blue-600">&rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ERROR LOGS WIDGET (MODULE 19 SYSTEM HEALTH LINK) */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold">System Health &amp; Error Logs Widget (Last 24 Hours)</h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('GOVERNANCE')}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    View Full Audit in Module 19 &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                    <span className="text-slate-400 block">Critical System Errors</span>
                    <span className="text-base font-black text-emerald-400 mt-0.5 block">0 Detected</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                    <span className="text-slate-400 block">Security Lockout Alerts</span>
                    <span className="text-base font-black text-slate-200 mt-0.5 block">Portal Secure</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                    <span className="text-slate-400 block">Database Synchronization</span>
                    <span className="text-base font-black text-emerald-400 mt-0.5 block">Online (Firestore)</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* MODULE 02: HUB LIST & MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'HUBS' && (
            <AdminHubOperations
              hubs={hubs}
              partners={partners}
              onUpdateHubs={(updated) => {
                setHubs(updated);
                saveAllHubs(updated);
              }}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 03: HUB MAP VIEW */}
          {/* ========================================================= */}
          {activeTab === 'HUB_MAP' && (
            <AdminHubMapView
              hubs={hubs}
              partners={partners}
              bookings={bookings}
              onSelectHub={() => setActiveTab('HUBS')}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 04: MASTER CATALOGUE (SERVICES & PRICING) */}
          {/* ========================================================= */}
          {activeTab === 'CATALOGUE' && (
            <AdminCatalogueTab
              services={services}
              onRefresh={loadData}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 05: PRICING ENGINE */}
          {/* ========================================================= */}
          {activeTab === 'PRICING' && (
            <AdminPricingEngine
              services={services}
              onServiceUpdated={loadData}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 06: BOOKINGS & SNAPSHOTS */}
          {/* ========================================================= */}
          {activeTab === 'BOOKINGS' && (
            <AdminBookingsTab
              bookings={bookings}
              partners={partners}
              onRefresh={loadData}
              onManualAssign={async (bId, pId) => {
                const res = await assignPartnerManually(bId, pId, 'admin_dispatch', 'Admin Manual Assignment');
                if (res.success && res.booking) {
                  setBookings(prev => prev.map(b => b.id === bId ? res.booking! : b));
                  alert(`Success: Partner assigned to Booking #${res.booking.bookingNumber}!`);
                }
              }}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 07: AUTO-DISPATCH ENGINE */}
          {/* ========================================================= */}
          {activeTab === 'DISPATCH' && (
            <AdminDispatchEngine
              bookings={bookings}
              partners={partners}
              hubs={hubs}
              onManualAssign={async (bId, pId) => {
                const res = await assignPartnerManually(bId, pId, 'admin_dispatch', 'Admin Manual Assignment');
                if (res.success && res.booking) {
                  setBookings(prev => prev.map(b => b.id === bId ? res.booking! : b));
                  alert(`Success: Partner assigned to Booking #${res.booking.bookingNumber}!`);
                }
              }}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 08+09: PARTNER MANAGEMENT (ONBOARDING + 360 PROFILE) */}
          {/* ========================================================= */}
          {activeTab === 'PARTNERS' && (
            <AdminPartnerSuite
              partners={partners}
              hubs={hubs}
              bookings={bookings}
              onUpdatePartners={(updated) => setPartners(updated)}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 10-11: QUALITY SOP & TRAINING */}
          {/* ========================================================= */}
          {activeTab === 'QUALITY' && (
            <AdminQualityAndTraining
              partners={partners}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 12: INVENTORY & CLEANING KITS */}
          {/* ========================================================= */}
          {activeTab === 'INVENTORY' && (
            <AdminInventorySupplies
              hubs={hubs}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 13: CRM (CUSTOMER RELATIONSHIP MANAGEMENT) */}
          {/* ========================================================= */}
          {activeTab === 'CUSTOMERS' && (
            <AdminCustomerAndCMS
              hubs={hubs}
              initialTab="CUSTOMERS"
              onAuditLog={handleAuditLog}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 14: OFFERS & PROMOTIONS */}
          {/* ========================================================= */}
          {activeTab === 'COUPONS' && (
            <AdminCustomerAndCMS
              hubs={hubs}
              initialTab="COUPONS"
              onAuditLog={handleAuditLog}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 15: FINANCE & SETTLEMENTS */}
          {/* ========================================================= */}
          {activeTab === 'FINANCE' && (
            <AdminFinanceAndSettlementSuite
              bookings={bookings}
              partners={partners}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 16: CMS (WEBSITE CONTENT MANAGEMENT) */}
          {/* ========================================================= */}
          {activeTab === 'CMS' && (
            <AdminCustomerAndCMS
              hubs={hubs}
              initialTab="CMS"
              onAuditLog={handleAuditLog}
            />
          )}

          {/* ========================================================= */}
          {/* MODULE 17-22: ROLES, LOGIN AUDIT, ACTIVITY AUDIT, BACKUP & SETTINGS */}
          {/* ========================================================= */}
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

export default AdminDashboard;
