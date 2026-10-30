import React from 'react';
import TableSkeleton from './TableSkeleton';

/**
 * Admin Services Manager Component
 * Displays 64 cleaning services table with search & edit options.
 * Renders TableSkeleton when isLoading is true.
 */
export function ServicesManager({ isLoading = false, services = [], onEdit, onDelete }) {
  if (isLoading) {
    return <TableSkeleton rows={8} columns={5} />;
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4">
        <input
          type="search"
          placeholder="Search services..."
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm w-64 text-slate-800 dark:text-white"
        />
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + Add Service
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold">
              <th className="py-3 px-4">Icon</th>
              <th className="py-3 px-4">Service Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Rating</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-3 px-4 text-xl">{s.emoji || '✨'}</td>
                <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{s.name}</td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{s.cat}</td>
                <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">₹{s.price}</td>
                <td className="py-3 px-4 text-amber-500 font-medium">★ {s.rating || 5.0}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => onEdit && onEdit(s)}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete && onDelete(s.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-100"
                  >
                    Delete
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

export default ServicesManager;
