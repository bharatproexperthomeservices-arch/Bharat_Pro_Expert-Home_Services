import React, { useState } from 'react';
import { Partner, PartnerBankDetails } from '../../../types';
import { 
  verifyPartnerBank, 
  rejectPartnerBank, 
  updatePartnerBankDetails,
  maskBankAccount 
} from '../../../services/partnerAuthService';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Edit, 
  X, 
  Download, 
  Building 
} from 'lucide-react';

interface PartnerBankTabProps {
  partners: Partner[];
  onPartnerUpdated: (updatedPartner: Partner) => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const PartnerBankTab: React.FC<PartnerBankTabProps> = ({
  partners,
  onPartnerUpdated,
  onAuditLog
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partners[0]?.id || '');
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Edit Bank Details State
  const [isEditing, setIsEditing] = useState(false);
  const [editHolderName, setEditHolderName] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editAccNum, setEditAccNum] = useState('');
  const [editConfirmAccNum, setEditConfirmAccNum] = useState('');
  const [editIfsc, setEditIfsc] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editAccType, setEditAccType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [editUpi, setEditUpi] = useState('');

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Account holder name mismatch with PAN/Aadhaar');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPartner = partners.find(p => p.id === selectedPartnerId) || partners[0] || null;
  const bank = selectedPartner?.bankDetails;

