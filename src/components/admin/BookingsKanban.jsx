import React from 'react';
import BookingsKanbanSkeleton from './BookingsKanbanSkeleton';

/**
 * Admin Bookings Kanban Component
 * Displays bookings organized in columns (Pending, In Progress, Completed, Cancelled).
 * Renders BookingsKanbanSkeleton when isLoading is true.
 */
export function BookingsKanban({ isLoading = false, bookings = [], onMoveStatus }) {
  if (isLoading) {
    return <BookingsKanbanSkeleton />;
  }

  const columns = [
    { title: 'Pending', status: 'Pending', bg: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
    { title: 'In Progress', status: 'In Progress', bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
    { title: 'Completed', status: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
    { title: 'Cancelled', status: 'Cancelled', bg: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400' }
  ];

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bookings Kanban Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage order stages and expert dispatch status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colBookings = bookings.filter((b) =>
            col.status === 'Cancelled' ? b.cancelled : (b.status || 'Pending') === col.status
          );

          return (
            <div
              key={col.status}
              className="bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white">{col.title}</span>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${col.bg}`}>
                  {colBookings.length}
                </span>
              </div>

              <div className="space-y-3">
                {colBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{b.id}</span>
                      <span className="text-xs text-slate-400">{b.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      📍 {b.address ? `${b.address.house}, ${b.address.area}` : 'Gurugram'}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                      <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                        ₹{b.pricing ? b.pricing.total : b.finalPayable || 0}
                      </span>
                      {col.status !== 'Completed' && !b.cancelled && (
                        <button
                          type="button"
                          onClick={() => onMoveStatus && onMoveStatus(b.id, 'Completed')}
                          className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 text-xs font-semibold rounded-lg hover:bg-blue-100"
                        >
                          Advance →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BookingsKanban;
