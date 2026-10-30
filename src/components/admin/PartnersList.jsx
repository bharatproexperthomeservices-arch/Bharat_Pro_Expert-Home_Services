import React from 'react';
import TableSkeleton from './TableSkeleton';

/**
 * Admin Partners List Component
 * Displays partner applications and verified experts table.
 * Renders TableSkeleton when isLoading is true.
 */
export function PartnersList({ isLoading = false, partners = [], onVerify, onContact }) {
  if (isLoading) {
    return <TableSkeleton rows={6} columns={6} />;
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4">
        <input
          type="search"
          placeholder="Search partners by name or phone..."
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm w-72 text-slate-800 dark:text-white"
        />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Total Partners: {partners.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold">
              <th className="py-3 px-4">Partner Name</th>
              <th className="py-3 px-4">Mobile Number</th>
              <th className="py-3 px-4">City</th>
              <th className="py-3 px-4">Skill</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {partners.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{p.name}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.phone}</td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{p.city}</td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{p.skill}</td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Verified
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => onContact && onContact(p)}
                    className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-100"
                  >
                    Call Partner
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PartnersList;
