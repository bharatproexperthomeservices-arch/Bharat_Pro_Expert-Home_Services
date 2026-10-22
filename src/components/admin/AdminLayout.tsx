import React, { useState } from 'react';
import { AdminSidebar, ADMIN_TAB_META, AdminSidebarCounts } from './AdminSidebar';
import type { AdminModuleTab } from '../AdminDashboard';
import { ArrowLeft, RefreshCw, LogOut, Bell, Search, Shield } from 'lucide-react';
import { clearAdminSession } from '../../services/adminAuthService';

interface AdminLayoutProps {
  activeTab: AdminModuleTab;
  setActiveTab: (tab: AdminModuleTab) => void;
  counts: AdminSidebarCounts;
  loading: boolean;
  onRefresh: () => void;
  onBackToCustomerSite: () => void;
  onSignOut: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  setActiveTab,
  counts,
  loading,
  onRefresh,
  onBackToCustomerSite,
  onSignOut,
  children
}) => {
  const [navOpen, setNavOpen] = useState(false);
  const meta = ADMIN_TAB_META[activeTab] || { title: 'Admin Command Center', subtitle: '360° Operations Management' };

  const notificationCount = counts.unassigned + counts.pendingPartners;

  return (
    <div className="min-h-screen bg-[#F3F6FB] text-slate-900 flex font-['Plus_Jakarta_Sans']">
      <AdminSidebar
        activeTab={activeTab}
        onChange={setActiveTab}
        counts={counts}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setNavOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-900 text-sm font-bold cursor-pointer"
              aria-label="Open sidebar"
            >
              &#9776;
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                  {meta.title}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  <Shield className="w-3 h-3 text-blue-600" />
                  Live 360°
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{meta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B1220] text-white text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              BharatPro Super Admin
            </span>

            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 cursor-pointer"
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

            <button
              onClick={() => {
                clearAdminSession();
                onSignOut();
              }}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer border border-rose-200"
              title="Sign out of Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* View Main Workspace */}
        <main className="flex-1 p-4 sm:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
