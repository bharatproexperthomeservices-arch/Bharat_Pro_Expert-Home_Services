import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.48.1/+esm';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://xyz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function loginWithGoogle() {
  console.log("Supabase Auth: Initiating Google OAuth Sign-In...");
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return { success: true, redirecting: true };
  } catch (error) {
    console.error("Supabase Auth Google error:", error);
    return { success: false, error: error.message || 'Google Sign-In failed' };
  }
}

export async function sendPhoneOtp(phoneNumber) {
  console.log("Supabase Auth: Sending Phone OTP to:", phoneNumber);
  try {
    const raw = String(phoneNumber || '').replace(/[^\d+]/g, '');
    let formattedPhone = raw;
    if (/^\d{10}$/.test(raw)) {
      formattedPhone = `+91${raw}`;
    } else if (!raw.startsWith('+')) {
      formattedPhone = `+91${raw}`;
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone
    });
    if (error) throw error;
    console.log("Supabase Auth: OTP sent successfully");
    return { success: true, formattedPhone };
  } catch (error) {
    console.error("Supabase Auth sendPhoneOtp error:", error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
}

export async function verifyPhoneOtp(phoneNumber, otpCode) {
  console.log("Supabase Auth: Verifying Phone OTP code...");
  try {
    const raw = String(phoneNumber || '').replace(/[^\d+]/g, '');
    let formattedPhone = raw.startsWith('+') ? raw : `+91${raw}`;
    const cleanCode = String(otpCode || '').trim();

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: cleanCode,
      type: 'sms'
    });
    if (error) throw error;

    const user = data.user;
    return {
      success: true,
      user: {
        uid: user.id,
        name: user.user_metadata?.full_name || 'Bharat Pro Customer',
        phone: user.phone ? user.phone.replace('+91', '') : phoneNumber,
        loginType: 'phone'
      }
    };
  } catch (error) {
    console.error("Supabase Auth verifyPhoneOtp error:", error);
    return { success: false, error: error.message || 'OTP verification failed' };
  }
}

export async function supabaseLogout() {
  console.log("Supabase Auth: Logging out...");
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Supabase Auth logout error:", error);
    return { success: false, error: error.message };
  }
}

export function subscribeAuthState(callback) {
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    console.log("Supabase Auth event:", event);
    if (session?.user) {
      const user = session.user;
      const userObj = {
        uid: user.id,
        name: user.user_metadata?.full_name || 'Bharat Pro Customer',
        email: user.email || '',
        phone: user.phone ? user.phone.replace('+91', '') : '',
        avatar: user.user_metadata?.avatar_url || '👤',
        loginType: user.app_metadata?.provider || 'phone'
      };
      callback(null, userObj);
    } else {
      callback(null, null);
    }
  });

  return () => {
    if (authListener?.subscription) {
      authListener.subscription.unsubscribe();
    }
  };
}

export async function saveBookingToSupabase(bookingData) {
  try {
    console.log("Supabase DB: Saving booking...", bookingData);
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select();

    if (error) throw error;
    console.log("Supabase DB: Booking saved successfully:", data);
    return { success: true, id: data[0]?.id || bookingData.id };
  } catch (error) {
    console.error("Supabase DB save booking error:", error);
    return { success: false, error: error.message || 'Failed to save booking to Supabase' };
  }
}
