import React from 'react';

/**
 * Reusable Skeleton Component for Tailwind CSS & React
 * Supports shapes: 'rectangle' (images/cards), 'circle' (avatars/icons), 'line' (text title/price)
 */
export function Skeleton({
  variant = 'rectangle',
  width,
  height,
  count = 1,
  className = '',
  style = {},
  isLoading,
  children
}) {
  if (typeof isLoading === 'boolean' && !isLoading) {
    return (
      <div className="transition-opacity duration-300 ease-in-out opacity-100">
        {children}
      </div>
    );
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full aspect-square';
      case 'line':
        return 'rounded-md h-4 w-full';
      case 'rectangle':
      default:
        return 'rounded-xl w-full';
    }
  };

  const inlineStyles = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style
  };

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, index) => (
        <div
          key={index}
          className={`
            relative overflow-hidden
            animate-pulse bg-slate-200 dark:bg-slate-700
            before:absolute before:inset-0 before:-translate-x-full
            before:animate-[shimmer_1.8s_infinite]
            before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-white/10 before:to-transparent
            ${getVariantClasses()}
            ${className}
          `.trim()}
          style={inlineStyles}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

/**
 * DashboardSkeleton - KPI Cards & Charts Shimmer Placeholder
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton variant="line" height={32} className="w-56" />
          <Skeleton variant="line" height={16} className="w-80" />
        </div>
        <Skeleton variant="rectangle" height={40} className="w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <Skeleton variant="line" height={16} className="w-28" />
              <Skeleton variant="circle" className="w-10 h-10" />
            </div>
            <Skeleton variant="line" height={32} className="w-36" />
            <Skeleton variant="line" height={14} className="w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
          <Skeleton variant="line" height={22} className="w-48" />
          <div className="h-64 pt-6 flex items-end justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-2">
            {[40, 65, 30, 85, 50, 95, 70, 60, 80, 45, 90, 75].map((h, i) => (
              <Skeleton key={i} variant="rectangle" height={`${h}%`} className="w-full rounded-t-md max-w-[32px]" />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
          <Skeleton variant="line" height={22} className="w-40" />
          <div className="space-y-4 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton variant="line" height={16} className="w-2/3" />
                <Skeleton variant="line" height={16} className="w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TableSkeleton - Table Rows & Columns Shimmer Placeholder
 */
export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4">
        <Skeleton variant="rectangle" height={38} className="w-64 rounded-xl" />
        <Skeleton variant="rectangle" height={38} className="w-32 rounded-xl" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <th className="py-3 px-4"><Skeleton variant="line" height={16} className="w-12" /></th>
              <th className="py-3 px-4"><Skeleton variant="line" height={16} className="w-32" /></th>
              <th className="py-3 px-4"><Skeleton variant="line" height={16} className="w-24" /></th>
              <th className="py-3 px-4"><Skeleton variant="line" height={16} className="w-20" /></th>
              <th className="py-3 px-4 text-right"><Skeleton variant="line" height={16} className="w-16 ml-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td className="py-4 px-4"><Skeleton variant="circle" className="w-8 h-8" /></td>
                <td className="py-4 px-4"><Skeleton variant="line" height={16} className="w-48" /></td>
                <td className="py-4 px-4"><Skeleton variant="rectangle" height={24} className="w-24 rounded-full" /></td>
                <td className="py-4 px-4"><Skeleton variant="line" height={16} className="w-16" /></td>
                <td className="py-4 px-4"><Skeleton variant="rectangle" height={32} className="w-16 ml-auto rounded-lg" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * BookingsKanbanSkeleton - Kanban Columns & Cards Shimmer Placeholder
 */
export function BookingsKanbanSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in p-6">
      <Skeleton variant="line" height={28} className="w-56" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Pending', 'In Progress', 'Completed', 'Cancelled'].map((col, colIdx) => (
          <div key={colIdx} className="bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <Skeleton variant="line" height={20} className="w-28" />
              <Skeleton variant="rectangle" height={22} className="w-8 rounded-full" />
            </div>

            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <div key={cardIdx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 shadow-sm">
                  <Skeleton variant="line" height={16} className="w-24" />
                  <Skeleton variant="line" height={14} className="w-full" />
                  <Skeleton variant="line" height={14} className="w-3/4" />
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
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

export default Skeleton;
