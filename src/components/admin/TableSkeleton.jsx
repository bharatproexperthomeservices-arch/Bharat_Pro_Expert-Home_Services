import React from 'react';
import Skeleton from '../Skeleton';

/**
 * Skeleton Loader for Admin Data Tables (Services Manager & Partners List)
 * Displays skeleton table headers, avatar circles, text lines, badges, and action buttons
 *
 * @param {Object} props
 * @param {number} [props.rows=6] - Number of skeleton rows to render
 * @param {number} [props.columns=5] - Number of columns in table
 */
export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
      {/* Table Top Toolbar Skeleton */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4">
        <Skeleton variant="rectangle" height={38} className="w-64 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton variant="rectangle" height={38} className="w-28 rounded-xl" />
          <Skeleton variant="rectangle" height={38} className="w-32 rounded-xl" />
        </div>
      </div>

      {/* Table Layout Skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <th className="py-3 px-4 w-12">
                <Skeleton variant="rectangle" height={16} className="w-5 rounded" />
              </th>
              <th className="py-3 px-4">
                <Skeleton variant="line" height={16} className="w-32" />
              </th>
              <th className="py-3 px-4">
                <Skeleton variant="line" height={16} className="w-24" />
              </th>
              <th className="py-3 px-4">
                <Skeleton variant="line" height={16} className="w-20" />
              </th>
              <th className="py-3 px-4">
                <Skeleton variant="line" height={16} className="w-20" />
              </th>
              <th className="py-3 px-4 text-right">
                <Skeleton variant="line" height={16} className="w-16 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                <td className="py-4 px-4">
                  <Skeleton variant="circle" className="w-8 h-8" />
                </td>
                <td className="py-4 px-4 space-y-1">
                  <Skeleton variant="line" height={16} className="w-48" />
                  <Skeleton variant="line" height={12} className="w-28" />
                </td>
                <td className="py-4 px-4">
                  <Skeleton variant="rectangle" height={24} className="w-24 rounded-full" />
                </td>
                <td className="py-4 px-4">
                  <Skeleton variant="line" height={16} className="w-16" />
                </td>
                <td className="py-4 px-4">
                  <Skeleton variant="rectangle" height={22} className="w-20 rounded-md" />
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-end gap-2">
                    <Skeleton variant="rectangle" height={32} className="w-8 rounded-lg" />
                    <Skeleton variant="rectangle" height={32} className="w-8 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableSkeleton;
