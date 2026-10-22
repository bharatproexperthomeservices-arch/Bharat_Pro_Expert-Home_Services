import React, { useState, useEffect } from 'react';
import { Booking, Partner, HubLocation, CleaningService } from '../types';
import {
  getAllBookings,
  getPartnersList,
  assignPartnerManually,
  getAllServices,
  getAllHubs,
  saveAllHubs
} from '../services/dbService';
import { OWNER_EMAIL } from '../services/emailService';
import {
  approvePartnerAndMakeIdLive,
  rejectPartnerApplication,
  deletePartner
} from '../services/partnerAuthService';
import { AdminLayout } from './admin/AdminLayout';
import { HubManagement } from './admin/HubManagement';
import { PartnerOnboarding } from './admin/PartnerOnboarding';
import { LiveDispatch } from './admin/LiveDispatch';
import { ServiceCatalog } from './admin/ServiceCatalog';
import { AdvancedModules } from './admin/AdvancedModules';
import { AdminExecutiveOverview } from './admin/AdminExecutiveOverview';
import { AdminFinanceAndSettlementSuite } from './admin/AdminFinanceAndSettlementSuite';

interface AdminDashboardProps {
  onBackToCustomerSite: () => void;
  onSignOut: () => void;
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [hubs, setHubs] = useState<HubLocation[]>([]);
  const [services, setServices] = useState<CleaningService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [bks, prts, srvs, loadedHubs] = await Promise.all([
        getAllBookings(),
        getPartnersList(),
        getAllServices(),
        getAllHubs()
      ]);
      setBookings(bks || []);
      setPartners(prts || []);
      setServices(srvs || []);
      setHubs(loadedHubs || []);
    } catch (e: any) {
      console.warn('Error loading admin data', e);
      setLoadError(e?.message || 'Failed to load live database. Click refresh to retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingPartners = partners.filter(p => p.status === 'pending');
  const unassignedBookings = bookings.filter(
    b => b.status === 'SEARCHING_PROFESSIONAL' || b.status === 'CONFIRMED' || !b.assignedPartnerId
  );

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
      alert(`Partner ${res.partner.name} approved! Confirmation dispatched to ${OWNER_EMAIL}.`);
    } else {
      alert(`Approval error: ${res.error || 'Failed to approve partner'}`);
    }
  };

  const handleRejectPartner = async (partnerId: string) => {
    const reason = window.prompt('Enter rejection reason:', 'Incomplete documentation or unverified credentials');
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
      `CRITICAL WARNING: Permanently delete partner "${target?.name || partnerId}"? This action is irreversible.`
    );
    if (!confirmed) return;
    const res = await deletePartner(partnerId, 'admin_owner');
    if (res.success) {
      setPartners(prev => prev.filter(p => p.id !== partnerId));
      alert(`Partner permanently deleted.`);
    } else {
      alert(`Delete error: ${res.error || 'Failed to delete partner'}`);
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      counts={{
        bookings: bookings.length,
        unassigned: unassignedBookings.length,
        pendingPartners: pendingPartners.length
      }}
      loading={loading}
      onRefresh={loadData}
      onBackToCustomerSite={onBackToCustomerSite}
      onSignOut={onSignOut}
    >
      {loadError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-4 py-3 flex items-center justify-between gap-3 mb-4">
          <span>{loadError}</span>
          <button onClick={loadData} className="underline font-bold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {activeTab === 'OVERVIEW' && (
        <AdminExecutiveOverview
          bookings={bookings}
          partners={partners}
          unassignedCount={unassignedBookings.length}
          pendingPartnersCount={pendingPartners.length}
          onNavigate={setActiveTab}
        />
      )}

      {(activeTab === 'HUBS' || activeTab === 'HUB_MAP') && (
        <HubManagement
          hubs={hubs}
          partners={partners}
          onUpdateHubs={(updated) => {
            setHubs(updated);
            saveAllHubs(updated);
          }}
          onAuditLog={handleAuditLog}
        />
      )}

      {activeTab === 'PARTNERS' && (
        <PartnerOnboarding
          partners={partners}
          hubs={hubs}
          onVerifyPartner={handleVerifyPartner}
          onRejectPartner={handleRejectPartner}
          onDeletePartner={handleDeletePartner}
          onAuditLog={handleAuditLog}
        />
      )}

      {(activeTab === 'DISPATCH' || activeTab === 'LIVE_OPS' || activeTab === 'BOOKINGS') && (
        <LiveDispatch
          bookings={bookings}
          partners={partners}
          hubs={hubs}
          onManualAssign={handleManualAssign}
          onAuditLog={handleAuditLog}
        />
      )}

      {(activeTab === 'CATALOGUE' || activeTab === 'PRICING' || activeTab === 'COUPONS') && (
        <ServiceCatalog
          services={services}
          onRefresh={loadData}
          onAuditLog={handleAuditLog}
        />
      )}

      {activeTab === 'FINANCE' && (
        <AdminFinanceAndSettlementSuite
          bookings={bookings}
          partners={partners}
          onAuditLog={handleAuditLog}
        />
      )}

      {(activeTab === 'QUALITY' || activeTab === 'INVENTORY' || activeTab === 'GOVERNANCE' || activeTab === 'CUSTOMERS' || activeTab === 'CMS' || activeTab === 'AI_DEVELOPER' || activeTab === 'AUTOMATION' || activeTab === 'AI_QUEUE') && (
        <AdvancedModules />
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
