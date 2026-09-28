import React, { useState, useEffect } from 'react';

export type BookingStatus = 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'IN_TRANSIT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CandidatePartner {
  id: string;
  fullName: string;
  mobileNumber: string;
  ratingAverage: number;
  distanceKm: number;
  completedJobsCount: number;
  currentStatus: 'FREE' | 'BUSY';
  hubName: string;
}

export interface BookingItem {
  bookingId: string;
  customerName: string;
  customerMobile: string;
  serviceTitle: string;
  category: string;
  state: string;
  city: string;
  hubName: string;
  scheduledDate: string;
  scheduledSlot: string;
  amount: number;
  gstAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: BookingStatus;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  assignedPartnerMobile?: string;
  cancellationReason?: string;
  createdAt: string;
}

const CANDIDATE_PARTNERS_MOCK: CandidatePartner[] = [
  { id: 'prt-101', fullName: 'Ramesh Kumar', mobileNumber: '9876543210', ratingAverage: 4.85, distanceKm: 2.1, completedJobsCount: 142, currentStatus: 'FREE', hubName: 'Sector 14 & 15' },
  { id: 'prt-103', fullName: 'Vikas Singh', mobileNumber: '9812345678', ratingAverage: 4.70, distanceKm: 3.4, completedJobsCount: 88, currentStatus: 'FREE', hubName: 'DLF Phase 1-5 & Cyber City' },
  { id: 'prt-104', fullName: 'Sunil Verma', mobileNumber: '9934567812', ratingAverage: 4.90, distanceKm: 1.8, completedJobsCount: 210, currentStatus: 'FREE', hubName: 'Boring Road & Patliputra' },
  { id: 'prt-105', fullName: 'Manoj Pandit', mobileNumber: '9712304958', ratingAverage: 4.60, distanceKm: 4.2, completedJobsCount: 64, currentStatus: 'BUSY', hubName: 'Lalpur & Kokar' },
];

const DEFAULT_BOOKINGS: BookingItem[] = [
  {
    bookingId: 'BK-10085',
    customerName: 'Ananya Sharma',
    customerMobile: '9871122334',
    serviceTitle: '3-Seater Fabric Sofa Deep Cleaning',
    category: 'Sofa Cleaning',
    state: 'Haryana',
    city: 'Gurugram',
    hubName: 'Sector 14 & 15',
    scheduledDate: '2024-09-29',
    scheduledSlot: '10:00 AM - 11:30 AM',
    amount: 1499,
    gstAmount: 74.95,
    discountAmount: 100,
    finalAmount: 1473.95,
    status: 'PENDING_ASSIGNMENT',
    createdAt: '2024-09-28 08:30 AM',
  },
  {
    bookingId: 'BK-10084',
    customerName: 'Rajesh Gutpa',
    customerMobile: '9810998877',
    serviceTitle: '2 BHK Complete Deep Cleaning',
    category: 'Full Home Deep Cleaning',
    state: 'Haryana',
    city: 'Gurugram',
    hubName: 'DLF Phase 1-5 & Cyber City',
    scheduledDate: '2024-09-28',
    scheduledSlot: '02:00 PM - 06:00 PM',
    amount: 3499,
    gstAmount: 174.95,
    discountAmount: 0,
    finalAmount: 3673.95,
    status: 'ASSIGNED',
    assignedPartnerId: 'prt-103',
    assignedPartnerName: 'Vikas Singh',
    assignedPartnerMobile: '9812345678',
    createdAt: '2024-09-27 04:15 PM',
  },
  {
    bookingId: 'BK-10080',
    customerName: 'Priya Srivastava',
    customerMobile: '9955112233',
    serviceTitle: 'Bathroom Deep Cleaning (2 Washrooms)',
    category: 'Bathroom Cleaning',
    state: 'Bihar',
    city: 'Patna',
    hubName: 'Boring Road & Patliputra',
    scheduledDate: '2024-09-27',
    scheduledSlot: '11:00 AM - 01:00 PM',
    amount: 1199,
    gstAmount: 59.95,
    discountAmount: 150,
    finalAmount: 1108.95,
    status: 'COMPLETED',
    assignedPartnerId: 'prt-104',
    assignedPartnerName: 'Sunil Verma',
    assignedPartnerMobile: '9934567812',
    createdAt: '2024-09-26 09:00 AM',
  }
];

