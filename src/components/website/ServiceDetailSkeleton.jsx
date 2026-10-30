import React from 'react';
import Skeleton from '../Skeleton';

/**
 * Skeleton Loader for Service Detail Page
 * Displays image placeholder, title line, rating line, description block, checklist, and FAQs
 */
export function ServiceDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-4">
      {/* Banner / Image Placeholder */}
      <Skeleton variant="rectangle" height={240} className="w-full rounded-2xl" />

      {/* Title & Metadata Line */}
      <div className="space-y-3">
        <Skeleton variant="line" height={28} className="w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton variant="line" height={16} className="w-24" />
          <Skeleton variant="line" height={16} className="w-20" />
        </div>
        <Skeleton variant="line" height={24} className="w-32" />
      </div>

      {/* Description Text Blocks */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3 shadow-sm">
        <Skeleton variant="line" height={20} className="w-36" />
        <Skeleton variant="line" count={3} className="space-y-2" />
      </div>

      {/* Included / Excluded Checklist Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3 shadow-sm">
          <Skeleton variant="line" height={20} className="w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton variant="circle" className="w-5 h-5 shrink-0" />
              <Skeleton variant="line" height={16} className="w-full" />
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3 shadow-sm">
          <Skeleton variant="line" height={20} className="w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton variant="circle" className="w-5 h-5 shrink-0" />
              <Skeleton variant="line" height={16} className="w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* FAQs Skeleton */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3 shadow-sm">
        <Skeleton variant="line" height={20} className="w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rectangle" height={44} className="rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default ServiceDetailSkeleton;
