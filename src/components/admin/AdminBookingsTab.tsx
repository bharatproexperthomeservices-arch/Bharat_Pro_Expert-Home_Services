import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Booking, Partner } from '../../types';

type BookingStatus =
  | 'NEW' | 'DISPATCHING' | 'ASSIGNED' | 'PARTNER_EN_ROUTE' | 'IN_PROGRESS'
  | 'COMPLETED' | 'CANCELLED' | 'REASSIGNMENT_REQUIRED' | 'REASSIGNED'
  | 'REFUND_PENDING' | 'REFUNDED';

type PaymentStatus = 'PENDING' | 'PAID' | 'COD' | 'FAILED' | 'REFUNDED';
type PaymentMethod = 'ONLINE' | 'COD' | 'UPI' | 'CARD';
type BookingPriority = 'NORMAL' | 'URGENT' | 'SCHEDULED';

interface BookingRow {
  id: string;
  booking_code: string;
  customer_id: string;
  customer_name: string;
  customer_mobile_masked: string;
  state_code: string;
  state_name: string;
  city_id: string;
  city_name: string;
  sector_name?: string;
  hub_name?: string;
  address_line: string;
  pincode: string;
  service_category_name: string;
  service_name: string;
  scheduled_at: string;
  duration_min: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  partner_id?: string;
  partner_name?: string;
  partner_code?: string;
  amount_paise: number;
  discount_paise: number;
  net_amount_paise: number;
  priority: BookingPriority;
  notes?: string;
  created_at: string;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  NEW: 'New', DISPATCHING: 'Dispatching', ASSIGNED: 'Assigned',
  PARTNER_EN_ROUTE: 'En Route', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
  REASSIGNMENT_REQUIRED: 'Reassign Required', REASSIGNED: 'Reassigned',
  REFUND_PENDING: 'Refund Pending', REFUNDED: 'Refunded',
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending', PAID: 'Paid', COD: 'COD', FAILED: 'Failed', REFUNDED: 'Refunded',
};

