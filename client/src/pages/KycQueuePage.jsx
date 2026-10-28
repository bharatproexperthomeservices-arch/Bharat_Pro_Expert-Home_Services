import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, X, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DOCUMENT_TYPES, REJECT_REASON_CODES } from '../../../shared/constants';

export function KycQueuePage() {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState('AADHAAR');
  const [rejectReason, setRejectReason] = useState('DOC_BLURRY');
  const [loading, setLoading] = useState(true);
  const { showToast } = useStore();

  const fetchQueue = () => {
    setLoading(true);
    fetch('/api/partners')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          const queue = res.data.filter(
            (p) => p.kycStatus === 'PENDING_VERIFICATION' || p.kycStatus === 'KYC_HOLD'
          );
          setPartners(queue);
          if (queue.length > 0 && !selectedPartner) {
            setSelectedPartner(queue[0]);
          } else if (selectedPartner) {
            const updated = res.data.find((p) => p.id === selectedPartner.id);
            if (updated) setSelectedPartner(updated);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDocAction = (status) => {
    if (!selectedPartner || !selectedDocType) return;

    if (status === 'REJECTED' && !rejectReason) {
      showToast('Please select a valid rejection reason code', 'error');
      return;
    }

    fetch(`/api/partners/${selectedPartner.id}/kyc-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        docType: selectedDocType,
        status,
        rejectReasonCode: status === 'REJECTED' ? rejectReason : null,
        actor: 'ADMIN_KYC'
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          showToast(`Document '${selectedDocType}' set to ${status}`, 'success');
          fetchQueue();
        } else {
          showToast(res.error || 'KYC review action failed', 'error');
        }
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification Console</h1>
          <p className="text-sm text-gray-500">Review 17 submitted document proofs and clear background verification</p>
        </div>
        <button
          onClick={fetchQueue}
          className="inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Queue List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm h-[750px] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Pending Applications ({partners.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Loading queue...</div>
            ) : partners.length === 0 ? (
              <div className="p-6 text-center text-gray-400">No applicants pending verification!</div>
            ) : (
              partners.map((p) => {
                const isSelected = selectedPartner?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPartner(p)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm">{p.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {p.kycStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{p.cityName} • {p.phone}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Side-by-Side Reviewer Console */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-[750px] flex flex-col justify-between">
          {selectedPartner ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="border-b pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Reviewing: {selectedPartner.name}</h2>
                    <p className="text-xs text-gray-500">{selectedPartner.phone} • {selectedPartner.email}</p>
                  </div>

                  <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold font-mono">
                    ID: {selectedPartner.id}
                  </span>
                </div>

                {/* Document Type Selector Grid */}
                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Select Document Proof (17 Total):
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border rounded-lg bg-gray-50">
                    {DOCUMENT_TYPES.map((docType) => {
                      const docObj = selectedPartner.documents?.[docType];
                      const status = docObj?.status || 'PENDING';
                      const isSel = selectedDocType === docType;

                      return (
                        <button
                          key={docType}
                          onClick={() => setSelectedDocType(docType)}
                          className={`p-2 rounded text-left text-xs font-semibold flex flex-col justify-between border transition-all ${
                            isSel
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              : status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-900 border-rose-200'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span className="truncate block font-mono text-[10px]">{docType}</span>
                          <span
                            className={`text-[9px] font-extrabold mt-1 uppercase ${
                              status === 'APPROVED'
                                ? 'text-emerald-700'
                                : status === 'REJECTED'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Document Viewer */}
                <div className="mt-5 p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 font-mono">
                      Document Preview: {selectedDocType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        selectedPartner.documents?.[selectedDocType]?.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedPartner.documents?.[selectedDocType]?.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedPartner.documents?.[selectedDocType]?.status || 'PENDING'}
                    </span>
                  </div>

                  <div className="h-44 bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 space-x-2 border">
                    <FileText className="w-8 h-8 text-emerald-500" />
                    <span className="text-sm font-medium">
                      Simulated Document Viewer: {selectedDocType}.jpg
                    </span>
                  </div>

                  {selectedPartner.documents?.[selectedDocType]?.status === 'REJECTED' && (
                    <div className="p-3 bg-rose-100 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
                      Rejection Reason Code: {selectedPartner.documents?.[selectedDocType]?.rejectReasonCode}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="border-t pt-4 space-y-3 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Reject Reason Code (Mandatory if Rejecting):
                    </label>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {Object.entries(REJECT_REASON_CODES).map(([code, desc]) => (
                        <option key={code} value={code}>
                          [{code}] {desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <button
                      onClick={() => handleDocAction('REJECTED')}
                      className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Document</span>
                    </button>

                    <button
                      onClick={() => handleDocAction('APPROVED')}
                      className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Document</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select an applicant from the left queue to begin document review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
