import React from 'react';
import DashboardSkeleton from './DashboardSkeleton';

/**
 * Admin Dashboard Component
 * Displays KPI cards, revenue charts, and top services.
 * Renders shimmering DashboardSkeleton when isLoading is true.
 */
export function Dashboard({ isLoading = false, kpis, trendData, topServices }) {
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const defaultKpis = kpis || [
    { title: 'Total Revenue', value: '₹1,24,500', change: '+14%', isUp: true, icon: '💰' },
    { title: 'Active Bookings', value: '38', change: '+8%', isUp: true, icon: '📋' },
    { title: 'Completed Jobs', value: '412', change: '+22%', isUp: true, icon: '✅' },
    { title: 'Avg. Rating', value: '4.9 ★', change: '+0.2', isUp: true, icon: '⭐' }
  ];

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overview of home services performance and revenue metrics</p>
        </div>
        <span className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold text-xs rounded-xl">
          Live Data Sync Active
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {defaultKpis.map((kpi, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-sm font-medium">
              <span>{kpi.title}</span>
              <span className="text-2xl">{kpi.icon}</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{kpi.value}</div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">{kpi.change}</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue & Bookings Trend</h2>
          <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 dark:border-slate-700 pb-2">
            {[45, 60, 35, 80, 55, 90, 75, 65, 85, 50, 95, 80].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  style={{ height: `${val}%` }}
                  className="w-full bg-blue-600 dark:bg-blue-500 rounded-t-md hover:opacity-90 transition-opacity"
                />
                <span className="text-[10px] text-slate-400">M{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Performing Services</h2>
          <div className="space-y-4 pt-2">
            {(topServices || [
              { name: 'Full Home Deep Cleaning', sales: '142 orders' },
              { name: 'Bathroom Cleaning', sales: '98 orders' },
              { name: 'Sofa Shampooing', sales: '76 orders' },
              { name: 'Kitchen Deep Clean', sales: '64 orders' },
              { name: 'AC Service & Repair', sales: '52 orders' }
            ]).map((srv, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{srv.name}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">{srv.sales}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
