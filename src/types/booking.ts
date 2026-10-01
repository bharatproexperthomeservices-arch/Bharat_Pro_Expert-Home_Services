/* ============================================================
   BHARAT PRO EXPERTS — BOOKING TYPES
   Customer Bookings — State-wise, Urban Company Style
   ============================================================ */

export type BookingStatus =
  | 'NEW'
  | 'DISPATCHING'
  | 'ASSIGNED'
  | 'PARTNER_EN_ROUTE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REASSIGNMENT_REQUIRED'
  | 'REASSIGNED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'COD'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentMethod = 'ONLINE' | 'COD' | 'UPI' | 'CARD';

export type BookingPriority = 'NORMAL' | 'URGENT' | 'SCHEDULED';

export interface StateSummary {
  state_code: string;
  state_name: string;
  cities: number;
  hubs: number;
  active_partners: number;
  bookings_today: number;
  bookings_week: number;
  bookings_month: number;
  revenue_month_paise: number;
  completion_rate: number;
  avg_rating: number | null;
  rating_sample: number;
}

export interface CitySummary {
  city_id: string;
  city_name: string;
  state_code: string;
  hubs: number;
  active_partners: number;
  bookings_today: number;
  bookings_week: number;
  bookings_month: number;
  revenue_month_paise: number;
  completion_rate: number;
}

export interface SectorArea {
  id: string;
  name: string;
  pincodes: string[];
  hub_id?: string;
  hub_name?: string;
}

export interface BookingRow {
  id: string;
  booking_code: string;
  customer_id: string;
  customer_name: string;
  customer_mobile_masked: string;
  state_code: string;
  state_name: string;
  city_id: string;
  city_name: string;
  sector_id?: string;
  sector_name?: string;
  hub_id?: string;
  hub_name?: string;
  address_line: string;
  pincode: string;
  service_category_id: string;
  service_category_name: string;
  service_id: string;
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
  updated_at: string;
}

export interface CreateBookingPayload {
  customer_name: string;
  customer_mobile: string;
  state_code: string;
  city_id: string;
  sector_id?: string;
  address_line: string;
  pincode: string;
  service_category_id: string;
  service_id: string;
  scheduled_at: string;
  priority: BookingPriority;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface BookingKpis {
  total_today: number;
  total_week: number;
  total_month: number;
  active_now: number;
  completed_today: number;
  cancelled_today: number;
  revenue_month_paise: number;
  avg_order_value_paise: number;
  as_of: string;
}