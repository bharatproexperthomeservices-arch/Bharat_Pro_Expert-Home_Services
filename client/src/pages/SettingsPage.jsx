import React from 'react';
import { Settings as SettingsIcon, Shield, User, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';

const MOCK_ROLES = [
  { id: 'user_admin_1', name: 'Super Admin', role: 'SUPER_ADMIN', email: 'admin@bharatpro.in' },
  { id: 'user_city_1', name: 'City Manager (Gurugram)', role: 'CITY_MANAGER', email: 'cm.gurugram@bharatpro.in' },
  { id: 'user_quality_1', name: 'Quality Lead', role: 'QUALITY_LEAD', email: 'quality@bharatpro.in' },
  { id: 'user_fin_1', name: 'Finance Lead', role: 'FINANCE_ADMIN', email: 'finance@bharatpro.in' }
];

export function SettingsPage() {
  const { currentUser, setCurrentUser, showToast } = useStore();

  const handleSwitchRole = (roleUser) => {
    setCurrentUser(roleUser);
    showToast(`Switched active operational role to ${roleUser.role} (${roleUser.name})`, 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings & RBAC</h1>
        <p className="text-sm text-gray-500">
          Role-based access control and active operational session switching
        </p>
      </div>

      {/* Current Active Context */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
          <User className="w-4 h-4 text-emerald-600" />
          <span>Current Active Admin Session</span>
        </h2>

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
          <div>
            <p className="font-bold text-emerald-950 text-base">{currentUser?.name}</p>
            <p className="text-xs text-emerald-700">{currentUser?.email}</p>
          </div>
          <span className="px-3 py-1 bg-emerald-700 text-white font-mono text-xs font-bold rounded-lg shadow-xs">
            {currentUser?.role}
          </span>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
          <Shield className="w-4 h-4 text-slate-700" />
          <span>Switch Operational Persona (Mocked RBAC)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_ROLES.map((r) => {
            const isCurrent = currentUser?.id === r.id;

            return (
              <div
                key={r.id}
                onClick={() => handleSwitchRole(r)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-slate-400'
                }`}
              >
                <div>
                  <p className="font-bold text-sm">{r.name}</p>
                  <p className={`text-xs mt-0.5 ${isCurrent ? 'text-slate-300' : 'text-gray-500'}`}>{r.email}</p>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-extrabold font-mono ${
                      isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {r.role}
                  </span>
                </div>

                {isCurrent && <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
