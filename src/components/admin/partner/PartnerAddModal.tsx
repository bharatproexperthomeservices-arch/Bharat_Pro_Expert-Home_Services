import React, { useState, useRef } from 'react';
import { Partner, HubLocation, DocumentType, RequiredDocumentConfig } from '../../../types';
import { 
  createPartner, 
  compressImage, 
  checkDuplicatePartner,
  DEFAULT_REQUIRED_DOCUMENTS 
} from '../../../services/partnerAuthService';
import { 
  X, 
  Camera, 
  Upload, 
  Check, 
  AlertCircle, 
  FileText, 
  CreditCard, 
  User, 
  Building, 
  CheckCircle2, 
  ShieldCheck, 
  RotateCw,
  RefreshCw
} from 'lucide-react';

interface PartnerAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  hubs: HubLocation[];
  partners: Partner[];
  onPartnerCreated: (newPartner: Partner) => void;
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const PartnerAddModal: React.FC<PartnerAddModalProps> = ({
  isOpen,
  onClose,
  hubs,
  partners,
  onPartnerCreated,
  onAuditLog
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STEP 1: Personal Info & Real Photo
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Address
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [locality, setLocality] = useState('');
  const [sector, setSector] = useState('');
  const [city, setCity] = useState(hubs[0]?.city || 'Patna');
  const [state, setState] = useState(hubs[0]?.state || 'Bihar');
  const [pincode, setPincode] = useState('800001');
  const [fullAddress, setFullAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [isSameAddress, setIsSameAddress] = useState(true);

  // Photo
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoRotateDeg, setPhotoRotateDeg] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // STEP 2: Professional Details
  const [experienceYears, setExperienceYears] = useState(3);
  const [skills, setSkills] = useState<string[]>(['Floor Scrubbing', 'Bathroom Descaling', 'Sofa Extraction']);
  const [languages, setLanguages] = useState<string[]>(['Hindi', 'English']);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(12);
  const [assignedHubId, setAssignedHubId] = useState(hubs[0]?.id || 'hub-patna-central');
  const [availableHours, setAvailableHours] = useState('08:00 - 20:00');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'full-home-cleaning', 
    'bathroom-cleaning'
  ]);

  // STEP 3: Identity & Address KYC
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [panName, setPanName] = useState('');
  const [panUrl, setPanUrl] = useState('');
  const [addressProofUrl, setAddressProofUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');

  // STEP 4: Bank Details & Bank Proof
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('SBIN0001234');
  const [branchName, setBranchName] = useState('');
  const [accountType, setAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [upiId, setUpiId] = useState('');
  const [bankProofType, setBankProofType] = useState<'CANCELLED_CHEQUE' | 'PASSBOOK' | 'BANK_STATEMENT'>('CANCELLED_CHEQUE');
  const [bankProofUrl, setBankProofUrl] = useState('');

  // STEP 5: Agreement & Additional Documents
  const [agreementAccepted, setAgreementAccepted] = useState(true);
  const [policeVerificationUrl, setPoliceVerificationUrl] = useState('');
  const [skillCertificateUrl, setSkillCertificateUrl] = useState('');

  if (!isOpen) return null;

  // Handle Photo File Pick
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await compressImage(file, 800, 800, 0.88);
      setPhotoDataUrl(res.dataUrl);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Failed to process image. Please try another photo.');
    }
  };

  // Handle Live Camera
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setErrorMsg('Camera access denied or unavailable.');
      setIsCameraActive(false);
    }
  };

  const captureCameraPhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      const res = await compressImage(dataUrl, 800, 800, 0.88);
      setPhotoDataUrl(res.dataUrl);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Helper for generic file upload
  const handleDocFileUpload = async (
    file: File, 
    setter: (url: string) => void
  ) => {
    try {
      if (file.type.startsWith('image/')) {
        const res = await compressImage(file, 1200, 1200, 0.85);
        setter(res.dataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => setter(e.target?.result as string);
        reader.readAsDataURL(file);
      }
      setErrorMsg(null);
    } catch {
      setErrorMsg('Failed to process document upload.');
    }
  };

  // Handle Submit
  const handleSubmit = async (submitForVerification: boolean) => {
    setErrorMsg(null);
    const cleanPh = phone.replace(/\D/g, '').slice(-10);

    if (!name.trim() || cleanPh.length !== 10) {
      setErrorMsg('Partner Full Name and 10-digit mobile number are required.');
      return;
    }

    if (submitForVerification) {
      if (!photoDataUrl) {
        setErrorMsg('Real partner profile photo is required before submitting for verification.');
        setStep(1);
        return;
      }
      if (!aadhaarNumber || aadhaarNumber.replace(/\D/g, '').length !== 12) {
        setErrorMsg('Valid 12-digit Aadhaar Number is required for verification.');
        setStep(3);
        return;
      }
      if (!panNumber || panNumber.trim().length !== 10) {
        setErrorMsg('Valid 10-character PAN Number is required.');
        setStep(3);
        return;
      }
      if (accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber) {
        setErrorMsg('Account number and Confirm account number do not match.');
        setStep(4);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const hubObj = hubs.find(h => h.id === assignedHubId);
      const docsPayload: any[] = [];
      const nowIso = new Date().toISOString();

      if (aadhaarFrontUrl) {
        docsPayload.push({
          id: `doc_aadhaar_f_${Date.now()}`,
          partnerId: '',
          documentType: 'AADHAAR_FRONT',
          documentName: 'Aadhaar Card (Front)',
          side: 'FRONT',
          fileUrl: aadhaarFrontUrl,
          uploadedAt: nowIso,
          verificationStatus: 'UNDER_REVIEW'
        });
      }
      if (aadhaarBackUrl) {
        docsPayload.push({
          id: `doc_aadhaar_b_${Date.now()}`,
          partnerId: '',
          documentType: 'AADHAAR_BACK',
          documentName: 'Aadhaar Card (Back)',
          side: 'BACK',
          fileUrl: aadhaarBackUrl,
          uploadedAt: nowIso,
          verificationStatus: 'UNDER_REVIEW'
        });
      }
      if (panUrl) {
        docsPayload.push({
          id: `doc_pan_${Date.now()}`,
          partnerId: '',
          documentType: 'PAN_CARD',
          documentName: 'PAN Card',
          documentNumber: panNumber.trim().toUpperCase(),
          fileUrl: panUrl,
          uploadedAt: nowIso,
          verificationStatus: 'UNDER_REVIEW'
        });
      }
      if (addressProofUrl) {
        docsPayload.push({
          id: `doc_addr_${Date.now()}`,
          partnerId: '',
          documentType: 'ADDRESS_PROOF_FRONT',
          documentName: 'Address Proof',
          fileUrl: addressProofUrl,
          uploadedAt: nowIso,
          verificationStatus: 'UNDER_REVIEW'
        });
      }
      if (bankProofUrl) {
        docsPayload.push({
          id: `doc_bank_${Date.now()}`,
          partnerId: '',
          documentType: 'BANK_PROOF',
          documentName: `Bank Proof (${bankProofType})`,
          fileUrl: bankProofUrl,
          uploadedAt: nowIso,
          verificationStatus: 'UNDER_REVIEW'
        });
      }
      if (selfieUrl) {
        docsPayload.push({
          id: `doc_selfie_${Date.now()}`,
          partnerId: '',
          documentType: 'SELFIE',
          documentName: 'Verification Selfie',
          fileUrl: selfieUrl,
          uploadedAt: nowIso,
          verificationStatus: 'UNDER_REVIEW'
        });
      }
      if (agreementAccepted) {
        docsPayload.push({
          id: `doc_agree_${Date.now()}`,
          partnerId: '',
          documentType: 'AGREEMENT',
          documentName: 'Partner Service Agreement',
          fileUrl: photoDataUrl || 'agreed',
          uploadedAt: nowIso,
          verificationStatus: 'VERIFIED'
        });
      }

      const res = await createPartner({
        name: name.trim(),
        displayName: displayName.trim() || name.trim(),
        guardianName: guardianName.trim(),
        dob,
        gender,
        phone: cleanPh,
        alternatePhone,
        email: email.trim(),
        emergencyContactName,
        emergencyContactPhone,
        avatarUrl: photoDataUrl,

        houseNumber,
        street,
        locality,
        sector,
        city,
        state,
        pincode,
        fullAddress: fullAddress || `${houseNumber} ${street} ${locality} ${sector} ${city} ${state} - ${pincode}`,
        permanentAddress: isSameAddress ? fullAddress : permanentAddress,
        isPermanentSameAsCurrent: isSameAddress,

        experienceYears,
        skills,
        languages,
        serviceRadiusKm,
        preferredHubId: assignedHubId,
        assignedHubId,
        assignedHubName: hubObj?.name || 'Patna Central Hub',
        availableHours,
        approvedCategories: selectedCategories,

        aadhaarNumber: aadhaarNumber.replace(/\D/g, ''),
        panNumber: panNumber.trim().toUpperCase(),
        panName: panName.trim() || name.trim(),
        documents: docsPayload,

        bankDetails: {
          accountHolderName: accountHolderName.trim() || name.trim(),
          bankName,
          accountNumber,
          accountNumberMasked: accountNumber ? `XXXXXX${accountNumber.slice(-4)}` : '',
          ifsc: ifsc.trim().toUpperCase(),
          branchName,
          accountType,
          upiId,
          bankProofType,
          bankProofUrl,
          verificationStatus: bankProofUrl ? 'PENDING' : 'NOT_SUBMITTED'
        }
      }, 'admin_owner', submitForVerification);

      if (res.success && res.partner) {
        onPartnerCreated(res.partner);
        onAuditLog?.('PARTNER_ONBOARDED', res.partner.id, `Admin created partner ${res.partner.name} (${submitForVerification ? 'Submitted for Verification' : 'Saved Draft'})`);
        alert(`✅ Partner ${res.partner.name} successfully ${submitForVerification ? 'submitted for verification' : 'saved as draft'}! Assigned ID: ${res.partner.loginUserId || res.partner.id}`);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to save partner record.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriesList = [
    { id: 'full-home-cleaning', label: 'Full Home Deep Cleaning' },
    { id: 'bathroom-cleaning', label: 'Bathroom Deep Cleaning' },
    { id: 'kitchen-cleaning', label: 'Kitchen & Appliance Cleaning' },
    { id: 'sofa-carpet-cleaning', label: 'Sofa, Carpet & Living' },
    { id: 'mattress-cleaning', label: 'Mattress & Bed Cleaning' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-white border border-[#E5E5EA] shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in">
        
        {/* Header */}
        <div className="p-5 bg-[#1C1C1E] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono font-black uppercase">
                PRODUCTION ONBOARDING WIZARD
              </span>
              <span className="text-xs text-slate-400">Zero AI &bull; Real Photo &amp; Document KYC</span>
            </div>
            <h3 className="text-base font-black text-white mt-1">
              Add New Technician / Service Professional
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold overflow-x-auto gap-2">
          {[
            { num: 1, label: '1. Personal & Photo' },
            { num: 2, label: '2. Professional & Hub' },
            { num: 3, label: '3. Identity KYC' },
            { num: 4, label: '4. Bank Account' },
            { num: 5, label: '5. Agreement & Submit' }
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                step === s.num 
                  ? 'bg-[#1C1C1E] text-white font-bold shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === s.num ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-300 text-slate-700'
              }`}>
                {s.num}
              </span>
              <span className="whitespace-nowrap">{s.label}</span>
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          
          {/* STEP 1: PERSONAL INFORMATION & REAL PHOTO */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Photo Upload Section */}
              <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#1C1C1E] flex items-center gap-2">
                      <Camera className="w-4 h-4 text-amber-600" />
                      <span>Real Partner Profile Photo (Mandatory)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      NO AI or placeholder images. Upload genuine front-facing photo or capture from device camera.
                    </p>
                  </div>
                  {photoDataUrl && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                      PHOTO ATTACHED
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Photo Preview Canvas */}
                  <div className="relative w-32 h-32 rounded-2xl bg-slate-200 overflow-hidden border-2 border-slate-300 shrink-0 flex items-center justify-center shadow-inner">
                    {photoDataUrl ? (
                      <img 
                        src={photoDataUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover transition-transform"
                        style={{ transform: `rotate(${photoRotateDeg}deg)` }}
                      />
                    ) : (
                      <div className="text-center p-3 text-slate-400">
                        <User className="w-10 h-10 mx-auto opacity-50" />
                        <span className="text-[10px] block mt-1">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Camera / Upload Actions */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        onChange={handlePhotoFileChange} 
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Choose from Device</span>
                      </button>

                      <button
                        type="button"
                        onClick={isCameraActive ? captureCameraPhoto : startCamera}
                        className="px-3.5 py-2 bg-[#1C1C1E] hover:bg-black text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isCameraActive ? 'Capture Snapshot' : 'Take from Camera'}</span>
                      </button>

                      {photoDataUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPhotoRotateDeg((prev) => (prev + 90) % 360)}
                            className="p-2 bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100"
                            title="Rotate Photo"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPhotoDataUrl(''); setPhotoRotateDeg(0); }}
                            className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold border border-rose-200"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>

                    {isCameraActive && (
                      <div className="mt-3 p-3 bg-black rounded-2xl relative">
                        <video ref={videoRef} autoPlay playsInline className="w-full max-h-48 object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="absolute top-5 right-5 p-1 bg-black/60 rounded-full text-white text-xs"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Verma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display / Nick Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Father / Guardian Name</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="e.g. Suresh Verma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number (Calling &amp; OTP) *</label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alternate Phone Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Family member phone"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono bg-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emergency Contact (Name &amp; Phone)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Name"
                      className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 bg-white text-[11px]"
                    />
                    <input
                      type="text"
                      maxLength={10}
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Phone"
                      className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 bg-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Address Fields */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Residential Address Details
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">House / Flat No.</label>
                    <input
                      type="text"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      placeholder="e.g. Flat 302, Block B"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Street / Road</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. Bailey Road"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Locality / Sector</label>
                    <input
                      type="text"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Kankarbagh"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: PROFESSIONAL & OPERATIONAL DETAILS */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operational Hub Assignment *</label>
                  <select
                    value={assignedHubId}
                    onChange={(e) => setAssignedHubId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    {hubs.map(h => (
                      <option key={h.id} value={h.id}>{h.city} &bull; {h.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service Radius (km)</label>
                  <input
                    type="number"
                    value={serviceRadiusKm}
                    onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Years of Experience in Deep Cleaning</label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Available Hours</label>
                  <input
                    type="text"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Service Categories Selection */}
              <div className="space-y-3">
                <label className="font-bold text-slate-800 block text-sm">
                  Approved Cleaning Service Categories (Dispatch Eligibility) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoriesList.map(cat => {
                    const isChecked = selectedCategories.includes(cat.id);
                    return (
                      <label 
                        key={cat.id}
                        className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                          isChecked ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, cat.id]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-bold text-slate-800">{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: IDENTITY & ADDRESS KYC */}
          {step === 3 && (
            <div className="space-y-6">
              
              {/* Aadhaar Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1C1C1E]">Aadhaar Card (UIDAI Verification)</h4>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">12 Digits</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Aadhaar Number *</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="12-digit UID"
                    className="w-full sm:w-1/2 px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 block text-xs">Aadhaar Front Photo *</span>
                    {aadhaarFrontUrl ? (
                      <div className="relative h-28 rounded-lg overflow-hidden border">
                        <img src={aadhaarFrontUrl} alt="Front" className="w-full h-full object-cover" />
                        <button onClick={() => setAadhaarFrontUrl('')} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => e.target.files?.[0] && handleDocFileUpload(e.target.files[0], setAadhaarFrontUrl)} 
                        className="text-xs"
                      />
                    )}
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 block text-xs">Aadhaar Back Photo *</span>
                    {aadhaarBackUrl ? (
                      <div className="relative h-28 rounded-lg overflow-hidden border">
                        <img src={aadhaarBackUrl} alt="Back" className="w-full h-full object-cover" />
                        <button onClick={() => setAadhaarBackUrl('')} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => e.target.files?.[0] && handleDocFileUpload(e.target.files[0], setAadhaarBackUrl)} 
                        className="text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* PAN Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1C1C1E]">PAN Card (Taxpayer Verification)</h4>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">10 Characters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">PAN Number *</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Name Printed on PAN</label>
                    <input
                      type="text"
                      value={panName}
                      onChange={(e) => setPanName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block text-xs">PAN Card Image *</span>
                  {panUrl ? (
                    <div className="relative h-28 rounded-lg overflow-hidden border">
                      <img src={panUrl} alt="PAN" className="w-full h-full object-cover" />
                      <button onClick={() => setPanUrl('')} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => e.target.files?.[0] && handleDocFileUpload(e.target.files[0], setPanUrl)} 
                      className="text-xs"
                    />
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STEP 4: BANK DETAILS & BANK PROOF */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200">
                <span className="text-xs font-bold text-amber-950 block">Bank Account &amp; Payout Settings</span>
                <span className="text-[11px] text-amber-800">
                  Direct weekly commission settlements are transferred to this account. Ensure account number matches passbook.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Name as per bank records"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Name *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Number *</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Account number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Confirm Account Number *</label>
                  <input
                    type="text"
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Re-enter account number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="mobile@upi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Bank Proof Upload */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Bank Proof Document (Cancelled Cheque or Passbook)</span>
                  <select
                    value={bankProofType}
                    onChange={(e) => setBankProofType(e.target.value as any)}
                    className="px-2 py-1 rounded-lg border text-xs bg-white font-semibold"
                  >
                    <option value="CANCELLED_CHEQUE">Cancelled Cheque</option>
                    <option value="PASSBOOK">Passbook Front Page</option>
                    <option value="BANK_STATEMENT">Bank Statement</option>
                  </select>
                </div>

                {bankProofUrl ? (
                  <div className="relative h-32 rounded-xl overflow-hidden border">
                    <img src={bankProofUrl} alt="Bank Proof" className="w-full h-full object-cover" />
                    <button onClick={() => setBankProofUrl('')} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={(e) => e.target.files?.[0] && handleDocFileUpload(e.target.files[0], setBankProofUrl)} 
                    className="text-xs"
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 5: AGREEMENT & FINAL SUBMIT */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <h4 className="font-bold text-sm text-amber-400">Bharat Pro Expert Partner Agreement</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  I hereby certify that all information provided is accurate and true to the best of my knowledge. The technician agrees to follow hospital-grade Diversey cleaning SOPs, wear Bharat Pro uniform during jobs, respect customer premises, and adhere to our 15% platform margin settlement policy.
                </p>
                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={agreementAccepted} 
                    onChange={(e) => setAgreementAccepted(e.target.checked)} 
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span className="text-xs font-bold text-white">Technician has signed and accepted partner terms</span>
                </label>
              </div>

              {/* Summary Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Onboarding Summary:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Name:</span>
                    <strong className="truncate block">{name || 'Pending'}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Mobile:</span>
                    <strong className="font-mono">{phone || 'Pending'}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Profile Photo:</span>
                    <span className={photoDataUrl ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                      {photoDataUrl ? 'Attached' : 'Missing'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Aadhaar &amp; PAN:</span>
                    <span className={aadhaarNumber && panNumber ? 'text-emerald-700 font-bold' : 'text-amber-600'}>
                      {aadhaarNumber && panNumber ? 'Provided' : 'Incomplete'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                &larr; Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Save as Draft Option (Section 21) */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-400 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Save as Draft
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev + 1) as any)}
                className="px-5 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Next Step &rarr;
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit for Verification'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PartnerAddModal;
