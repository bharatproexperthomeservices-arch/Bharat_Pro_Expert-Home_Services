import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CalendarCheck,
  Send,
  CreditCard,
  FileText,
  Settings,
  ShieldAlert,
  Bell
} from 'lucide-react';
import { useStore } from '../store/useStore';

export function Layout() {
  const { currentUser, toast, clearToast } = useStore();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Partners', path: '/partners', icon: Users },
    { label: 'KYC Queue', path: '/kyc-queue', icon: ShieldCheck },
    { label: 'Bookings', path: '/bookings', icon: CalendarCheck },
    { label: 'Dispatch', path: '/dispatch', icon: Send },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Audit Log', path: '/audit-log', icon: FileText },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
            <div className="bg-emerald-500 text-slate-900 p-2 rounded-lg font-black text-xl tracking-wider">
              BP
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Bharat Pro</h1>
              <p className="text-xs text-slate-400">Operations Portal</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm">
              {currentUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
              <p className="text-xs text-emerald-400 font-mono font-medium">{currentUser?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Operational Brain Active
            </span>
            <span className="text-xs text-gray-500">Double-Entry Ledger & State Machine Enforced</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
              </button>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Logged in as</span>
              <span className="text-sm font-medium text-gray-800">{currentUser?.email}</span>
            </div>
          </div>
        </header>

        {/* Global Toast Notification */}
        {toast && (
          <div
            className={`px-6 py-3 border-b flex items-center justify-between text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{toast.message}</span>
            </div>
            <button onClick={clearToast} className="text-xs underline hover:opacity-80">
              Dismiss
            </button>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
