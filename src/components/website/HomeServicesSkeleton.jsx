import React from 'react';
import Skeleton from '../Skeleton';

/**
 * Skeleton Loader for Home & Services Page
 * Displays hero slider, category circles grid, promo banner, and service card grids
 */
export function HomeServicesSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in py-4">
      {/* Hero Banner Skeleton */}
      <div className="w-full h-44 sm:h-52 md:h-64 rounded-2xl overflow-hidden p-6 bg-slate-100 dark:bg-slate-800 flex flex-col justify-between">
        <div className="space-y-3 max-w-md">
          <Skeleton variant="line" height={28} className="w-3/4" />
          <Skeleton variant="line" height={16} className="w-1/2" />
        </div>
        <Skeleton variant="rectangle" height={36} className="w-32 rounded-lg" />
      </div>

      {/* Categories Row Skeleton */}
      <div className="space-y-3">
        <Skeleton variant="line" height={20} className="w-40" />
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 py-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <Skeleton variant="circle" className="w-14 h-14 sm:w-16 sm:h-16" />
              <Skeleton variant="line" height={12} className="w-12 sm:w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Services Grid Section Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton variant="line" height={24} className="w-48" />
          <Skeleton variant="line" height={16} className="w-20" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-sm"
            >
              {/* Image Placeholder */}
              <Skeleton variant="rectangle" height={160} className="w-full rounded-xl" />

              {/* Title Placeholder */}
              <Skeleton variant="line" height={20} className="w-4/5" />

              {/* Rating & Duration Line */}
              <div className="flex items-center gap-2">
                <Skeleton variant="line" height={14} className="w-24" />
                <Skeleton variant="line" height={14} className="w-16" />
              </div>

              {/* Price Line & Add Button Placeholder */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <div className="space-y-1">
                  <Skeleton variant="line" height={22} className="w-20" />
                </div>
                <Skeleton variant="rectangle" height={36} className="w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeServicesSkeleton;