function formatPaise(p?: number | null): string {
  if (p == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p / 100);
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusTone(s: BookingStatus): CSSProperties {
  switch (s) {
    case 'NEW': return styles.statusNew;
    case 'DISPATCHING': return styles.statusDispatching;
    case 'ASSIGNED': return styles.statusAssigned;
    case 'PARTNER_EN_ROUTE': return styles.statusEnRoute;
    case 'IN_PROGRESS': return styles.statusInProgress;
    case 'COMPLETED': return styles.statusCompleted;
    case 'CANCELLED': return styles.statusCancelled;
    case 'REASSIGNMENT_REQUIRED': return styles.statusReassign;
    case 'REASSIGNED': return styles.statusReassigned;
    case 'REFUND_PENDING': return styles.statusRefundPending;
    case 'REFUNDED': return styles.statusRefunded;
    default: return styles.statusNew;
  }
}

function paymentTone(s: PaymentStatus): CSSProperties {
  switch (s) {
    case 'PAID': return styles.payPaid;
    case 'PENDING': return styles.payPending;
    case 'COD': return styles.payCod;
    case 'FAILED': return styles.payFailed;
    case 'REFUNDED': return styles.payRefunded;
    default: return styles.payPending;
  }
}

export interface AdminBookingsTabProps {
  bookings?: Booking[];
  partners?: Partner[];
  onRefresh?: () => void;
  onManualAssign?: (bookingId: string, partnerId: string) => void;
  apiBase?: string;
  authToken?: string | null;
  onCustomerSelect?: (customerId: string) => void;
  onPartnerSelect?: (partnerId: string) => void;
}

function mapBookingToRow(b: Booking): BookingRow {
  const stateName = b.address?.state || 'Haryana';
  const stateCode = stateName.toLowerCase().includes('bihar') ? 'BR'
    : stateName.toLowerCase().includes('jharkhand') ? 'JH'
    : stateName.toLowerCase().includes('delhi') ? 'DL'
    : stateName.toLowerCase().includes('uttar') ? 'UP'
    : 'HR';

  let status: BookingStatus = 'NEW';
  const rawStatus = String(b.status || '');
  if (rawStatus.includes('ASSIGNED')) status = 'ASSIGNED';
  else if (rawStatus.includes('WAY') || rawStatus.includes('ARRIVED')) status = 'PARTNER_EN_ROUTE';
  else if (rawStatus.includes('PROGRESS') || rawStatus === 'STARTED') status = 'IN_PROGRESS';
  else if (rawStatus.includes('COMPLETE') || rawStatus.includes('SETTLE')) status = 'COMPLETED';
  else if (rawStatus.includes('CANCEL')) status = 'CANCELLED';
  else if (rawStatus.includes('REASSIGN')) status = 'REASSIGNED';
  else if (rawStatus.includes('REFUND')) status = 'REFUNDED';
  else status = 'NEW';

  let payment_status: PaymentStatus = 'PENDING';
  if (b.paymentStatus === 'PAID') payment_status = 'PAID';
  else if (b.paymentStatus === 'REFUNDED') payment_status = 'REFUNDED';
  else if (b.paymentMethod === 'PAY_AFTER_SERVICE' || b.paymentMethod === 'Pay after service') payment_status = 'COD';

  let payment_method: PaymentMethod = 'ONLINE';
  if (b.paymentMethod === 'PAY_AFTER_SERVICE' || b.paymentMethod === 'Pay after service') payment_method = 'COD';
  else if (b.paymentMethod === 'UPI') payment_method = 'UPI';
  else if (b.paymentMethod === 'CARD') payment_method = 'CARD';

  const amount = b.totalAmount || b.basePrice || 0;
  const discount = b.discount || 0;

  const phone = b.customerPhone || '';
  const maskedPhone = phone.length >= 10 ? phone.slice(0, 3) + '••••' + phone.slice(-3) : phone;

  return {
    id: b.id,
    booking_code: b.bookingNumber || b.id.toUpperCase(),
    customer_id: b.customerId || 'cust-anon',
    customer_name: b.customerName || 'Customer',
    customer_mobile_masked: maskedPhone,
    state_code: stateCode,
    state_name: stateName,
    city_id: (b.address?.city || 'gurugram').toLowerCase(),
    city_name: b.address?.city || 'Gurugram',
    sector_name: b.address?.sector || b.address?.street,
    hub_name: b.assignedHubName,
    address_line: [b.address?.street, b.address?.sector, b.address?.landmark].filter(Boolean).join(', ') || 'Address not provided',
    pincode: b.address?.pincode || '122001',
    service_category_name: b.categoryName || 'Home Deep Cleaning',
    service_name: b.serviceName || 'Deep Cleaning Service',
    scheduled_at: b.date ? `${b.date}T${b.timeSlot?.split('-')[0]?.trim() || '10:00:00'}` : new Date().toISOString(),
    duration_min: 180,
    status,
    payment_status,
    payment_method,
    partner_id: b.assignedPartnerId,
    partner_name: b.assignedPartnerName,
    partner_code: b.assignedPartnerId,
    amount_paise: amount * 100,
    discount_paise: discount * 100,
    net_amount_paise: amount * 100,
    priority: 'NORMAL',
    notes: b.notes ? `${b.notes}${b.startOtp ? ` | Start OTP: ${b.startOtp}` : ''}${b.completionOtp ? ` | End OTP: ${b.completionOtp}` : ''}` : (b.startOtp ? `Start OTP: ${b.startOtp} | End OTP: ${b.completionOtp}` : undefined),
    created_at: b.createdAt || new Date().toISOString()
  };
}

export function AdminBookingsTab({
  bookings: propBookings,
  partners = [],
  onRefresh,
  onManualAssign,
  onCustomerSelect,
  onPartnerSelect,
}: AdminBookingsTabProps) {
  const [internalBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const bookings: BookingRow[] = useMemo(() => {
    if (propBookings !== undefined) {
      return propBookings.map(mapBookingToRow);
    }
    return internalBookings;
  }, [propBookings, internalBookings]);

  const notConfigured = propBookings === undefined && internalBookings.length === 0
    ? 'Bookings API not configured yet. Connect the backend to see real bookings.'
    : null;

  const [view, setView] = useState<'all' | 'by-state'>('all');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);

  const load = useCallback(async () => {
    if (onRefresh) {
      onRefresh();
      return;
    }
    setLoading(true);
    try {
      // API not configured — no fake data
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  useEffect(() => { load(); }, [load]);

  const stateOptions = useMemo(() => {
    const map = new Map<string, string>();
    bookings.forEach((b) => { if (b.state_code && b.state_name) map.set(b.state_code, b.state_name); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [bookings]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => { if (b.city_name) set.add(b.city_name); });
    return Array.from(set).sort();
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (stateFilter !== 'ALL') list = list.filter((b) => b.state_code.toUpperCase() === stateFilter.toUpperCase());
    if (cityFilter !== 'ALL') list = list.filter((b) => b.city_name.toLowerCase() === cityFilter.toLowerCase());
    if (statusFilter !== 'ALL') list = list.filter((b) => b.status === statusFilter);
    if (paymentFilter !== 'ALL') list = list.filter((b) => b.payment_status === paymentFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.booking_code.toLowerCase().includes(q) ||
          b.customer_name.toLowerCase().includes(q) ||
          b.customer_mobile_masked.includes(q) ||
          b.city_name.toLowerCase().includes(q) ||
          b.service_name.toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const t = new Date(dateFrom).getTime();
      list = list.filter((b) => new Date(b.created_at).getTime() >= t);
    }
    if (dateTo) {
      const t = new Date(dateTo).getTime() + 86400000;
      list = list.filter((b) => new Date(b.created_at).getTime() <= t);
    }
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [bookings, search, stateFilter, cityFilter, statusFilter, paymentFilter, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((b) => ['NEW','DISPATCHING','ASSIGNED','PARTNER_EN_ROUTE','IN_PROGRESS'].includes(b.status)).length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;
    const revenue = bookings.filter((b) => b.status !== 'CANCELLED').reduce((s, b) => s + b.net_amount_paise, 0);
    const aov = total > 0 ? Math.round(revenue / total) : 0;
    return { total, active, completed, cancelled, revenue, aov };
  }, [bookings]);

  const byState = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    filtered.forEach((b) => {
      if (!map.has(b.state_code)) map.set(b.state_code, []);
      map.get(b.state_code)!.push(b);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.title}>Bookings</div>
          <div style={styles.subtitle}>State-wise customer bookings · Urban Company style</div>
        </div>
        <div style={styles.topActions}>
          <button style={view === 'all' ? styles.viewBtnActive : styles.viewBtn} onClick={() => setView('all')}>All Bookings</button>
          <button style={view === 'by-state' ? styles.viewBtnActive : styles.viewBtn} onClick={() => setView('by-state')}>By State</button>
          <button style={styles.refreshBtn} onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>

      {notConfigured && (
        <div style={styles.infoBanner}><strong>Not configured:</strong> {notConfigured}</div>
      )}

      <div style={styles.kpiRow}>
        <KpiCard label="Total Bookings" value={String(summary.total)} sub="all states" tone="info" />
        <KpiCard label="Active Now" value={String(summary.active)} sub="dispatch + in progress" tone="warning" />
        <KpiCard label="Completed" value={String(summary.completed)} sub="delivered" tone="success" />
        <KpiCard label="Cancelled" value={String(summary.cancelled)} sub="with reason" tone="danger" />
        <KpiCard label="Revenue (MTD)" value={formatPaise(summary.revenue)} sub="net after discount" tone="success" />
        <KpiCard label="Avg Order Value" value={formatPaise(summary.aov)} sub="this period" tone="info" />
      </div>

      <div style={styles.filterBar}>
        <input style={styles.searchInput} placeholder="Search booking code, customer, phone, service, partner…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={styles.select} value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="ALL">All States</option>
          {stateOptions.map(([code, name]) => (<option key={code} value={code}>{name}</option>))}
        </select>
        <select style={styles.select} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option value="ALL">All Cities</option>
          {cityOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="NEW">New</option>
          <option value="DISPATCHING">Dispatching</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select style={styles.select} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="ALL">All Payments</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="COD">COD</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <input type="date" style={styles.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" style={styles.dateInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button style={styles.ghostBtn} onClick={() => { setSearch(''); setStateFilter('ALL'); setCityFilter('ALL'); setStatusFilter('ALL'); setPaymentFilter('ALL'); setDateFrom(''); setDateTo(''); }}>Clear</button>
      </div>

      {filtered.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyTitle}>No bookings yet</div>
          <div style={styles.emptySub}>
            {notConfigured ? 'Connect the bookings API to see real data here.' : 'No bookings match the current filters.'}
          </div>
        </div>
      )}

      {view === 'all' && filtered.length > 0 && (
        <>
          <div style={styles.sectionTitle}>All Bookings ({filtered.length})</div>
          <BookingsTable bookings={filtered} onSelect={setSelectedBooking} onCustomerSelect={onCustomerSelect} onPartnerSelect={onPartnerSelect} />
        </>
      )}

      {view === 'by-state' && byState.length > 0 && (
        <>
          <div style={styles.sectionTitle}>Bookings by State ({byState.length} states)</div>
          <div style={styles.stateSections}>
            {byState.map(([stateCode, list]) => {
              const stateName = list[0]?.state_name ?? stateCode;
              const active = list.filter((b) => ['NEW','DISPATCHING','ASSIGNED','PARTNER_EN_ROUTE','IN_PROGRESS'].includes(b.status)).length;
              const completed = list.filter((b) => b.status === 'COMPLETED').length;
              const revenue = list.filter((b) => b.status !== 'CANCELLED').reduce((s, b) => s + b.net_amount_paise, 0);
              return (
                <div key={stateCode} style={styles.stateSection}>
                  <div style={styles.stateHeader}>
                    <div>
                      <div style={styles.stateName}>{stateName} <span style={styles.stateCode}>({stateCode})</span></div>
                      <div style={styles.stateSub}>{list.length} bookings · {active} active · {completed} completed</div>
                    </div>
                    <div style={styles.stateRevenue}>{formatPaise(revenue)}</div>
                  </div>
                  <BookingsTable bookings={list} onSelect={setSelectedBooking} onCustomerSelect={onCustomerSelect} onPartnerSelect={onPartnerSelect} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedBooking && (
        <BookingDetailDrawer
          booking={selectedBooking}
          partners={partners}
          onManualAssign={onManualAssign}
          onClose={() => setSelectedBooking(null)}
          onCustomerSelect={onCustomerSelect}
          onPartnerSelect={onPartnerSelect}
        />
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: 'info' | 'success' | 'danger' | 'warning' }) {
  const map: Record<string, { bg: string; color: string }> = {
    success: { bg: '#f0fdf4', color: '#166534' },
    danger: { bg: '#fef2f2', color: '#991b1b' },
    warning: { bg: '#fffbeb', color: '#92400e' },
    info: { bg: '#eff6ff', color: '#1d4ed8' },
  };
  const theme = map[tone];
  return (
    <div style={{ ...styles.kpiCard, background: theme.bg, borderColor: theme.color + '33' }}>
      <div style={{ ...styles.kpiLabel, color: theme.color }}>{label}</div>
      <div style={{ ...styles.kpiValue, color: theme.color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.color, opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}

function BookingsTable({ bookings, onSelect, onCustomerSelect, onPartnerSelect }: { bookings: BookingRow[]; onSelect: (b: BookingRow) => void; onCustomerSelect?: (id: string) => void; onPartnerSelect?: (id: string) => void; }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <Th>Booking</Th><Th>Customer</Th><Th>Location</Th><Th>Service</Th>
            <Th>Schedule</Th><Th>Partner</Th><Th>Status</Th><Th>Payment</Th><Th>Amount</Th><Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <Td>
                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{b.booking_code}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{formatDate(b.created_at)}</div>
              </Td>
              <Td>
                <button style={styles.linkBtn} onClick={() => onCustomerSelect?.(b.customer_id)} disabled={!onCustomerSelect}>{b.customer_name}</button>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{b.customer_mobile_masked}</div>
              </Td>
              <Td>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{b.city_name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{b.sector_name ?? '—'}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{b.hub_name ?? '—'}</div>
              </Td>
              <Td>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{b.service_name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{b.service_category_name}</div>
              </Td>
              <Td>
                <div style={{ fontSize: 12 }}>{formatDate(b.scheduled_at)}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{b.duration_min} min</div>
              </Td>
              <Td>
                {b.partner_name ? (
                  <>
                    <button style={styles.linkBtn} onClick={() => b.partner_id && onPartnerSelect?.(b.partner_id)} disabled={!onPartnerSelect}>{b.partner_name}</button>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{b.partner_code}</div>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
                )}
              </Td>
              <Td><span style={statusTone(b.status)}>{STATUS_LABELS[b.status]}</span></Td>
              <Td><span style={paymentTone(b.payment_status)}>{PAYMENT_LABELS[b.payment_status]}</span></Td>
              <Td>
                <div style={{ fontWeight: 700 }}>{formatPaise(b.net_amount_paise)}</div>
                {b.discount_paise > 0 && <div style={{ fontSize: 10, color: '#166534' }}>−{formatPaise(b.discount_paise)}</div>}
              </Td>
              <Td><button style={styles.smallBtn} onClick={() => onSelect(b)}>View</button></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingDetailDrawer({ 
  booking, 
  partners = [], 
  onManualAssign,
  onClose, 
  onCustomerSelect, 
  onPartnerSelect 
}: { 
  booking: BookingRow; 
  partners?: Partner[];
  onManualAssign?: (bookingId: string, partnerId: string) => void;
  onClose: () => void; 
  onCustomerSelect?: (id: string) => void; 
  onPartnerSelect?: (id: string) => void; 
}) {
  const [selectedPartnerId, setSelectedPartnerId] = useState(booking.partner_id || '');
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedPartnerId || !onManualAssign) return;
    setAssigning(true);
    try {
      await onManualAssign(booking.id, selectedPartnerId);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div style={styles.drawerOverlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{booking.booking_code}</div>
            <div style={styles.drawerSub}>{booking.customer_name} · {formatDate(booking.created_at)}</div>
          </div>
          <button style={styles.drawerClose} onClick={onClose}>✕</button>
        </div>
        <div style={styles.drawerBody}>
          <div style={styles.detailGrid}>
            <DetailItem label="Status" value={STATUS_LABELS[booking.status]} />
            <DetailItem label="Payment" value={PAYMENT_LABELS[booking.payment_status]} />
            <DetailItem label="Method" value={booking.payment_method} />
            <DetailItem label="Priority" value={booking.priority} />
            <DetailItem label="State" value={booking.state_name} />
            <DetailItem label="City" value={booking.city_name} />
            <DetailItem label="Sector" value={booking.sector_name ?? '—'} />
            <DetailItem label="Hub" value={booking.hub_name ?? '—'} />
            <DetailItem label="Pincode" value={booking.pincode} />
            <DetailItem label="Scheduled" value={formatDate(booking.scheduled_at)} />
            <DetailItem label="Duration" value={`${booking.duration_min} min`} />
            <DetailItem label="Amount" value={formatPaise(booking.amount_paise)} />
            <DetailItem label="Discount" value={formatPaise(booking.discount_paise)} />
            <DetailItem label="Net" value={formatPaise(booking.net_amount_paise)} />
          </div>
          <div style={styles.descriptionBox}>
            <div style={styles.descriptionLabel}>Service</div>
            <div style={{ fontWeight: 700 }}>{booking.service_name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{booking.service_category_name}</div>
          </div>
          <div style={styles.descriptionBox}>
            <div style={styles.descriptionLabel}>Address</div>
            <div>{booking.address_line}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {booking.sector_name ? `${booking.sector_name}, ` : ''}{booking.city_name}, {booking.state_name} — {booking.pincode}
            </div>
          </div>

          {/* Partner Assignment & Management */}
          <div style={styles.descriptionBox}>
            <div style={styles.descriptionLabel}>Assigned Professional</div>
            {booking.partner_name ? (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>{booking.partner_name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{booking.partner_code}</div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8, fontStyle: 'italic' }}>
                Abhi koi professional assign nahi hai (Unassigned)
              </div>
            )}

            {onManualAssign && partners.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  style={{ ...styles.select, flex: 1, minWidth: 200, padding: '6px 10px' }}
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                >
                  <option value="">-- Professional Chunein --</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone}) {p.city ? `· ${p.city}` : ''} {p.onboardingStatus === 'approved' ? '✓' : '(Pending)'}
                    </option>
                  ))}
                </select>
                <button
                  style={{ ...styles.smallBtn, padding: '7px 14px' }}
                  disabled={!selectedPartnerId || assigning}
                  onClick={handleAssign}
                >
                  {assigning ? 'Assigning...' : 'Assign / Reassign'}
                </button>
              </div>
            )}
          </div>

          {booking.notes && (
            <div style={styles.descriptionBox}>
              <div style={styles.descriptionLabel}>Notes / OTP Details</div>
              <div style={{ fontWeight: 600 }}>{booking.notes}</div>
            </div>
          )}
          <div style={styles.linkRow}>
            <button style={styles.linkBtn} onClick={() => onCustomerSelect?.(booking.customer_id)} disabled={!onCustomerSelect}>Open Customer 360° →</button>
            {booking.partner_id && (<button style={styles.linkBtn} onClick={() => onPartnerSelect?.(booking.partner_id!)} disabled={!onPartnerSelect}>Open Partner 360° →</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (<div style={styles.detailItem}><div style={styles.detailItemLabel}>{label}</div><div style={styles.detailItemValue}>{value}</div></div>);
}

function Th({ children }: { children: ReactNode }) { return <th style={styles.th}>{children}</th>; }
function Td({ children }: { children: ReactNode }) { return <td style={styles.td}>{children}</td>; }

const styles: Record<string, CSSProperties> = {
  root: { padding: 4 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  title: { fontSize: 20, fontWeight: 800, color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  topActions: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  viewBtn: { padding: '8px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 },
  viewBtnActive: { padding: '8px 14px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#1d4ed8', fontWeight: 700 },
  refreshBtn: { padding: '9px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  infoBanner: { padding: '10px 14px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 6, marginBottom: 12, fontSize: 12 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 16 },
  kpiCard: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 },
  kpiLabel: { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 },
  kpiValue: { fontSize: 20, fontWeight: 800, marginTop: 4, marginBottom: 2, wordBreak: 'break-word' },
  filterBar: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 220, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none' },
  select: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff' },
  dateInput: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff' },
  ghostBtn: { padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  emptyState: { padding: 60, textAlign: 'center', border: '1px dashed #d1d5db', borderRadius: 12, background: '#fff', marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#6b7280', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 },
  sectionTitle: { fontSize: 13, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 12, marginBottom: 10 },
  stateSections: { display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 16 },
  stateSection: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 },
  stateHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  stateName: { fontSize: 16, fontWeight: 800, color: '#111827' },
  stateCode: { fontSize: 11, color: '#6b7280', fontWeight: 700 },
  stateSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  stateRevenue: { fontSize: 16, fontWeight: 800, color: '#166534' },
  tableWrap: { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: '#6b7280', whiteSpace: 'nowrap' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' },
  statusNew: { display: 'inline-block', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusDispatching: { display: 'inline-block', padding: '2px 8px', background: '#ede9fe', color: '#5b21b6', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusAssigned: { display: 'inline-block', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusEnRoute: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusInProgress: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusCompleted: { display: 'inline-block', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusCancelled: { display: 'inline-block', padding: '2px 8px', background: '#e5e7eb', color: '#374151', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusReassign: { display: 'inline-block', padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusReassigned: { display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', color: '#374151', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusRefundPending: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  statusRefunded: { display: 'inline-block', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  payPaid: { display: 'inline-block', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  payPending: { display: 'inline-block', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  payCod: { display: 'inline-block', padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  payFailed: { display: 'inline-block', padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  payRefunded: { display: 'inline-block', padding: '2px 8px', background: '#e5e7eb', color: '#374151', borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' },
  smallBtn: { padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  linkBtn: { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: 0, textAlign: 'left' },
  drawerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' },
  drawer: { width: 'min(760px, 100%)', height: '100%', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  drawerHeader: { padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  drawerTitle: { fontSize: 16, fontWeight: 700, color: '#111827' },
  drawerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  drawerClose: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', padding: 4, lineHeight: 1 },
  drawerBody: { padding: 20, overflowY: 'auto', flex: 1 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 16 },
  detailItem: { padding: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 },
  detailItemLabel: { fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  detailItemValue: { fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 4, wordBreak: 'break-word' },
  descriptionBox: { padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, fontSize: 13, lineHeight: 1.6 },
  descriptionLabel: { fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  linkRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 },
};

export default AdminBookingsTab;