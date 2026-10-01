import React, { useState, useEffect } from 'react';
import { Booking, Partner, HubLocation, CleaningService, WhatsAppLog, AdminLoginRequest } from '../types';
import {
  getAllBookings,
  getPartnersList,
  assignPartnerManually,
  getWhatsAppLogs,
  getAllServices,
  getAllHubs,
  saveAllHubs
} from '../services/dbService';
import { OWNER_EMAIL } from '../services/emailService';
import {
  clearAdminSession,
  getAllAdminRequests,
  approveAdminLogin,
  rejectAdminLogin,
  updateAdminActivity
} from '../services/adminAuthService';
import {
  approvePartnerAndMakeIdLive,
  rejectPartnerApplication,
  deletePartner
} from '../services/partnerAuthService';
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
import { AdminSidebar, ADMIN_TAB_META } from './admin/AdminSidebar';
import { AdminExecutiveOverview } from './admin/AdminExecutiveOverview';
import { AdminLiveOperationsTab } from './admin/AdminLiveOperationsTab';
import { AdminAiDeveloperTab } from './admin/AdminAiDeveloperTab';
import { AdminAutomationAgentTab } from './admin/AdminAutomationAgentTab';
import { AdminAiTaskQueueTab } from './admin/AdminAiTaskQueueTab';
import { ArrowLeft, RefreshCw, LogOut } from 'lucide-react';

interface AdminDashboardProps {
  onBackToCustomerSite: () => void;
  onSignOut?: () => void;
}

