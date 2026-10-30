import React from 'react';
import Skeleton from '../Skeleton';

/**
 * Skeleton Loader for Admin Bookings Kanban Board
 * Displays 4 Kanban columns with shimmering card placeholders in each column
 */
export function BookingsKanbanSkeleton() {
  const columns = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton variant="line" height={28} className="w-56" />
        <Skeleton variant="rectangle" height={38} className="w-36 rounded-xl" />
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((colName, colIdx) => (
          <div
            key={colIdx}
            className="bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-4"
          >
            {/* Column Header Skeleton */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <Skeleton variant="line" height={20} className="w-28" />
              <Skeleton variant="rectangle" height={22} className="w-8 rounded-full" />
            </div>

            {/* Skeleton Cards inside Column */}
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <Skeleton variant="line" height={16} className="w-24" />
                    <Skeleton variant="line" height={16} className="w-16" />
                  </div>
                  <Skeleton variant="line" height={14} className="w-full" />
                  <Skeleton variant="line" height={14} className="w-3/4" />
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <Skeleton variant="line" height={18} className="w-20" />
                    <Skeleton variant="rectangle" height={28} className="w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookingsKanbanSkeleton;
