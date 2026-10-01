import React, { useState } from 'react';
import { Partner, HubLocation, PartnerAuditLog } from '../../../types';
import { 
  updatePartnerProfile, 
  uploadPartnerPhoto, 
  removePartnerPhoto, 
  approvePartnerAndMakeIdLive, 
  suspendPartner, 
  reactivatePartner, 
  deletePartner,
  maskAadhaar,
  maskPan,
  maskBankAccount,
  compressImage,
  getPartnerAuditLogs
} from '../../../services/partnerAuthService';
import { 
  X, 
  Edit, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  CreditCard, 
  FileText, 
  User, 
  RotateCw, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Star 
} from 'lucide-react';

interface Partner360ModalProps {
  partner: Partner | null;
  onClose: () => void;
  hubs: HubLocation[];
  onPartnerUpdated: (updatedPartner: Partner | null) => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const Partner360Modal: React.FC<Partner360ModalProps> = ({
  partner,
  onClose,
  hubs,
  onPartnerUpdated,
  onAuditLog
}) => {
  if (!partner) return null;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PERSONAL' | 'KYC_DOCS' | 'BANK' | 'AUDIT'>('OVERVIEW');
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingKyc, setIsEditingKyc] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Edit fields
  const [name, setName] = useState(partner.name);
  const [phone, setPhone] = useState(partner.phone);
  const [email, setEmail] = useState(partner.email || '');
  const [city, setCity] = useState(partner.city || '');
  const [fullAddress, setFullAddress] = useState(partner.fullAddress || '');
  const [assignedHubId, setAssignedHubId] = useState(partner.assignedHubId);
  const [categories, setCategories] = useState<string[]>(partner.approvedCategories || []);

  // Sensitive KYC Edit
  const [panNumber, setPanNumber] = useState(partner.panNumber || '');
  const [aadhaarNumber, setAadhaarNumber] = useState(partner.aadhaarNumber || '');