  const handleOpenEdit = () => {
    if (!bank) return;
    setEditHolderName(bank.accountHolderName);
    setEditBankName(bank.bankName);
    setEditAccNum(bank.accountNumber || '');
    setEditConfirmAccNum(bank.accountNumber || '');
    setEditIfsc(bank.ifsc);
    setEditBranch(bank.branchName || '');
    setEditAccType(bank.accountType || 'SAVINGS');
    setEditUpi(bank.upiId || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;
    setIsProcessing(true);
    try {
      const res = await updatePartnerBankDetails(selectedPartner.id, {
        accountHolderName: editHolderName,
        bankName: editBankName,
        accountNumber: editAccNum,
        confirmAccountNumber: editConfirmAccNum,
        ifsc: editIfsc,
        branchName: editBranch,
        accountType: editAccType,
        upiId: editUpi,
        bankProofType: bank?.bankProofType || 'CANCELLED_CHEQUE',
        bankProofUrl: bank?.bankProofUrl
      }, 'admin_owner');

      if (res.success && res.partner) {
        onPartnerUpdated(res.partner);
        setIsEditing(false);
        alert('Bank details updated. Status reset to PENDING for verification.');
      } else {
        alert(res.error || 'Failed to update bank details.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyBank = async () => {
    if (!selectedPartner) return;
    setIsProcessing(true);
    try {
      const res = await verifyPartnerBank(selectedPartner.id, 'admin_owner');
      if (res.success && res.partner) {
        onPartnerUpdated(res.partner);
        onAuditLog?.('BANK_VERIFIED', selectedPartner.id, `Bank verified for ${res.partner.name}`);
        alert('Bank account successfully verified!');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedPartner || !rejectReason.trim()) return;
    setIsProcessing(true);
    try {
      const res = await rejectPartnerBank(selectedPartner.id, rejectReason.trim(), 'admin_owner');
      if (res.success && res.partner) {
        onPartnerUpdated(res.partner);
        setShowRejectModal(false);
        onAuditLog?.('BANK_REJECTED', selectedPartner.id, `Bank rejected: ${rejectReason}`);
        alert('Bank account rejected.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Selector */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <div>
            <h4 className="font-bold text-sm text-[#1C1C1E]">Bank Account &amp; Settlement Verification</h4>
            <span className="text-[11px] text-[#8E8E93]">Review passbook / cancelled cheque and approve for direct weekly payouts</span>
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
                {p.name} &bull; Bank: {p.bankDetails?.verificationStatus || 'NOT_SUBMITTED'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPartner ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Bank Account Details Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h4 className="font-bold text-sm text-[#1C1C1E]">{selectedPartner.name}</h4>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedPartner.loginUserId || selectedPartner.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  bank?.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                  bank?.verificationStatus === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {bank?.verificationStatus || 'NOT_SUBMITTED'}
                </span>
                <button
                  onClick={handleOpenEdit}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            {bank && bank.accountNumber ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Holder Name:</span>
                    <strong className="text-slate-900">{bank.accountHolderName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank Name:</span>
                    <strong className="text-slate-900">{bank.bankName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Number:</span>
                    <strong className="font-mono text-slate-900">{maskBankAccount(bank.accountNumber)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC Code:</span>
                    <strong className="font-mono text-slate-900">{bank.ifsc}</strong>
                  </div>
                  {bank.branchName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Branch Name:</span>
                      <strong className="text-slate-900">{bank.branchName}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Type:</span>
                    <strong className="text-slate-900">{bank.accountType || 'SAVINGS'}</strong>
                  </div>
                  {bank.upiId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">UPI ID:</span>
                      <strong className="font-mono text-slate-900">{bank.upiId}</strong>
                    </div>
                  )}
                </div>

                {bank.rejectionReason && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <strong>Rejection Reason:</strong> {bank.rejectionReason}
                  </div>
                )}

                {/* Bank Verification Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessing || bank.verificationStatus === 'VERIFIED'}
                    onClick={handleVerifyBank}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify &amp; Activate Payouts</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <Building className="w-8 h-8 mx-auto opacity-50" />
                <p>No bank details submitted yet for this partner.</p>
                <button
                  onClick={handleOpenEdit}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Enter Bank Details Now
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Bank Proof Preview */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-[#1C1C1E]">
              Uploaded Bank Proof ({bank?.bankProofType || 'Cancelled Cheque'})
            </h4>

            {bank?.bankProofUrl ? (
              <div className="space-y-3">
                <div 
                  onClick={() => setPreviewProofUrl(bank.bankProofUrl!)}
                  className="h-64 rounded-2xl bg-slate-100 overflow-hidden relative cursor-pointer group border border-slate-200 flex items-center justify-center"
                >
                  <img src={bank.bankProofUrl} alt="Bank Proof" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <Eye className="w-4 h-4" />
                    <span>View Full Size</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Click the proof to open the high-resolution inspection modal.
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400 space-y-2">
                <CreditCard className="w-8 h-8 mx-auto opacity-50" />
                <p>No cancelled cheque or passbook uploaded yet.</p>
              </div>
            )}
          </div>

        </div>
      ) : null}

      {/* EDIT BANK DETAILS MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleSaveEdit} className="w-full max-w-lg bg-white rounded-3xl border border-[#E5E5EA] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="font-bold text-sm text-[#1C1C1E]">Edit Bank Account Details</h4>
              <button type="button" onClick={() => setIsEditing(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={editHolderName}
                  onChange={(e) => setEditHolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    maxLength={11}
                    required
                    value={editIfsc}
                    onChange={(e) => setEditIfsc(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={editAccNum}
                    onChange={(e) => setEditAccNum(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Confirm Account Number *</label>
                  <input
                    type="text"
                    required
                    value={editConfirmAccNum}
                    onChange={(e) => setEditConfirmAccNum(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={editUpi}
                    onChange={(e) => setEditUpi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {isProcessing ? 'Saving...' : 'Save & Reset to Pending'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REJECT BANK MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E5EA] p-6 shadow-2xl space-y-4">
            <h4 className="font-bold text-sm text-[#1C1C1E]">Reject Bank Details with Reason</h4>
            <div className="space-y-2">
              {[
                'Account holder name mismatch with PAN/Aadhaar',
                'Invalid IFSC code or branch closed',
                'Cancelled cheque image is blurry or truncated',
                'Account number on cheque does not match entered account number',
                'Other'
              ].map(r => (
                <label key={r} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="bankReject"
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL SIZE PROOF PREVIEW */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-slate-900">Bank Proof Full Preview</span>
              <button onClick={() => setPreviewProofUrl(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-2xl p-2">
              <img src={previewProofUrl} alt="Bank Proof" className="max-w-full max-h-[65vh] object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
