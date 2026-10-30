import React from 'react';
import Skeleton from '../Skeleton';

/**
 * Skeleton Loader for Booking History Page
 * Displays skeleton rows/cards for past bookings while fetching data
 */
export function BookingHistorySkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in py-4">
      {/* Page Title Line Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton variant="line" height={28} className="w-48" />
        <Skeleton variant="rectangle" height={32} className="w-24 rounded-lg" />
      </div>

      {/* Booking Cards Skeleton List */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm"
        >
          {/* Header Row: Booking ID + Status Badge */}
          <div className="flex justify-between items-center">
            <Skeleton variant="line" height={20} className="w-36" />
            <Skeleton variant="rectangle" height={24} className="w-28 rounded-full" />
          </div>

          {/* Date & Time Slot Line */}
          <Skeleton variant="line" height={16} className="w-2/3" />

          {/* Items List Skeleton */}
          <div className="space-y-2 py-2 border-y border-slate-100 dark:border-slate-700/60">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex justify-between items-center">
                <div className="flex items-center gap-3 w-3/4">
                  <Skeleton variant="circle" className="w-6 h-6 shrink-0" />
                  <Skeleton variant="line" height={16} className="w-full" />
                </div>
                <Skeleton variant="line" height={16} className="w-16" />
              </div>
            ))}
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex justify-end gap-3 pt-1">
            <Skeleton variant="rectangle" height={36} className="w-28 rounded-lg" />
            <Skeleton variant="rectangle" height={36} className="w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default BookingHistorySkeleton;
