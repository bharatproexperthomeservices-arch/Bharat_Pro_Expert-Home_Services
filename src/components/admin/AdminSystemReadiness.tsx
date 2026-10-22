import React from 'react';
import { AlertTriangle, CheckCircle2, CircleHelp, Database, ShieldCheck, Workflow } from 'lucide-react';
import type { Booking, Partner, HubLocation, CleaningService } from '../../types';

interface AdminSystemReadinessProps {
  bookings: Booking[];
  partners: Partner[];
  hubs: HubLocation[];
  services: CleaningService[];
  loading: boolean;
}

/**
 * Read-only operational snapshot. It deliberately does not claim that external
 * integrations (payments, maps, email, backups) are healthy without server-side
 * probes or provider APIs.
 */
export const AdminSystemReadiness: React.FC<AdminSystemReadinessProps> = ({
  bookings, partners, hubs, services, loading
}) => {
  const checks = [
    { title: 'Admin authentication and authorization', detail: 'Verify owner/admin roles on the server and Firebase Security Rules.', state: 'Needs security audit' },
    { title: 'Payment gateway reconciliation', detail: 'Verify provider-side order/payment status and webhook signatures server-side.', state: 'Needs provider test' },
    { title: 'Firestore rules and least privilege', detail: 'Test customer, partner, hub manager, and owner access with separate accounts.', state: 'Needs rules test' },
    { title: 'Backup and restore drill', detail: 'Confirm automated backups and complete a restore test before production changes.', state: 'Needs restore test' },
    { title: 'Maps, geofencing, and location permissions', detail: 'Confirm configured Maps APIs, billing, allowed domains, and boundary validation.', state: 'Needs integration test' },
    { title: 'Production deployment and rollback', detail: 'Confirm Vercel build, domain, environment variables, and rollback procedure.', state: 'Needs deployment check' }
  ];

  const metrics = [
    { label: 'Bookings loaded', value: bookings.length, icon: Workflow },
    { label: 'Partners loaded', value: partners.length, icon: ShieldCheck },
    { label: 'Hubs loaded', value: hubs.length, icon: Database },
    { label: 'Services loaded', value: services.length, icon: CheckCircle2 }
  ];

  return (
    <section className="space-y-6" aria-labelledby="system-readiness-title">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 id="system-readiness-title" className="font-extrabold text-amber-950">Production Readiness — Verification Required</h2>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              This panel separates data currently loaded by the Admin UI from integrations that still require independent verification.
              A visible module does not, by itself, prove that its backend workflow is production-ready.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">{label}</span>
              <Icon className="h-5 w-5 text-blue-700" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-950">{loading ? '…' : value}</p>
            <p className="mt-1 text-xs text-slate-500">{loading ? 'Refreshing data' : 'Returned to this browser session'}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <CircleHelp className="h-5 w-5 text-blue-700" />
          <h3 className="text-base font-extrabold text-slate-900">Release gate checklist</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {checks.map((check) => (
            <div key={check.title} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <p className="font-bold text-slate-800">{check.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{check.detail}</p>
              </div>
              <span className="inline-flex w-fit shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                {check.state}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdminSystemReadiness;
