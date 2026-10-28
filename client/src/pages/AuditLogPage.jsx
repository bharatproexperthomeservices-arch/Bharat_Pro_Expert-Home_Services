import React, { useEffect, useState } from 'react';
import { FileText, Filter, RefreshCw, Search, ShieldCheck } from 'lucide-react';

export function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    let url = '/api/audit-logs?';
    if (actorFilter) url += `actor=${encodeURIComponent(actorFilter)}&`;
    if (actionFilter) url += `action=${encodeURIComponent(actionFilter)}&`;

    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setLogs(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actorFilter, actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Immutable Audit Log</h1>
          <p className="text-sm text-gray-500">
            System-wide append-only audit trail logging all manual overrides, state transitions, and compliance actions
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Filter by Actor (e.g., ADMIN, SYSTEM)..."
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="text-xs text-gray-500 font-mono">
          Showing <strong className="text-gray-900">{logs.length}</strong> immutable entries
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Log ID & Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action Code</th>
                <th className="p-3">Target</th>
                <th className="p-3">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No audit records matched filters
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-gray-900 block">{log.id}</span>
                      <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">{log.actor}</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-900 font-bold border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">
                      {log.targetType}:{log.targetId}
                    </td>
                    <td className="p-3 text-gray-600 italic max-w-xs truncate">{log.reason || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