export const AdminBookingsTab: React.FC = () => {
  const [bookings, setBookings] = useState<BookingItem[]>(() => {
    const saved = localStorage.getItem('bharatpro_bookings');
    return saved ? JSON.parse(saved) : DEFAULT_BOOKINGS;
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');

  // Modal States
  const [assignModalBooking, setAssignModalBooking] = useState<BookingItem | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<BookingItem | null>(null);
  const [cancellationReasonText, setCancellationReasonText] = useState<string>('Customer Request');

  useEffect(() => {
    localStorage.setItem('bharatpro_bookings', JSON.stringify(bookings));
  }, [bookings]);

  const hubsList = ['ALL', ...Array.from(new Set(bookings.map((b) => b.hubName)))];

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerMobile.includes(searchQuery) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    const matchesHub = selectedHub === 'ALL' || b.hubName === selectedHub;
    return matchesSearch && matchesStatus && matchesHub;
  });

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING_ASSIGNMENT');

  const handleAssignPartner = (bookingId: string, partner: CandidatePartner) => {
    const updated = bookings.map((b) => {
      if (b.bookingId === bookingId) {
        return {
          ...b,
          status: 'ASSIGNED' as BookingStatus,
          assignedPartnerId: partner.id,
          assignedPartnerName: partner.fullName,
          assignedPartnerMobile: partner.mobileNumber,
        };
      }
      return b;
    });

    setBookings(updated);
    setAssignModalBooking(null);
  };

  const handleCancelBooking = (bookingId: string) => {
    const updated = bookings.map((b) => {
      if (b.bookingId === bookingId) {
        return {
          ...b,
          status: 'CANCELLED' as BookingStatus,
          cancellationReason: cancellationReasonText,
        };
      }
      return b;
    });

    setBookings(updated);
    setCancelModalBooking(null);
  };

  const getStatusBadgeClass = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING_ASSIGNMENT':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'ASSIGNED':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'IN_PROGRESS':
      case 'IN_TRANSIT':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Bookings & Order Snapshot Engine</h1>
          <p className="text-slate-400 text-sm">Real-time Order Lifecycle, Proximity Dispatch & Manual Partner Assignment</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300">
            Total Bookings: <strong className="text-white">{bookings.length}</strong>
          </span>
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold">
            Pending Dispatch: <strong>{pendingBookings.length}</strong>
          </span>
        </div>
      </div>

      {/* TOP COMMAND BOARD: Pending Assignments */}
      {pendingBookings.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
              <h2 className="text-lg font-bold text-amber-400">Pending Assignment Queue (Action Required)</h2>
            </div>
            <span className="text-xs text-slate-400">Nearest active partners automatically matched</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingBookings.map((b) => (
              <div key={b.bookingId} className="bg-slate-850 p-4 rounded-xl border border-slate-700 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-amber-400">{b.bookingId}</span>
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      📍 {b.hubName}
                    </span>
                  </div>
                  <h4 className="font-semibold text-white text-sm mt-2">{b.serviceTitle}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">👤 {b.customerName} (📱 +91 {b.customerMobile})</p>
                  <p className="text-xs text-amber-400/90 mt-1">🗓 {b.scheduledDate} | ⏰ {b.scheduledSlot}</p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-700/60">
                  <span className="text-base font-bold text-white">₹{b.finalAmount}</span>
                  <button
                    onClick={() => setAssignModalBooking(b)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold shadow transition"
                  >
                    ⚡ Assign Nearby Partner
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <input
          type="text"
          placeholder="Search by Booking ID, Customer Name or Mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-lg border border-slate-700 flex-1 min-w-[260px] focus:outline-none focus:border-amber-500 text-sm"
        />

        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-xs font-medium">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-xs font-medium">Hub:</label>
          <select
            value={selectedHub}
            onChange={(e) => setSelectedHub(e.target.value)}
            className="bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none"
          >
            {hubsList.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Master Booking Table */}
      <div className="overflow-x-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-700 uppercase font-semibold">
            <tr>
              <th className="p-4">Booking ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Service & Hub</th>
              <th className="p-4">Slot</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Assigned Partner</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 text-slate-200">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                  No bookings match your current search and filter criteria.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.bookingId} className="hover:bg-slate-750/50 transition">
                  <td className="p-4 font-mono font-bold text-amber-400">{b.bookingId}</td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{b.customerName}</div>
                    <div className="text-[11px] text-slate-400">+91 {b.customerMobile}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-200">{b.serviceTitle}</div>
                    <div className="text-[11px] text-slate-400">📍 {b.hubName}</div>
                  </td>
                  <td className="p-4">
                    <div>{b.scheduledDate}</div>
                    <div className="text-[11px] text-amber-400">{b.scheduledSlot}</div>
                  </td>
                  <td className="p-4 font-bold text-white">
                    ₹{b.finalAmount}
                    <div className="text-[10px] text-slate-400 font-normal">(GST Incl.)</div>
                  </td>
                  <td className="p-4">
                    {b.assignedPartnerName ? (
                      <div>
                        <div className="font-semibold text-emerald-400">{b.assignedPartnerName}</div>
                        <div className="text-[11px] text-slate-400">+91 {b.assignedPartnerMobile}</div>
                      </div>
                    ) : (
                      <span className="text-amber-400 font-semibold italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusBadgeClass(b.status)}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                      <>
                        <button
                          onClick={() => setAssignModalBooking(b)}
                          className="bg-slate-700 hover:bg-slate-600 text-white text-[11px] px-2.5 py-1 rounded font-medium transition"
                        >
                          {b.assignedPartnerId ? 'Re-assign' : 'Assign'}
                        </button>
                        <button
                          onClick={() => setCancelModalBooking(b)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-[11px] px-2.5 py-1 rounded transition"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Dispatch / Assign Partner Popup Modal */}
      {assignModalBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-amber-400">Assign Service Professional</h3>
                <p className="text-xs text-slate-400">Booking ID: {assignModalBooking.bookingId} ({assignModalBooking.hubName})</p>
              </div>
              <button onClick={() => setAssignModalBooking(null)} className="text-slate-400 text-xl font-bold">
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Nearby active partners sorted by distance and rating for <strong>{assignModalBooking.serviceTitle}</strong>:
            </p>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {CANDIDATE_PARTNERS_MOCK.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-slate-900 p-3.5 rounded-xl border border-slate-700 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{candidate.fullName}</h4>
                      <span className="text-xs font-bold text-amber-400">★ {candidate.ratingAverage}</span>
                    </div>
                    <p className="text-xs text-slate-400">📱 +91 {candidate.mobileNumber} | 📍 {candidate.distanceKm} KM away</p>
                    <p className="text-[11px] text-slate-500">{candidate.completedJobsCount} jobs completed in {candidate.hubName}</p>
                  </div>

                  <button
                    onClick={() => handleAssignPartner(assignModalBooking.bookingId, candidate)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs shadow transition"
                  >
                    Confirm Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-400">Cancel Booking {cancelModalBooking.bookingId}</h3>
            <p className="text-xs text-slate-300">Select or type the cancellation reason:</p>

            <select
              value={cancellationReasonText}
              onChange={(e) => setCancellationReasonText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            >
              <option value="Customer Request">Customer Request</option>
              <option value="Partner Unavailable in Hub">Partner Unavailable in Hub</option>
              <option value="Slot Rescheduled">Slot Rescheduled</option>
              <option value="Address Out of Service Coverage">Address Out of Service Coverage</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 bg-slate-700 text-white rounded text-xs"
              >
                Close
              </button>
              <button
                onClick={() => handleCancelBooking(cancelModalBooking.bookingId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};