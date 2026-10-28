import React, { useEffect, useState } from 'react';
import { CreditCard, IndianRupee, RefreshCw, BookOpen, CheckCircle, ArrowDownUp } from 'lucide-react';
import { useStore } from '../store/useStore';

export function PaymentsPage() {
  const [overview, setOverview] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useStore();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/finance/overview').then((r) => r.json()),
      fetch('/api/finance/ledger').then((r) => r.json())
    ])
      .then(([ovRes, ledRes]) => {
        if (ovRes.success) setOverview(ovRes.data);
        if (ledRes.success) setLedger(ledRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance & Double-Entry Ledger</h1>
          <p className="text-sm text-gray-500">
            Real-time financial tracking, double-entry ledger journal, and partner payout balances
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>Refresh Financials</span>
        </button>
      </div>

      {/* Financial KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Settled GMV</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              ₹{(overview?.totalCollected ?? 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Bank Settled</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Payouts</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              ₹{(overview?.pendingPayouts ?? 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Partner Accrual</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cash In Hand</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              ₹{(overview?.cashInHand ?? 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-blue-600 font-medium mt-1">Partner Cash Collections</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ArrowDownUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Partner Payables Summary */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-base font-bold text-gray-900">Partner Net Payable Balances</h2>
            <span className="text-xs text-gray-400">Sum of Credits - Debits</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {overview?.partnerBalances?.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">No partner balances recorded</p>
            ) : (
              overview?.partnerBalances?.map((pb) => (
                <div
                  key={pb.partnerId}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900">{pb.name}</p>
                    <p className="text-[10px] text-gray-500">
                      Tier: {pb.tier} • ID: {pb.partnerId}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      ₹{(pb.payableBalance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Double-Entry Ledger Journal Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-gray-900">Immutable Double-Entry Ledger Journal</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Balanced Debits = Credits
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading ledger batches...</div>
            ) : ledger.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No financial ledger entries recorded yet</div>
            ) : (
              ledger.map((batch) => (
                <div key={batch.batchId} className="border border-gray-200 rounded-xl bg-gray-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b pb-2">
                    <div>
                      <span className="font-extrabold text-slate-800 font-mono">{batch.eventType}</span>
                      <span className="text-gray-400 ml-2 font-mono">Ref: {batch.referenceId}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(batch.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Entry Rows Table */}
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-400 border-b">
                        <th className="pb-1 font-semibold">Account Code</th>
                        <th className="pb-1 font-semibold text-right">Debit (₹)</th>
                        <th className="pb-1 font-semibold text-right">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {batch.entries?.map((e, idx) => (
                        <tr key={idx} className="font-mono">
                          <td className="py-1 text-gray-800">{e.account}</td>
                          <td className="py-1 text-right text-rose-600 font-medium">
                            {e.debit > 0 ? e.debit.toFixed(2) : '-'}
                          </td>
                          <td className="py-1 text-right text-emerald-600 font-medium">
                            {e.credit > 0 ? e.credit.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-1">
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Balanced Batch Sum: ₹{batch.totalAmount?.toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
