import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.48.1/+esm';

// Set real Vite public project values before deploying. Never put the service-role
// key in browser code. Missing placeholders must not silently masquerade as live.
const SUPABASE_URL = String(import.meta.env?.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = String(import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();
const hasValidUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL);
const hasValidKey = Boolean(SUPABASE_ANON_KEY) &&
  !/^(public-anon-key|your-|placeholder|changeme)/i.test(SUPABASE_ANON_KEY);
export const isSupabaseConfigured = hasValidUrl && hasValidKey;
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const setupError = 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the hosting environment, then rebuild/redeploy.';

export async function loginWithGoogle() {
  if (!supabase) return { success: false, error: setupError };
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return { success: true, redirecting: true };
  } catch (error) {
    console.error('Supabase Auth Google error:', error);
    return { success: false, error: error.message || 'Google Sign-In failed' };
  }
}

export async function sendPhoneOtp(phoneNumber) {
  if (!supabase) return { success: false, error: setupError };
  try {
    const raw = String(phoneNumber || '').replace(/[^\d+]/g, '');
    const formattedPhone = /^\d{10}$/.test(raw) ? '+91' + raw : raw.startsWith('+') ? raw : '+91' + raw;
    if (!/^\+\d{8,15}$/.test(formattedPhone)) {
      return { success: false, error: 'Enter a valid mobile number including country code.' };
    }
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    if (error) throw error;
    return { success: true, formattedPhone };
  } catch (error) {
    console.error('Supabase Auth sendPhoneOtp error:', error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
}

export async function verifyPhoneOtp(phoneNumber, otpCode) {
  if (!supabase) return { success: false, error: setupError };
  try {
    const raw = String(phoneNumber || '').replace(/[^\d+]/g, '');
    const formattedPhone = raw.startsWith('+') ? raw : '+91' + raw;
    const cleanCode = String(otpCode || '').trim();
    if (!/^\+\d{8,15}$/.test(formattedPhone) || !/^\d{6}$/.test(cleanCode)) {
      return { success: false, error: 'Enter a valid phone number and 6-digit OTP.' };
    }
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone, token: cleanCode, type: 'sms'
    });
    if (error) throw error;
    const user = data.user;
    return { success: true, user: {
      uid: user.id,
      name: user.user_metadata?.full_name || 'Bharat Pro Customer',
      phone: user.phone ? user.phone.replace(/^\+91/, '') : phoneNumber,
      loginType: 'phone'
    }};
  } catch (error) {
    console.error('Supabase Auth verifyPhoneOtp error:', error);
    return { success: false, error: error.message || 'OTP verification failed' };
  }
}

export async function supabaseLogout() {
  if (!supabase) return { success: false, error: setupError };
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Supabase Auth logout error:', error);
    return { success: false, error: error.message };
  }
}

export function subscribeAuthState(callback) {
  if (!supabase) {
    callback(null, null);
    return () => {};
  }
  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const user = session.user;
      callback(null, {
        uid: user.id,
        name: user.user_metadata?.full_name || 'Bharat Pro Customer',
        email: user.email || '',
        phone: user.phone ? user.phone.replace(/^\+91/, '') : '',
        avatar: user.user_metadata?.avatar_url || '👤',
        loginType: user.app_metadata?.provider || 'phone'
      });
    } else callback(null, null);
  });
  return () => authListener?.subscription?.unsubscribe();
}

export async function saveBookingToSupabase(bookingData) {
  if (!supabase) return { success: false, error: setupError };
  try {
    const { data, error } = await supabase.from('bookings').insert([bookingData]).select();
    if (error) throw error;
    return { success: true, id: data?.[0]?.id || bookingData.id };
  } catch (error) {
    console.error('Supabase DB save booking error:', error);
    return { success: false, error: error.message || 'Failed to save booking to Supabase' };
  }
}
