import React, { useEffect, useState } from 'react';
import { Send, CheckCircle, XCircle, RefreshCw, MapPin, Award, ShieldAlert } from 'lucide-react';
import { useStore } from '../store/useStore';

export function DispatchPage() {
  const [unassignedBookings, setUnassignedBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [reasonCode, setReasonCode] = useState('FORCE_ASSIGNED');
  const { showToast } = useStore();

  const fetchUnassigned = () => {
    setLoading(true);
    fetch('/api/bookings')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          const unassigned = res.data.filter((b) => b.status === 'PENDING' || !b.partnerId);
          setUnassignedBookings(unassigned);
          if (unassigned.length > 0 && !selectedBooking) {
            handleSelectBooking(unassigned[0]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchSuggestions = (booking) => {
    if (!booking) return;
    setLoadingSuggestions(true);
    fetch(`/api/bookings/${booking.id}/suggested-partners`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setSuggestions(res.data);
        }
        setLoadingSuggestions(false);
      })
      .catch(() => setLoadingSuggestions(false));
  };

  useEffect(() => {
    fetchUnassigned();
  }, []);

  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking);
    fetchSuggestions(booking);
  };

  const handleForceAssign = (partnerId) => {
    if (!selectedBooking) return;

    fetch(`/api/bookings/${selectedBooking.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId,
        reasonCode,
        actor: 'DISPATCH_LEAD'
      })
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          showToast(`Booking ${selectedBooking.bookingNumber} force-assigned successfully!`, 'success');
          setSelectedBooking(null);
          setSuggestions([]);
          fetchUnassigned();
        } else {
          showToast(`Dispatch failed: ${res.error}`, 'error');
        }
      })
      .catch((err) => {
        showToast(`Dispatch error: ${err.message}`, 'error');
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual Dispatch Console</h1>
          <p className="text-sm text-gray-500">
            Weighted algorithmic partner matching with distance (&lt;15km), skill tag, and availability safeguards
          </p>
        </div>
        <button
          onClick={fetchUnassigned}
          className="inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Unassigned Job Queue */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm h-[750px] flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-slate-50 rounded-t-xl flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Unassigned Jobs Queue ({unassignedBookings.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Loading unassigned queue...</div>
            ) : unassignedBookings.length === 0 ? (
              <div className="p-6 text-center text-gray-400">All bookings have been dispatched!</div>
            ) : (
              unassignedBookings.map((b) => {
                const isSel = selectedBooking?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => handleSelectBooking(b)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 flex items-center justify-between ${
                      isSel ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-emerald-700">{b.bookingNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {b.category}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 mt-1">{b.serviceName}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{b.cityName} • {b.customerName}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-gray-800 block">₹{b.totalAmount}</span>
                      <span className="text-[10px] font-medium text-emerald-600 mt-1 block">Ready for dispatch</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dispatch Matching Console & Partner Ranking */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-[750px] flex flex-col justify-between">
          {selectedBooking ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="border-b pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Selected Job: {selectedBooking.bookingNumber}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Category: <strong className="text-slate-800">{selectedBooking.category}</strong> • City:{' '}
                      <strong className="text-slate-800">{selectedBooking.cityName}</strong>
                    </p>
                  </div>
                  <span className="text-sm font-black text-emerald-700 font-mono">
                    ₹{selectedBooking.totalAmount}
                  </span>
                </div>

                {/* Algorithmic Suggestions Header */}
                <div className="mt-4 flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center space-x-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Algorithmic Partner Match Ranking</span>
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Weights: Skill (40) | Distance (25) | Availability (15) | Rating (10) | Fairness (10)
                  </span>
                </div>

                {/* Candidate Suggestions List */}
                <div className="mt-3 space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {loadingSuggestions ? (
                    <div className="p-8 text-center text-gray-400">Computing algorithm scores...</div>
                  ) : suggestions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No active partners found for this city</div>
                  ) : (
                    suggestions.map((item, idx) => {
                      const { partner, eligible, score, distanceKm, reason, breakdown } = item;

                      return (
                        <div
                          key={partner.id}
                          className={`p-4 rounded-xl border transition-all ${
                            eligible
                              ? 'bg-white border-gray-200 hover:border-emerald-300 shadow-xs'
                              : 'bg-rose-50/40 border-rose-200 opacity-80'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-gray-900">
                                  #{idx + 1} {partner.name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                    partner.tier === 'GOLD'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-200 text-slate-800'
                                  }`}
                                >
                                  {partner.tier}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Distance: <strong className="text-gray-700">{distanceKm} km</strong> • Rating:{' '}
                                <strong className="text-gray-700">{partner.avgRating} ★</strong>
                              </p>
                              <p className="text-[11px] text-gray-400">
                                Skills: [{partner.skills?.join(', ')}]
                              </p>
                            </div>

                            <div className="text-right">
                              {eligible ? (
                                <div>
                                  <span className="text-xs text-gray-400 uppercase font-bold block">Score</span>
                                  <span className="text-lg font-black text-emerald-600 font-mono">{score}</span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  INELIGIBLE
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Reasoning or Score Breakdown */}
                          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-xs text-gray-600 italic truncate max-w-sm">{reason}</p>

                            {eligible ? (
                              <button
                                onClick={() => handleForceAssign(partner.id)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-xs"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Assign Partner</span>
                              </button>
                            ) : (
                              <button
                                disabled
                                className="px-3 py-1.5 bg-gray-200 text-gray-400 rounded-lg text-xs font-bold cursor-not-allowed"
                              >
                                Blocked by Safeguard
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Console Footer */}
              <div className="pt-3 border-t text-xs text-gray-400 flex items-center justify-between">
                <span>Dispatch actor: DISPATCH_LEAD</span>
                <span>Safeguard checks: 15km Radius + Skill Match + Availability</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select an unassigned booking from the left queue to compute candidate dispatch scores
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
