import React, { useState } from 'react';

export const AdminGovernanceAndAudit: React.FC = () => {
  const auditLogs = [
    { id: 'aud-101', timestamp: '2024-09-28 09:15:20', operator: 'Owner Admin', action: 'CATALOG_PRICE_UPDATE', details: 'Updated 3-Seater Sofa price to ₹1,499', ip: '152.57.12.98' },
    { id: 'aud-102', timestamp: '2024-09-28 08:40:12', operator: 'Owner Admin', action: 'PARTNER_KYC_APPROVE', details: 'Approved Aadhar & PAN for Partner prt-101', ip: '152.57.12.98' },
  ];

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Security Governance & Activity Audit Trail</h1>
          <p className="text-slate-400 text-sm">Immutable Mutation Event Logging, IP Access Trail & System Rules</p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-700 uppercase">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Operator</th>
              <th className="p-4">Action Type</th>
              <th className="p-4">Details</th>
              <th className="p-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 text-slate-200">
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td className="p-4 font-mono text-slate-400">{log.timestamp}</td>
                <td className="p-4 font-bold text-amber-400">{log.operator}</td>
                <td className="p-4"><span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">{log.action}</span></td>
                <td className="p-4 text-white">{log.details}</td>
                <td className="p-4 text-slate-400 font-mono">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};