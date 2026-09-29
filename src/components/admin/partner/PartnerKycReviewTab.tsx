import React, { useState } from 'react';
import { Partner, PartnerDocument } from '../../../types';
import { 
  verifyPartnerDocument, 
  rejectPartnerDocument, 
  requestDocumentReupload, 
  deletePartnerDocument,
  maskAadhaar,
  maskPan
} from '../../../services/partnerAuthService';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Trash2, 
  RefreshCw,
  Clock,
  FileText
} from 'lucide-react';

interface PartnerKycReviewTabProps {
  partners: Partner[];
  onPartnerUpdated: (updatedPartner: Partner) => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const PartnerKycReviewTab: React.FC<PartnerKycReviewTabProps> = ({
  partners,
  onPartnerUpdated,
  onAuditLog
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partners[0]?.id || '');
  const [previewDoc, setPreviewDoc] = useState<PartnerDocument | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);

  // Reject / Re-upload Modal State
  const [rejectingDoc, setRejectingDoc] = useState<{ doc: PartnerDocument; isReuploadOnly: boolean } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Image unclear or blurry');
  const [customReason, setCustomReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPartner = partners.find(p => p.id === selectedPartnerId) || partners[0] || null;

  const handleVerify = async (docId: string) => {
    if (!selectedPartner) return;
    setIsProcessing(true);
    try {
      const res = await verifyPartnerDocument(selectedPartner.id, docId, 'admin_owner');
      if (res.success) {
        // Refresh partner
        const updatedDocs = (selectedPartner.documents || []).map(d => d.id === docId ? res.document! : d);
        const updatedPartner = { ...selectedPartner, documents: updatedDocs };
        onPartnerUpdated(updatedPartner);
        onAuditLog?.('DOCUMENT_VERIFIED', selectedPartner.id, `Admin verified document ${res.document?.documentName}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedPartner || !rejectingDoc) return;
    const finalReason = rejectionReason === 'Other' ? customReason.trim() : rejectionReason;
    if (!finalReason) {
      alert('A specific rejection reason is required.');
      return;
    }

    setIsProcessing(true);
    try {
      if (rejectingDoc.isReuploadOnly) {
        const res = await requestDocumentReupload(selectedPartner.id, rejectingDoc.doc.id, finalReason, 'admin_owner');
        if (res.success && res.document) {
          const updatedDocs = (selectedPartner.documents || []).map(d => d.id === rejectingDoc.doc.id ? res.document! : d);
          onPartnerUpdated({ ...selectedPartner, documents: updatedDocs, kycStatus: 'KYC_NEEDS_REUPLOAD' });
        }
      } else {
        const res = await rejectPartnerDocument(selectedPartner.id, rejectingDoc.doc.id, finalReason, 'admin_owner');
        if (res.success && res.document) {
          const updatedDocs = (selectedPartner.documents || []).map(d => d.id === rejectingDoc.doc.id ? res.document! : d);
          onPartnerUpdated({ ...selectedPartner, documents: updatedDocs, kycStatus: 'KYC_NEEDS_REUPLOAD' });
        }
      }
      setRejectingDoc(null);
      setCustomReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!selectedPartner) return;
    if (!window.confirm('Are you sure you want to delete this document from the partner profile?')) return;
    setIsProcessing(true);
    try {
      const res = await deletePartnerDocument(selectedPartner.id, docId, 'admin_owner');
      if (res.success) {
        const updatedDocs = (selectedPartner.documents || []).filter(d => d.id !== docId);
        onPartnerUpdated({ ...selectedPartner, documents: updatedDocs });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const presetReasons = [
    'Image unclear or blurry',
    'Wrong document uploaded',
    'Name on document does not match partner record',
    'Aadhaar/PAN number mismatch',
    'Document expired',
    'Incomplete document / missing backside',
    'Other'
  ];

  return (
    <div className="space-y-6">
      
      {/* Partner Selector Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <div>
            <h4 className="font-bold text-sm text-[#1C1C1E]">Dedicated KYC &amp; Document Review</h4>
            <span className="text-[11px] text-[#8E8E93]">Inspect Aadhaar, PAN, and address proofs with zoom &amp; rotation controls</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700">Select Partner:</label>
          <select
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold text-xs"
          >
            {partners.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.phone}) &bull; {p.kycStatus || 'PENDING'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPartner ? (
        <div className="space-y-6">
          {/* Partner Header Info Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                {selectedPartner.avatarUrl ? (
                  <img src={selectedPartner.avatarUrl} alt={selectedPartner.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">No Photo</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#1C1C1E]">{selectedPartner.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedPartner.kycStatus === 'KYC_VERIFIED' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : selectedPartner.kycStatus === 'KYC_NEEDS_REUPLOAD'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedPartner.kycStatus || 'PENDING_DOCUMENTS'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Phone: <strong>{selectedPartner.phone}</strong> &bull; ID: <strong>{selectedPartner.loginUserId || selectedPartner.id}</strong> &bull; Hub: {selectedPartner.assignedHubName}
                </p>
                <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                  <span>Aadhaar: <strong className="font-mono">{maskAadhaar(selectedPartner.aadhaarNumber)}</strong></span>
                  <span>&bull;</span>
                  <span>PAN: <strong className="font-mono">{maskPan(selectedPartner.panNumber)}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Onboarding:</span>
              <div className="w-32 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all" 
                  style={{ width: `${selectedPartner.onboardingProgress || 20}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-slate-800">{selectedPartner.onboardingProgress || 20}%</span>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-[#1C1C1E]">
              Uploaded Identity &amp; Onboarding Documents ({selectedPartner.documents?.length || 0})
            </h4>

            {(!selectedPartner.documents || selectedPartner.documents.length === 0) ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5EA] space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <h5 className="font-bold text-sm text-slate-700">No Documents Uploaded Yet</h5>
                <p className="text-xs text-slate-400">
                  This partner has not uploaded identity proofs or bank documents yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedPartner.documents.map((doc) => {
                  const isVerified = doc.verificationStatus === 'VERIFIED';
                  const isRejected = doc.verificationStatus === 'REJECTED';
                  const isReupload = doc.verificationStatus === 'REUPLOAD_REQUIRED';

                  return (
                    <div 
                      key={doc.id}
                      className={`p-4 rounded-3xl bg-white border transition-all flex flex-col justify-between space-y-3 shadow-xs ${
                        isVerified ? 'border-emerald-300 bg-emerald-50/10' :
                        isRejected ? 'border-rose-300 bg-rose-50/10' :
                        isReupload ? 'border-amber-300 bg-amber-50/10' :
                        'border-slate-200'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#1C1C1E] truncate max-w-[180px]">
                            {doc.documentName}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isVerified ? 'bg-emerald-100 text-emerald-800' :
                            isRejected ? 'bg-rose-100 text-rose-800' :
                            isReupload ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {doc.verificationStatus}
                          </span>
                        </div>

                        {/* Document Thumbnail / Preview Area */}
                        <div 
                          onClick={() => { setPreviewDoc(doc); setPreviewZoom(1); setPreviewRotation(0); }}
                          className="h-36 rounded-2xl bg-slate-100 overflow-hidden relative cursor-pointer group border border-slate-200 flex items-center justify-center"
                        >
                          {doc.fileUrl.startsWith('data:image') || doc.fileUrl.startsWith('http') ? (
                            <img src={doc.fileUrl} alt={doc.documentName} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                          ) : (
                            <div className="text-center p-3">
                              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                              <span className="text-[10px] text-slate-500 font-mono mt-1 block">PDF Document</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Eye className="w-4 h-4" />
                            <span>Inspect &amp; Zoom</span>
                          </div>
                        </div>

                        {doc.rejectionReason && (
                          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                            <strong>Reason:</strong> {doc.rejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => { setPreviewDoc(doc); setPreviewZoom(1); setPreviewRotation(0); }}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {!isVerified && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleVerify(doc.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}
                          {!isRejected && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => setRejectingDoc({ doc, isReuploadOnly: false })}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setRejectingDoc({ doc, isReuploadOnly: true })}
                            className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200 cursor-pointer"
                          >
                            Re-upload
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5EA]">
          <p className="text-slate-500 text-xs">No partners available for KYC review.</p>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL (ZOOM & ROTATE) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{previewDoc.documentName}</span>
                <span className="text-xs text-slate-400 font-mono">({previewDoc.documentType})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewZoom(prev => Math.min(prev + 0.25, 2.5))}
                  className="p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewZoom(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewRotation(prev => (prev + 90) % 360)}
                  className="p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-950/60 min-h-[350px]">
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.documentName}
                className="max-w-full max-h-[65vh] object-contain transition-transform duration-200"
                style={{ 
                  transform: `scale(${previewZoom}) rotate(${previewRotation}deg)` 
                }}
              />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Status: <strong className="text-white">{previewDoc.verificationStatus}</strong></span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT / REQUEST REUPLOAD REASON MODAL */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E5EA] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="font-bold text-sm text-[#1C1C1E]">
                {rejectingDoc.isReuploadOnly ? 'Request Document Re-upload' : 'Reject Document with Reason'}
              </h4>
              <button onClick={() => setRejectingDoc(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Document: <strong>{rejectingDoc.doc.documentName}</strong>. Specify a clear reason so the partner knows what to correct.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Select Reason:</label>
              {presetReasons.map((r) => (
                <label key={r} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="reason"
                    checked={rejectionReason === r}
                    onChange={() => setRejectionReason(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}

              {rejectionReason === 'Other' && (
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Type specific issue with document..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white mt-2"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRejectingDoc(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {isProcessing ? 'Processing...' : (rejectingDoc.isReuploadOnly ? 'Request Re-upload' : 'Confirm Reject')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
