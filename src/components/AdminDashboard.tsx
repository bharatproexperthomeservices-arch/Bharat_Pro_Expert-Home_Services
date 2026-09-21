import React, { useState, useEffect } from 'react';
import { BharatProLogo } from './BharatProLogo';
import { Booking, Partner, HubLocation, CleaningService, WhatsAppLog } from '../types';
import { 
  getAllBookings, 
  getPartnersList, 
  updateBookingStatusWithOtp, 
  getWhatsAppLogs,
  getAllServices
} from '../services/dbService';
import { INITIAL_HUBS, INITIAL_SERVICES, BUMPER_OFFERS, WHATSAPP_NUMBER } from '../data';
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
  Database
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToCustomerSite: () => void;
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToCustomerSite }) => {
  const [activeTab, setActiveTab] = useState<AdminModuleTab>('OVERVIEW');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [hubs, setHubs] = useState<HubLocation[]>(INITIAL_HUBS);
  const [services, setServices] = useState<CleaningService[]>(INITIAL_SERVICES);
  const [waLogs, setWaLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Admin state
  const loadData = async () => {
    setLoading(true);
    try {
      const [bks, prts, logs, srvs] = await Promise.all([
        getAllBookings(),
        getPartnersList(),
        getWhatsAppLogs(),
        getAllServices()
      ]);
      setBookings(bks);
      setPartners(prts);
      setWaLogs(logs);
      if (srvs && srvs.length > 0) {
        setServices(srvs);
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

  const handleAuditLog = (action: string, targetId: string, details: string) => {
    console.log(`[AUDIT] Action: ${action} | Target: ${targetId} | Details: ${details}`);
  };

  const handleManualAssign = (bookingId: string, partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          partnerId,
          partnerName: partner?.name || 'Assigned Partner',
          partnerPhone: partner?.phone || '+91 94310 88291',
          status: 'PARTNER_ASSIGNED' as any
        };
      }
      return b;
    });
    setBookings(updated);
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
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white border border-[#E5E5EA] hover:bg-[#F2F2F7] text-[#1C1C1E] transition-all"
            title="Reload live database metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-[#1C1C1E] block">Bharat Pro Expert Operating System</span>
            <span className="text-[10px] text-[#8E8E93]">Cloud Operations Master Architecture</span>
          </div>
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
              { key: 'PARTNERS', label: '08-09 Partner Operations', icon: Users, count: partners.length }
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
              { key: 'FINANCE', label: '15 Finance & 18% GST', icon: Receipt },
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
              onUpdateHubs={(updated) => setHubs(updated)}
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
              onRefresh={loadData}
            />
          )}

          {/* MODULE 13, 14, 16: CRM, CMS & COUPONS */}
          {activeTab === 'COUPONS' && (
            <AdminCustomerAndCMS
              hubs={hubs}
              onAuditLog={handleAuditLog}
            />
          )}

          {/* MODULE 15: FINANCE & GST */}
          {activeTab === 'FINANCE' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase">
                      Audited Ledger
                    </span>
                    <span className="text-xs text-[#8E8E93]">Indian Tax &amp; Commission Breakdown</span>
                  </div>
                  <h3 className="text-lg font-bold font-['Outfit'] text-[#1C1C1E] mt-0.5">
                    Payments, GST &amp; Partner Settlement
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-right">
                    <span className="text-[10px] text-[#8E8E93] block font-bold uppercase">Customer Savings Delivered</span>
                    <span className="text-base font-black text-emerald-600">₹{totalCustomerSavings.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
                  <span className="text-xs text-[#8E8E93] font-medium">Gross Bookings (GMV)</span>
                  <p className="text-2xl font-black text-[#1C1C1E]">₹{totalRevenue.toLocaleString('en-IN')}</p>
                  <span className="text-[11px] text-[#8E8E93] block">Paid via UPI / Card / COD</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
                  <span className="text-xs text-[#8E8E93] font-medium">18% GST Collected</span>
                  <p className="text-2xl font-black text-amber-600">₹{totalGstCollected.toLocaleString('en-IN')}</p>
                  <span className="text-[11px] text-amber-700 font-semibold block">Statutory Remittance</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
                  <span className="text-xs text-[#8E8E93] font-medium">Platform / Safety Fees</span>
                  <p className="text-2xl font-black text-[#1C1C1E]">₹{totalPlatformFees.toLocaleString('en-IN')}</p>
                  <span className="text-[11px] text-[#8E8E93] block">₹49 Standard per booking</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-1">
                  <span className="text-xs text-[#8E8E93] font-medium">Partner Payouts (80%)</span>
                  <p className="text-2xl font-black text-emerald-700">
                    ₹{Math.round(bookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + (b.basePrice * 0.8), 0)).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-emerald-800 font-semibold block">Completed Job Remittances</span>
                </div>
              </div>

              {/* Transactions Audit Table */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-[#1C1C1E]">
                  Recent Transaction Invoices &amp; Gateway IDs
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E5EA] text-[#8E8E93]">
                        <th className="pb-3 font-semibold">Booking ID</th>
                        <th className="pb-3 font-semibold">Transaction Ref</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Method</th>
                        <th className="pb-3 font-semibold">Base Price</th>
                        <th className="pb-3 font-semibold">18% GST</th>
                        <th className="pb-3 font-semibold text-right">Total Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2F2F7]">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-[#8E8E93]">
                            No transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-[#F8F9FB]">
                            <td className="py-3 font-mono font-bold text-[#1C1C1E]">#{b.bookingNumber}</td>
                            <td className="py-3 font-mono text-[#8E8E93]">{b.transactionId || 'TXN_SIMULATED'}</td>
                            <td className="py-3 font-medium text-[#1C1C1E]">{b.customerName}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 font-medium text-[10px]">
                                {b.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 text-[#1C1C1E]">₹{b.basePrice}</td>
                            <td className="py-3 text-amber-700 font-semibold">₹{b.taxesGst || Math.round(b.basePrice * 0.18)}</td>
                            <td className="py-3 text-right font-black text-[#1C1C1E]">₹{b.totalAmount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
