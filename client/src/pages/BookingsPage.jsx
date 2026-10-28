import React, { useEffect, useState } from 'react';
import { CalendarCheck, AlertTriangle, ArrowRight, RefreshCw, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import { BOOKING_STATES, TRANSITION_REASON_CODES } from '../../../shared/constants';

const KANBAN_COLUMNS = [
  { key: BOOKING_STATES.PENDING, title: 'Unassigned / Pending', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: BOOKING_STATES.ASSIGNED, title: 'Assigned', bg: 'bg-blue-50', border: 'border-blue-200' },
  { key: BOOKING_STATES.EN_ROUTE, title: 'En-Route', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { key: BOOKING_STATES.IN_PROGRESS, title: 'In-Progress', bg: 'bg-purple-50', border: 'border-purple-200' },
  { key: BOOKING_STATES.COMPLETED, title: 'Completed', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: BOOKING_STATES.SETTLED, title: 'Settled / Issue', bg: 'bg-slate-100', border: 'border-slate-200' },
];

export function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // { booking, toState }
  const [reasonCode, setReasonCode] = useState('NORMAL_FLOW');
  const [draggedBooking, setDraggedBooking] = useState(null);
  const { showToast } = useStore();

  const fetchBookings = () => {
    setLoading(true);
    fetch('/api/bookings')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setBookings(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDragStart = (e, booking) => {
    setDraggedBooking(booking);
    e.dataTransfer.setData('bookingId', booking.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetState) => {
    e.preventDefault();
    if (!draggedBooking) return;

    if (draggedBooking.status === targetState) {
      setDraggedBooking(null);
      return;
    }

    // Prompt for mandatory reason code before attempting transition
    setActiveModal({
      booking: draggedBooking,
      toState: targetState
    });
  };

  const confirmTransition = () => {
    if (!activeModal) return;

    const { booking, toState } = activeModal;

    fetch(`/api/bookings/${booking.id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toState,
        reasonCode,
        actor: 'KANBAN_OPERATOR'
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          showToast(`Booking ${booking.bookingNumber} moved to ${toState}`, 'success');
          fetchBookings();
        } else {
          showToast(`Transition rejected: ${res.error}`, 'error');
        }
        setActiveModal(null);
        setDraggedBooking(null);
      })
      .catch((err) => {
        showToast(`Transition failed: ${err.message}`, 'error');
        setActiveModal(null);
        setDraggedBooking(null);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Lifecycle Kanban</h1>
          <p className="text-sm text-gray-500">
            Interactive lifecycle board with enforced state machine transitions and audit logging
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>Refresh Board</span>
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const columnBookings = bookings.filter((b) => b.status === col.key);

          return (
            <div
              key={col.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`rounded-xl border ${col.border} ${col.bg} p-3 min-h-[650px] flex flex-col`}
            >
              <div className="flex items-center justify-between pb-3 border-b mb-3">
                <span className="font-extrabold text-xs text-gray-800 uppercase tracking-wider">
                  {col.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-white text-gray-700 border shadow-xs">
                  {columnBookings.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {columnBookings.map((b) => (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, b)}
                    className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-emerald-700">{b.bookingNumber}</span>
                      <span className="text-[10px] font-bold text-gray-400">₹{b.totalAmount}</span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">{b.serviceName}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{b.customerName}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                      <span>{b.cityName}</span>
                      <span className="font-medium text-slate-700">{b.partnerId ? b.partnerId : 'Unassigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory Reason Code Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Mandatory Transition Reason</h3>
                <p className="text-xs text-gray-500">State machine requires reason code for audit logging</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border text-xs text-gray-700 space-y-1">
              <p>
                <strong>Booking:</strong> {activeModal.booking.bookingNumber} ({activeModal.booking.serviceName})
              </p>
              <p className="flex items-center space-x-2">
                <span>Transition:</span>
                <span className="font-bold text-amber-700">{activeModal.booking.status}</span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span className="font-bold text-emerald-700">{activeModal.toState}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Select Reason Code:
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(TRANSITION_REASON_CODES).map(([code, desc]) => (
                  <option key={code} value={code}>
                    [{code}] {desc}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmTransition}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"
              >
                Execute Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
