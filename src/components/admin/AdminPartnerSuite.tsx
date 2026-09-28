import React, { useState, useEffect } from 'react';

export interface KycDocument {
  docType: 'AADHAR' | 'PAN' | 'BANK_PASSBOOK' | 'POLICE_VERIFICATION';
  docNumber: string;
  fileUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface PartnerJobRecord {
  bookingId: string;
  serviceTitle: string;
  date: string;
  customerName: string;
  amount: number;
  commissionDeducted: number;
  status: 'COMPLETED' | 'CANCELLED';
  ratingGiven?: number;
  cancellationReason?: string;
}

export interface PartnerProfile {
  id: string;
  fullName: string;
  mobileNumber: string;
  photoUrl: string;
  dob: string;
  gender: string;
  address: string;
  state: string;
  city: string;
  hubName: string;
  categories: string[];
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'REJECTED';
  onboardingStep: number;
  ratingAverage: number;
  totalJobsCompleted: number;
  totalJobsCancelled: number;
  walletBalance: number;
  pendingPayoutAmount: number;
  documents: KycDocument[];
  jobHistory: PartnerJobRecord[];
  supportTicketsCount: number;
  joinedDate: string;
}

const DEFAULT_PARTNERS: PartnerProfile[] = [
  {
    id: 'prt-101',
    fullName: 'Ramesh Kumar',
    mobileNumber: '9876543210',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    dob: '1992-05-14',
    gender: 'Male',
    address: 'H.No 45, Sector 14, Gurugram',
    state: 'Haryana',
    city: 'Gurugram',
    hubName: 'Sector 14 & 15',
    categories: ['Sofa Cleaning', 'Full Home Deep Cleaning'],
    status: 'ACTIVE',
    onboardingStep: 9,
    ratingAverage: 4.85,
    totalJobsCompleted: 142,
    totalJobsCancelled: 3,
    walletBalance: 3450,
    pendingPayoutAmount: 2100,
    joinedDate: '2024-01-15',
    supportTicketsCount: 1,
    documents: [
      { docType: 'AADHAR', docNumber: '**** **** 4821', fileUrl: 'https://via.placeholder.com/600x400?text=Aadhar+Card+Front+Back', status: 'APPROVED' },
      { docType: 'PAN', docNumber: 'ABCDE1234F', fileUrl: 'https://via.placeholder.com/600x400?text=PAN+Card+Doc', status: 'APPROVED' },
      { docType: 'BANK_PASSBOOK', docNumber: 'A/C: 918230192831 | IFSC: SBIN0001234', fileUrl: 'https://via.placeholder.com/600x400?text=Bank+Passbook+Photo', status: 'APPROVED' }
    ],
    jobHistory: [
      { bookingId: 'BK-9981', serviceTitle: '3-Seater Fabric Sofa Cleaning', date: '2024-09-24', customerName: 'Amit Sharma', amount: 1499, commissionDeducted: 224.85, status: 'COMPLETED', ratingGiven: 5 },
      { bookingId: 'BK-9820', serviceTitle: '2 BHK Complete Deep Cleaning', date: '2024-09-21', customerName: 'Pooja Verma', amount: 3499, commissionDeducted: 524.85, status: 'COMPLETED', ratingGiven: 4.7 }
    ]
  },
  {
    id: 'prt-102',
    fullName: 'Suresh Kumar Yadav',
    mobileNumber: '9123456789',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    dob: '1995-11-20',
    gender: 'Male',
    address: 'Boring Road, Near Canal, Patna',
    state: 'Bihar',
    city: 'Patna',
    hubName: 'Boring Road & Patliputra',
    categories: ['Sofa Cleaning', 'Bathroom Cleaning'],
    status: 'PENDING_VERIFICATION',
    onboardingStep: 8,
    ratingAverage: 0.00,
    totalJobsCompleted: 0,
    totalJobsCancelled: 0,
    walletBalance: 0,
    pendingPayoutAmount: 0,
    joinedDate: '2024-09-27',
    supportTicketsCount: 0,
    documents: [
      { docType: 'AADHAR', docNumber: '**** **** 9012', fileUrl: 'https://via.placeholder.com/600x400?text=Aadhar+Pending+Check', status: 'PENDING' },
      { docType: 'PAN', docNumber: 'XYZPB9876Q', fileUrl: 'https://via.placeholder.com/600x400?text=PAN+Pending+Check', status: 'PENDING' },
      { docType: 'BANK_PASSBOOK', docNumber: 'A/C: 40912830192 | IFSC: PUNB0123400', fileUrl: 'https://via.placeholder.com/600x400?text=Bank+Check', status: 'PENDING' }
    ],
    jobHistory: []
  }
];

export const AdminPartnerSuite: React.FC = () => {
  const [partners, setPartners] = useState<PartnerProfile[]>(() => {
    const saved = localStorage.getItem('bharatpro_partners');
    return saved ? JSON.parse(saved) : DEFAULT_PARTNERS;
  });

  const [searchMobile, setSearchMobile] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(partners[0]?.id || null);
  const [rejectionModalDoc, setRejectionModalDoc] = useState<{ partnerId: string; docType: string } | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('bharatpro_partners', JSON.stringify(partners));
  }, [partners]);

  const filteredPartners = partners.filter((p) => {
    const matchesMobile = p.mobileNumber.includes(searchMobile) || p.fullName.toLowerCase().includes(searchMobile.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchesMobile && matchesStatus;
  });

  const activePartner = partners.find((p) => p.id === selectedPartnerId) || partners[0];

  const handleDocumentAction = (partnerId: string, docType: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    const updated = partners.map((p) => {
      if (p.id === partnerId) {
        const updatedDocs = p.documents.map((d) => {
          if (d.docType === docType) {
            return {
              ...d,
              status: action === 'APPROVE' ? ('APPROVED' as const) : ('REJECTED' as const),
              rejectionReason: reason || undefined,
            };
          }
          return d;
        });

        // Check if all docs approved
        const allApproved = updatedDocs.every((d) => d.status === 'APPROVED');
        return {
          ...p,
          documents: updatedDocs,
          status: allApproved ? ('ACTIVE' as const) : p.status,
        };
      }
      return p;
    });

    setPartners(updated);
    setRejectionModalDoc(null);
    setRejectionReasonText('');
  };

  const handleStatusChange = (partnerId: string, newStatus: PartnerProfile['status']) => {
    const updated = partners.map((p) => (p.id === partnerId ? { ...p, status: newStatus } : p));
    setPartners(updated);
  };

  const handleManualPayoutRelease = (partnerId: string) => {
    if (window.confirm(`Release ₹${activePartner?.pendingPayoutAmount} direct bank payout for ${activePartner?.fullName}?`)) {
      const updated = partners.map((p) => {
        if (p.id === partnerId) {
          return {
            ...p,
            pendingPayoutAmount: 0,
          };
        }
        return p;
      });
      setPartners(updated);
      alert('Payout initiated and marked as settled.');
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Partner Operations Suite</h1>
          <p className="text-slate-400 text-sm">Step-by-Step Onboarding Verification & 360° Mobile Search Profile</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300">
            Total Partners: <strong className="text-amber-400">{partners.length}</strong>
          </span>
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold">
            Pending Approval: <strong>{partners.filter((p) => p.status === 'PENDING_VERIFICATION').length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <input
          type="text"
          placeholder="Search by Mobile Number or Name..."
          value={searchMobile}
          onChange={(e) => setSearchMobile(e.target.value)}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-lg border border-slate-700 flex-1 min-w-[260px] focus:outline-none focus:border-amber-500 text-sm"
        />

        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-xs font-medium">Status Filter:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 text-sm"
          >
            <option value="ALL">All Partners</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended / Blocked</option>
          </select>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List Pane (4 Columns) */}
        <div className="lg:col-span-4 space-y-3 max-h-[80vh] overflow-y-auto pr-1">
          {filteredPartners.length === 0 ? (
            <div className="p-8 text-center bg-slate-800 rounded-xl border border-slate-700 text-slate-400 text-sm">
              No partner records found matching search.
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <div
                key={partner.id}
                onClick={() => setSelectedPartnerId(partner.id)}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                  activePartner?.id === partner.id
                    ? 'bg-slate-800 border-amber-500 shadow-lg'
                    : 'bg-slate-850/60 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <img
                  src={partner.photoUrl}
                  alt={partner.fullName}
                  className="w-12 h-12 rounded-full object-cover border border-slate-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-white text-sm truncate">{partner.fullName}</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        partner.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : partner.status === 'PENDING_VERIFICATION'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {partner.status === 'PENDING_VERIFICATION' ? 'KYC PENDING' : partner.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">📱 +91 {partner.mobileNumber}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">📍 {partner.hubName} ({partner.city})</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right 360° Detail Inspector Pane (8 Columns) */}
        {activePartner && (
          <div className="lg:col-span-8 bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6">
            {/* Header / Identity Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-700">
              <div className="flex items-center gap-4">
                <img
                  src={activePartner.photoUrl}
                  alt={activePartner.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-400"
                />
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {activePartner.fullName}
                    <span className="text-xs text-slate-400 font-normal">(ID: {activePartner.id})</span>
                  </h2>
                  <p className="text-xs text-amber-400 font-medium">📱 +91 {activePartner.mobileNumber}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    📍 {activePartner.address}, {activePartner.hubName}, {activePartner.city}
                  </p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {activePartner.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleStatusChange(activePartner.id, 'SUSPENDED')}
                    className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs px-3 py-2 rounded-lg font-semibold transition"
                  >
                    Suspend Partner
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(activePartner.id, 'ACTIVE')}
                    className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 text-xs px-4 py-2 rounded-lg font-bold transition"
                  >
                    Approve & Activate
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-[11px]">Rating Average</span>
                <p className="text-lg font-bold text-amber-400">★ {activePartner.ratingAverage.toFixed(1)} / 5.0</p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-[11px]">Completed Jobs</span>
                <p className="text-lg font-bold text-white">{activePartner.totalJobsCompleted}</p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-[11px]">Wallet Balance</span>
                <p className="text-lg font-bold text-emerald-400">₹{activePartner.walletBalance}</p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-[11px]">Pending Payout</span>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-amber-400">₹{activePartner.pendingPayoutAmount}</p>
                  {activePartner.pendingPayoutAmount > 0 && (
                    <button
                      onClick={() => handleManualPayoutRelease(activePartner.id)}
                      className="text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 px-2 py-0.5 rounded font-bold"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Document Verification Inspector (Step-by-Step KYC) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Step-by-Step KYC Verification Inspector</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activePartner.documents.map((doc) => (
                  <div key={doc.docType} className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">{doc.docType}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            doc.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : doc.status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{doc.docNumber}</p>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center mt-3 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-1.5 rounded border border-slate-700"
                      >
                        🔍 View Document File
                      </a>

                      {doc.rejectionReason && (
                        <p className="text-[11px] text-red-400 mt-2 bg-red-950/30 p-1.5 rounded border border-red-900/40">
                          Reason: {doc.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleDocumentAction(activePartner.id, doc.docType, 'APPROVE')}
                        className="flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 text-xs py-1 rounded font-semibold transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectionModalDoc({ partnerId: activePartner.id, docType: doc.docType })}
                        className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs py-1 rounded font-semibold transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Skill Tags & Categories */}
            <div>
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Assigned Service Skills</h3>
              <div className="flex flex-wrap gap-2">
                {activePartner.categories.map((cat) => (
                  <span key={cat} className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-1 rounded-full font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Job History Table */}
            <div>
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Recent Job Deliveries & Commission Deductions</h3>
              {activePartner.jobHistory.length === 0 ? (
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 text-xs text-slate-400 text-center">
                  No completed job transactions logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Booking ID</th>
                        <th className="p-3">Service</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Gross Amount</th>
                        <th className="p-3">Comm. (15%)</th>
                        <th className="p-3">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {activePartner.jobHistory.map((job) => (
                        <tr key={job.bookingId}>
                          <td className="p-3 font-semibold text-amber-400">{job.bookingId}</td>
                          <td className="p-3">{job.serviceTitle}</td>
                          <td className="p-3">{job.customerName}</td>
                          <td className="p-3 font-bold text-white">₹{job.amount}</td>
                          <td className="p-3 text-red-400">-₹{job.commissionDeducted}</td>
                          <td className="p-3 font-bold text-amber-400">★ {job.ratingGiven || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {rejectionModalDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-400">Reject {rejectionModalDoc.docType} Document</h3>
            <p className="text-xs text-slate-300">
              Please state the exact rejection reason (e.g. Blur Photo, Name Mismatch, Expired Doc). This reason will be sent to the partner mobile app.
            </p>
            <textarea
              required
              rows={3}
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              placeholder="Type mandatory rejection reason..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            ></textarea>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalDoc(null)}
                className="px-4 py-2 bg-slate-700 text-white rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDocumentAction(rejectionModalDoc.partnerId, rejectionModalDoc.docType, 'REJECT', rejectionReasonText)
                }
                disabled={!rejectionReasonText.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};