import React from 'react';
import Skeleton from '../Skeleton';

/**
 * Skeleton Loader for Admin Dashboard
 * Renders KPI card blocks and chart skeleton containers while fetching data
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header Title Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton variant="line" height={32} className="w-56" />
          <Skeleton variant="line" height={16} className="w-80" />
        </div>
        <Skeleton variant="rectangle" height={40} className="w-32 rounded-xl" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <Skeleton variant="line" height={16} className="w-28" />
              <Skeleton variant="circle" className="w-10 h-10" />
            </div>
            <Skeleton variant="line" height={32} className="w-36" />
            <div className="flex items-center gap-2">
              <Skeleton variant="rectangle" height={18} className="w-12 rounded" />
              <Skeleton variant="line" height={14} className="w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Analytics Skeleton Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Placeholder (Revenue / Bookings Trend) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <Skeleton variant="line" height={22} className="w-48" />
            <Skeleton variant="rectangle" height={32} className="w-28 rounded-lg" />
          </div>
          {/* Simulated Bar / Line Chart Bars */}
          <div className="h-64 pt-6 flex items-end justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-2">
            {[40, 65, 30, 85, 50, 95, 70, 60, 80, 45, 90, 75].map((h, i) => (
              <Skeleton
                key={i}
                variant="rectangle"
                height={`${h}%`}
                className="w-full rounded-t-md max-w-[32px]"
              />
            ))}
          </div>
        </div>

        {/* Side Chart / Top Services Skeleton */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
          <Skeleton variant="line" height={22} className="w-40" />
          <div className="space-y-4 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-1 w-3/4">
                  <Skeleton variant="line" height={16} className="w-full" />
                  <Skeleton variant="line" height={12} className="w-1/2" />
                </div>
                <Skeleton variant="line" height={16} className="w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