export type AdminModuleTab =
  | 'OVERVIEW'
  | 'HUBS'
  | 'HUB_MAP'
  | 'CATALOGUE'
  | 'PRICING'
  | 'BOOKINGS'
  | 'DISPATCH'
  | 'PARTNERS'
  | 'QUALITY'
  | 'INVENTORY'
  | 'CUSTOMERS'
  | 'COUPONS'
  | 'FINANCE'
  | 'CMS'
  | 'GOVERNANCE'
  | 'LIVE_OPS'
  | 'AI_DEVELOPER'
  | 'AUTOMATION'
  | 'AI_QUEUE';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToCustomerSite,
  onSignOut
}) => {
  const [activeTab, setActiveTab] = useState<AdminModuleTab>('OVERVIEW');
  const [navOpen, setNavOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  // FIX: no demo data at start. Everything comes only from the database.
  const [hubs, setHubs] = useState<HubLocation[]>([]);
  const [services, setServices] = useState<CleaningService[]>([]);
  const [waLogs, setWaLogs] = useState<WhatsAppLog[]>([]);
  const [adminRequests, setAdminRequests] = useState<AdminLoginRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Admin state
  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [bks, prts, logs, srvs, loadedHubs, reqs] = await Promise.all([
        getAllBookings(),
        getPartnersList(),
        getWhatsAppLogs(),
        getAllServices(),
        getAllHubs(),
        getAllAdminRequests()
      ]);
      setBookings(bks || []);
      setPartners(prts || []);
      setWaLogs(logs || []);
      setAdminRequests(reqs || []);
      // FIX: always use what the database returned, even if it is empty.
      setServices(srvs || []);
      setHubs(loadedHubs || []);
    } catch (e: any) {
      console.warn('Error loading admin data', e);
      setLoadError(e?.message || 'Data load nahi ho paya. Reload karke dekho.');
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
    const handlePartnersUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setPartners(e.detail);
      else loadData();
    };

    window.addEventListener('bharatpro_booking_updated', handleBookingUpdated);
    window.addEventListener('bharatpro_services_updated', handleServicesUpdated);
    window.addEventListener('bharatpro_partners_updated', handlePartnersUpdated);

    return () => {
      window.removeEventListener('bharatpro_booking_updated', handleBookingUpdated);
      window.removeEventListener('bharatpro_services_updated', handleServicesUpdated);
      window.removeEventListener('bharatpro_partners_updated', handlePartnersUpdated);
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
  const unassignedBookings = bookings.filter(
    b => b.status === 'SEARCHING_PROFESSIONAL' || b.status === 'CONFIRMED' || !b.assignedPartnerId
  );

  const handleApproveAdminRequest = async (reqId: string) => {
    const res = await approveAdminLogin(reqId, OWNER_EMAIL);
    if (res.success) {
      setAdminRequests(prev => prev.map(r => (r.id === reqId ? res.request! : r)));
      alert(`Admin access approved for ${res.request?.requesterEmail}! Confirmation dispatched to ${OWNER_EMAIL}.`);
    }
  };

  const handleRejectAdminRequest = async (reqId: string) => {
    const reason = window.prompt('Reason for rejecting admin login:', 'Unauthorized external attempt');
    if (!reason) return;
    const res = await rejectAdminLogin(reqId, reason);
    if (res.success) {
      setAdminRequests(prev => prev.map(r => (r.id === reqId ? res.request! : r)));
      alert(`Admin login request rejected. Alert dispatched to ${OWNER_EMAIL}.`);
    }
  };

  const handleAuditLog = (action: string, targetId: string, details: string) => {
    console.log(`[AUDIT] Action: ${action} | Target: ${targetId} | Details: ${details}`);
  };

  const handleManualAssign = async (bId: string, pId: string) => {
    const res = await assignPartnerManually(bId, pId, 'admin_dispatch', 'Admin Manual Assignment');
    if (res.success && res.booking) {
      setBookings(prev => prev.map(b => (b.id === bId ? res.booking! : b)));
      alert(`Success: Partner assigned to Booking #${res.booking.bookingNumber}!`);
    }
  };

  const handleVerifyPartner = async (partnerId: string) => {
    const res = await approvePartnerAndMakeIdLive(partnerId, { approvedBy: OWNER_EMAIL });
    if (res.success && res.partner) {
      setPartners(prev => prev.map(p => (p.id === partnerId ? res.partner! : p)));
      alert(`Partner ${res.partner.name} approved! Login ID: ${res.partner.loginUserId}. Confirmation dispatched to ${OWNER_EMAIL}.`);
    } else {
      alert(`Approval error: ${res.error || 'Failed to approve partner'}`);
    }
  };

  const handleRejectPartner = async (partnerId: string) => {
    const reason = window.prompt('Partner application reject karne ka reason likhein:', 'Incomplete documentation or unverified credentials');
    if (!reason) return;
    const res = await rejectPartnerApplication(partnerId, reason);
    if (res.success && res.partner) {
      setPartners(prev => prev.map(p => (p.id === partnerId ? res.partner! : p)));
      alert(`Partner ${res.partner.name} application has been rejected.`);
    } else {
      alert(`Error: ${res.error || 'Failed to reject partner'}`);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    const target = partners.find(p => p.id === partnerId);
    const confirmed = window.confirm(
      `CRITICAL WARNING: Kya aap sach me partner "${target?.name || partnerId}" aur unke saare documents ko permanently delete karna chahte hain? Ye wapas nahi aayega.`
    );
    if (!confirmed) return;
    const res = await deletePartner(partnerId, 'admin_owner');
    if (res.success) {
      setPartners(prev => prev.filter(p => p.id !== partnerId));
      alert(`Partner "${target?.name || partnerId}" permanently delete ho gaya hai.`);
    } else {
      alert(`Delete error: ${res.error || 'Failed to delete partner'}`);
    }
  };

  const notificationCount = unassignedBookings.length + pendingPartners.length + pendingAdminRequests.length;

  return (
    <div className="min-h-screen bg-[#F3F6FB] text-slate-900 flex font-['Plus_Jakarta_Sans']">
      {/* Left Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onChange={setActiveTab}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        counts={{
          bookings: bookings.length,
          unassigned: unassignedBookings.length,
          pendingPartners: pendingPartners.length
        }}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setNavOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-900 text-sm font-bold cursor-pointer"
              aria-label="Open menu"
            >
              &#9776;
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                {ADMIN_TAB_META[activeTab].title}
              </h1>
              <p className="text-[11px] text-slate-500 truncate">{ADMIN_TAB_META[activeTab].subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled
              title="Global search is not available yet"
              className="hidden lg:inline-flex px-4 py-2 rounded-full bg-indigo-50 text-indigo-300 text-[11px] font-bold cursor-not-allowed"
            >
              Global Search
            </button>
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              title="Items needing action"
              className="hidden sm:inline-flex px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold cursor-pointer"
            >
              Notifications{notificationCount > 0 ? ` (${notificationCount})` : ''}
            </button>
            <span className="hidden sm:inline-flex px-4 py-2 rounded-full bg-[#0B1220] text-white text-[11px] font-bold">
              Super Admin
            </span>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 cursor-pointer"
              title="Reload live database metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onBackToCustomerSite}
              className="hidden md:inline-flex px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-[11px] font-bold items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Customer Website
            </button>
            {/* FIX: "Purana Data Delete / Reset" button removed. It re-seeded demo data. */}
            <button
              onClick={() => {
                clearAdminSession();
                if (onSignOut) {
                  onSignOut();
                } else {
                  onBackToCustomerSite();
                }
              }}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer border border-rose-200"
              title="Sign out of Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Admin Pane */}
        <main className="flex-1 p-4 sm:p-8 space-y-6">
          {loadError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-4 py-3 flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <button onClick={loadData} className="underline font-bold cursor-pointer">
                Dobara try karo
              </button>
            </div>
          )}

          {/* EXECUTIVE DASHBOARD */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <AdminExecutiveOverview
                bookings={bookings}
                partners={partners}
                unassignedCount={unassignedBookings.length}
                pendingPartnersCount={pendingPartners.length}
                onNavigate={setActiveTab}
              />
            </div>
          )}

          {/* HUBS & INDIA MAP (toggle) */}
          {(activeTab === 'HUBS' || activeTab === 'HUB_MAP') && (
            <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
              <button
                onClick={() => setActiveTab('HUBS')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  activeTab === 'HUBS' ? 'bg-[#2563EB] text-white' : 'text-slate-600'
                }`}
              >
                Hub List
              </button>
              <button
                onClick={() => setActiveTab('HUB_MAP')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  activeTab === 'HUB_MAP' ? 'bg-[#2563EB] text-white' : 'text-slate-600'
                }`}
              >
                India Map
              </button>
            </div>
          )}

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

          {activeTab === 'HUB_MAP' && (
            <AdminHubMapView
              hubs={hubs}
              partners={partners}
              bookings={bookings}
              onSelectHub={() => setActiveTab('HUBS')}
            />
          )}

          {activeTab === 'CATALOGUE' && <AdminCatalogueTab services={services} onRefresh={loadData} />}

          {activeTab === 'PRICING' && <AdminPricingEngine services={services} onServiceUpdated={loadData} />}

          {activeTab === 'BOOKINGS' && (
            <AdminBookingsTab
              bookings={bookings}
              partners={partners}
              onRefresh={loadData}
              onManualAssign={handleManualAssign}
            />
          )}

          {activeTab === 'DISPATCH' && (
            <AdminDispatchEngine
              bookings={bookings}
              partners={partners}
              hubs={hubs}
              onManualAssign={handleManualAssign}
              onAuditLog={handleAuditLog}
            />
          )}

          {activeTab === 'PARTNERS' && (
            <AdminPartnerSuite
              partners={partners}
              hubs={hubs}
              bookings={bookings}
              onUpdatePartners={(updated) => setPartners(updated)}
              onVerifyPartner={handleVerifyPartner}
              onRejectPartner={handleRejectPartner}
              onDeletePartner={handleDeletePartner}
              onAuditLog={handleAuditLog}
            />
          )}

          {activeTab === 'QUALITY' && <AdminQualityAndTraining partners={partners} onAuditLog={handleAuditLog} />}

          {activeTab === 'INVENTORY' && <AdminInventorySupplies hubs={hubs} onAuditLog={handleAuditLog} />}

          {activeTab === 'CUSTOMERS' && (
            <AdminCustomerAndCMS hubs={hubs} initialTab="CUSTOMERS" onAuditLog={handleAuditLog} />
          )}

          {activeTab === 'COUPONS' && (
            <AdminCustomerAndCMS hubs={hubs} initialTab="COUPONS" onAuditLog={handleAuditLog} />
          )}

          {activeTab === 'FINANCE' && (
            <AdminFinanceAndSettlementSuite bookings={bookings} partners={partners} onAuditLog={handleAuditLog} />
          )}

          {activeTab === 'CMS' && <AdminCustomerAndCMS hubs={hubs} initialTab="CMS" onAuditLog={handleAuditLog} />}

          {activeTab === 'GOVERNANCE' && (
            <AdminGovernanceAndAudit bookings={bookings} partners={partners} hubs={hubs} onAuditLog={handleAuditLog} />
          )}

          {activeTab === 'LIVE_OPS' && <AdminLiveOperationsTab bookings={bookings} partners={partners} />}

          {activeTab === 'AI_DEVELOPER' && <AdminAiDeveloperTab />}

          {activeTab === 'AUTOMATION' && <AdminAutomationAgentTab />}

          {activeTab === 'AI_QUEUE' && <AdminAiTaskQueueTab />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
