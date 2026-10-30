import React from 'react';
import BookingHistorySkeleton from './BookingHistorySkeleton';

/**
 * Customer Booking History Component
 * Displays shimmering skeleton rows while fetching data, then renders past bookings
 */
export function BookingHistory({ isLoading = false, bookings = [], onViewDetails, onCancel }) {
  if (isLoading) {
    return <BookingHistorySkeleton />;
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className="text-5xl">📋</div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">No bookings yet</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Your booked services will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in py-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Bookings</h1>

      {bookings.map((b) => (
        <article
          key={b.id}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-900 dark:text-white">{b.id}</span>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                b.cancelled
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}
            >
              {b.cancelled ? 'Cancelled' : b.status || 'Confirmed'}
            </span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            📅 {b.date}, {b.slot} • ₹{b.pricing ? b.pricing.total : b.finalPayable || 0}
          </p>

          <div className="space-y-2 py-2 border-y border-slate-100 dark:border-slate-700">
            {(b.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-slate-800 dark:text-slate-200">
                  {item.emoji || '✨'} {item.name || item.serviceName} × {item.qty || item.quantity || 1}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ₹{(item.price || item.unitPrice || 0) * (item.qty || item.quantity || 1)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => onViewDetails && onViewDetails(b.id)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              View details
            </button>
            {!b.cancelled && (
              <button
                type="button"
                onClick={() => onCancel && onCancel(b.id)}
                className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                Cancel booking
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export default BookingHistory;