  // Sensitive Bank Edit
  const [accountHolderName, setAccountHolderName] = useState(partner.bankDetails?.accountHolderName || partner.name);
  const [bankName, setBankName] = useState(partner.bankDetails?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(partner.bankDetails?.accountNumber || '');
  const [ifsc, setIfsc] = useState(partner.bankDetails?.ifsc || '');
  const [branchName, setBranchName] = useState(partner.bankDetails?.branchName || '');

  const [auditLogs, setAuditLogs] = useState<PartnerAuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const loadAudit = async () => {
    setIsLoadingAudit(true);
    const logs = await getPartnerAuditLogs(partner.id);
    setAuditLogs(logs);
    setIsLoadingAudit(false);
  };

  // Handle Photo Replace
  const handlePhotoReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await compressImage(file, 800, 800, 0.88);
      const updateRes = await uploadPartnerPhoto(partner.id, res.dataUrl, 'admin_owner');
      if (updateRes.success && updateRes.partner) {
        onPartnerUpdated(updateRes.partner);
        alert('Partner photo updated successfully!');
      }
    } catch {
      alert('Failed to update photo.');
    }
  };

  // Handle Photo Remove
  const handlePhotoRemove = async () => {
    if (!window.confirm('Remove profile photo?')) return;
    const res = await removePartnerPhoto(partner.id, 'admin_owner');
    if (res.success && res.partner) {
      onPartnerUpdated(res.partner);
    }
  };

  // Save Basic Info
  const handleSaveBasic = async () => {
    const cleanPh = phone.replace(/\D/g, '').slice(-10);
    const hubObj = hubs.find(h => h.id === assignedHubId);
    const res = await updatePartnerProfile(partner.id, {
      name: name.trim(),
      phone: cleanPh,
      email: email.trim(),
      city: city.trim(),
      fullAddress: fullAddress.trim(),
      assignedHubId,
      assignedHubName: hubObj?.name || partner.assignedHubName,
      approvedCategories: categories
    }, 'admin_owner', 'Admin updated basic partner profile');

    if (res.success && res.partner) {
      onPartnerUpdated(res.partner);
      setIsEditingBasic(false);
      alert('Profile updated successfully.');
    } else {
      alert(res.error || 'Failed to update profile.');
    }
  };

  // Save Sensitive KYC (PAN & Aadhaar)
  const handleSaveKyc = async () => {
    const res = await updatePartnerProfile(partner.id, {
      panNumber: panNumber.trim().toUpperCase(),
      aadhaarNumber: aadhaarNumber.replace(/\D/g, '')
    }, 'admin_owner', 'Admin modified PAN / Aadhaar numbers. Status reset to UNDER_REVIEW.');

    if (res.success && res.partner) {
      onPartnerUpdated(res.partner);
      setIsEditingKyc(false);
      alert('Identity details updated. KYC status has been reset to UNDER_REVIEW for verification.');
    } else {
      alert(res.error || 'Failed to update KYC.');
    }
  };

  // Save Bank Details
  const handleSaveBank = async () => {
    const res = await updatePartnerProfile(partner.id, {
      bankDetails: {
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountNumberMasked: maskBankAccount(accountNumber),
        ifsc: ifsc.trim().toUpperCase(),
        branchName: branchName.trim(),
        verificationStatus: 'PENDING'
      }
    }, 'admin_owner', 'Admin modified bank account. Status reset to PENDING.');

    if (res.success && res.partner) {
      onPartnerUpdated(res.partner);
      setIsEditingBank(false);
      alert('Bank details updated. Status reset to PENDING.');
    } else {
      alert(res.error || 'Failed to update bank details.');
    }
  };

  // Actions: Approve, Suspend, Reactivate, Delete
  const handleApprove = async () => {
    if (!window.confirm(`Approve partner ${partner.name} and make login live?`)) return;
    try {
      const res = await approvePartnerAndMakeIdLive(partner.id);
      if (res.success && res.partner) {
        onPartnerUpdated(res.partner);
        onAuditLog?.('PARTNER_APPROVED', partner.id, `Partner ${partner.name} approved by admin`);
        alert(`✅ Partner ${res.partner.name} is now ACTIVE & APPROVED! Login ID: ${res.partner.loginUserId}`);
      } else {
        alert(`Approval failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error approving partner: ${String(err)}`);
    }
  };

  const handleSuspend = async () => {
    const reason = window.prompt('Enter reason for partner suspension:', 'Operational policy violation');
    if (!reason) return;
    const res = await suspendPartner(partner.id, reason, 'admin_owner');
    if (res.success && res.partner) {
      onPartnerUpdated(res.partner);
      alert(`Partner ${partner.name} has been suspended.`);
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm(`Reactivate partner ${partner.name}?`)) return;
    const res = await reactivatePartner(partner.id, 'admin_owner');
    if (res.success && res.partner) {
      onPartnerUpdated(res.partner);
      alert(`Partner ${partner.name} reactivated.`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`CRITICAL WARNING: Permanently delete partner ${partner.name} and all KYC documents? This cannot be undone.`)) return;
    const res = await deletePartner(partner.id, 'admin_owner');
    if (res.success) {
      onPartnerUpdated(null);
      onClose();
      alert(`Partner ${partner.name} permanently deleted.`);
    }
  };

  const isApproved = partner.status === 'ACTIVE' || partner.status === 'APPROVED' || partner.status === 'active';
  const isSuspended = partner.status === 'SUSPENDED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-[#E5E5EA] shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/20 shrink-0">
              {partner.avatarUrl ? (
                <img src={partner.avatarUrl} alt={partner.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold">No Photo</div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black">{partner.name}</h3>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isApproved ? 'bg-emerald-500 text-slate-950' : 
                  isSuspended ? 'bg-rose-500 text-white' : 
                  'bg-amber-400 text-slate-950'
                }`}>
                  {partner.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: <strong>{partner.loginUserId || partner.id}</strong> &bull; Phone: <strong>{partner.phone}</strong> &bull; Hub: {partner.assignedHubName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isApproved ? (
              <button
                onClick={handleSuspend}
                className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold border border-rose-500/40 cursor-pointer"
              >
                Suspend
              </button>
            ) : isSuspended ? (
              <button
                onClick={handleReactivate}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Reactivate
              </button>
            ) : (
              <button
                onClick={handleApprove}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve &amp; Make Live</span>
              </button>
            )}

            <button
              onClick={handleDelete}
              className="p-2 text-rose-400 hover:text-rose-200 hover:bg-slate-800 rounded-xl"
              title="Delete Partner"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-bold shrink-0 overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: '1. 360° Overview' },
            { id: 'PERSONAL', label: '2. Personal Details' },
            { id: 'KYC_DOCS', label: `3. Identity & Documents (${partner.documents?.length || 0})` },
            { id: 'BANK', label: '4. Bank Account & Payouts' },
            { id: 'AUDIT', label: '5. Audit Trail & History' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                if (t.id === 'AUDIT') loadAudit();
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                activeTab === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          
          {/* TAB 1: 360° OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">KYC Status</span>
                  <span className="font-bold text-sm text-slate-900 mt-1 block">{partner.kycStatus || 'PENDING'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Bank Verification</span>
                  <span className="font-bold text-sm text-slate-900 mt-1 block">{partner.bankDetails?.verificationStatus || 'NOT_SUBMITTED'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Jobs Delivered</span>
                  <span className="font-bold text-sm text-blue-700 mt-1 block">{partner.totalJobs || 0}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Lifetime Earnings</span>
                  <span className="font-bold text-sm text-emerald-700 mt-1 block">₹{(partner.totalEarnings || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Real Photo Replacement Control */}
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden border">
                    {partner.avatarUrl ? <img src={partner.avatarUrl} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Partner Profile Photo</h5>
                    <span className="text-[11px] text-slate-500">Real verified face photo for customer safety.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold cursor-pointer shadow-xs">
                    <span>Replace Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoReplace} className="hidden" />
                  </label>
                  {partner.avatarUrl && (
                    <button
                      onClick={handlePhotoRemove}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold border border-rose-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Login Credentials Box */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <h5 className="text-xs font-bold text-amber-400">Partner Portal Login Credentials:</h5>
                <div className="flex items-center justify-between font-mono text-xs">
                  <span>User ID: <strong className="text-white">{partner.loginUserId || partner.id}</strong></span>
                  <span>Password: <strong className="text-white">{partner.loginPassword || '••••••••'}</strong></span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PERSONAL & CONTACT DETAILS */}
          {activeTab === 'PERSONAL' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-sm text-[#1C1C1E]">Personal &amp; Contact Information</h4>
                {!isEditingBasic ? (
                  <button
                    onClick={() => setIsEditingBasic(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditingBasic(false)} className="px-3 py-1 border rounded-lg">Cancel</button>
                    <button onClick={handleSaveBasic} className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold">Save</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    disabled={!isEditingBasic}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Mobile Phone (Calling &amp; OTP)</label>
                  <input
                    type="text"
                    maxLength={10}
                    disabled={!isEditingBasic}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled={!isEditingBasic}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Operational Hub</label>
                  <select
                    disabled={!isEditingBasic}
                    value={assignedHubId}
                    onChange={(e) => setAssignedHubId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white disabled:bg-slate-50"
                  >
                    {hubs.map(h => (
                      <option key={h.id} value={h.id}>{h.city} &bull; {h.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-500 font-semibold block mb-1">Residential Address</label>
                  <input
                    type="text"
                    disabled={!isEditingBasic}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IDENTITY & DOCUMENTS (PAN & AADHAAR EDITABLE) */}
          {activeTab === 'KYC_DOCS' && (
            <div className="space-y-6">
              
              {/* PAN & Aadhaar Quick Edit Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Identity Numbers (Aadhaar &amp; PAN)
                  </h5>
                  {!isEditingKyc ? (
                    <button
                      onClick={() => setIsEditingKyc(true)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      Edit Numbers
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditingKyc(false)} className="px-2.5 py-1 border rounded-lg">Cancel</button>
                      <button onClick={handleSaveKyc} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold">Save Numbers</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">Aadhaar Card (12 Digits)</label>
                    <input
                      type="text"
                      maxLength={12}
                      disabled={!isEditingKyc}
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white disabled:bg-slate-50"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Masked Display: {maskAadhaar(aadhaarNumber)}</span>
                  </div>
                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">PAN Card (10 Characters)</label>
                    <input
                      type="text"
                      maxLength={10}
                      disabled={!isEditingKyc}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase bg-white disabled:bg-slate-50"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Masked Display: {maskPan(panNumber)}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Attached KYC Proof Files ({partner.documents?.length || 0}):
                </h5>

                {(!partner.documents || partner.documents.length === 0) ? (
                  <p className="text-slate-400 text-xs">No documents uploaded.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {partner.documents.map((d) => (
                      <div key={d.id} className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong className="block text-slate-900">{d.documentName}</strong>
                          <span className="text-[10px] text-slate-500">{d.uploadedAt?.slice(0, 10)} &bull; {d.verificationStatus}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {d.verificationStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: BANK ACCOUNT & PAYOUTS */}
          {activeTab === 'BANK' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-sm text-[#1C1C1E]">Bank Account &amp; Settlement Details</h4>
                {!isEditingBank ? (
                  <button
                    onClick={() => setIsEditingBank(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Bank Info</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditingBank(false)} className="px-3 py-1 border rounded-lg">Cancel</button>
                    <button onClick={handleSaveBank} className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold">Save Bank</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    disabled={!isEditingBank}
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Bank Name</label>
                  <input
                    type="text"
                    disabled={!isEditingBank}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Account Number</label>
                  <input
                    type="text"
                    disabled={!isEditingBank}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    maxLength={11}
                    disabled={!isEditingBank}
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase bg-white disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-[#1C1C1E]">Partner Audit Trail &amp; Sensitive Changes</h4>
              {isLoadingAudit ? (
                <p className="text-xs text-slate-400">Loading audit history...</p>
              ) : auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400">No audit logs recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
                      <div>
                        <strong className="text-slate-900 block">{log.action}</strong>
                        <span className="text-slate-500">{log.reason || log.newValue || 'Updated'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};

export default Partner360Modal;
