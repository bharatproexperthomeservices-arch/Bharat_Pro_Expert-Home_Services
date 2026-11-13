import { supabase, isSupabaseConfigured } from './supabase-config.js';

const setupError = 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) throw new Error(setupError);
  return supabase;
}

export async function checkPartnerAvailability(city, serviceId) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('check_partner_availability', {
    p_city: String(city || '').trim(),
    p_service_id: String(serviceId || '').trim()
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    activePartnerCount: Number(row?.active_partner_count || 0),
    availablePartnerCount: Number(row?.available_partner_count || 0),
    available: Number(row?.available_partner_count || 0) > 0
  };
}

// Server-side endpoint must validate customer identity/rate limits before inserting.
export async function createNotifyRequest(request) {
  const client = requireSupabase();
  const payload = {
    customer_name: String(request.customerName || '').trim(),
    phone: String(request.phone || '').replace(/\D/g, ''),
    city: String(request.city || '').trim(),
    pincode: String(request.pincode || '').replace(/\D/g, ''),
    service_id: String(request.serviceId || '').trim()
  };
  if (!payload.customer_name || !/^[6-9]\d{9}$/.test(payload.phone) ||
      !payload.city || !/^\d{6}$/.test(payload.pincode) || !payload.service_id) {
    throw new Error('Please provide a valid name, Indian mobile number, city, PIN code and service.');
  }
  // Intentionally routed through a server endpoint in production; browser inserts are blocked by RLS.
  const response = await fetch('/api/notify-request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Could not save your notification request.');
  return result;
}

// Dispatch must only be called by a trusted server after Razorpay signature verification.
export async function dispatchPaidBooking(booking) {
  const response = await fetch('/api/dispatch-paid-booking', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      bookingId: String(booking.id),
      city: String(booking.city || ''),
      serviceId: String(booking.serviceId || ''),
      customerAddress: String(booking.customerAddress || '')
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Partner dispatch failed.');
  return result;
}
