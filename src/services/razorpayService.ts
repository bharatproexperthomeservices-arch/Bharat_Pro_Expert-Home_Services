/**
 * Razorpay Payment Gateway Service
 */

import { updateBookingStatus } from './dbService';

// Razorpay Public Key (Frontend के लिए)
export const RAZORPAY_LIVE_KEY_ID = 'rzp_live_Tlh9T3hoID4gmq';

// SECRET KEY yahan kabhi mat likho. Server me Vercel Environment Variable RAZORPAY_KEY_SECRET use karo.
export const RAZORPAY_LIVE_KEY_SECRET = '';

const getEnvKey = (): string => {
  const envKey = 
    (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 
    (import.meta as any).env?.RAZORPAY_KEY_ID || 
    RAZORPAY_LIVE_KEY_ID;
  return typeof envKey === 'string' && envKey.trim().length > 0 ? envKey.trim() : RAZORPAY_LIVE_KEY_ID;
};

export const getRazorpayKeyId = (): string => {
  return getEnvKey();
};

export const isRazorpayKeyConfigured = (): boolean => {
  const key = getRazorpayKeyId();
  return Boolean(key && (key.startsWith('rzp_test_') || key.startsWith('rzp_live_')));
};

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[RazorpayService] Failed to load Razorpay checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export interface HandlePaymentOptions {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceName?: string;
  onSuccess?: (paymentResponse: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }) => void;
  onError?: (error: any) => void;
  onDismiss?: () => void;
}

export const handlePayment = async (
  bookingId: string,
  amount: number,
  options?: HandlePaymentOptions
): Promise<void> => {
  const keyId = getRazorpayKeyId();

  if (!keyId) {
    const errorMsg = 'Razorpay Key ID is not configured.';
    if (options?.onError) options.onError(new Error(errorMsg));
    else alert(errorMsg);
    return;
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !(window as any).Razorpay) {
    const errorMsg = 'Could not load Razorpay SDK. Please check your internet connection.';
    if (options?.onError) options.onError(new Error(errorMsg));
    else alert(errorMsg);
    return;
  }

  // 🚨 1. Backend से Order ID मंगाएं (यहाँ से Backend कॉल होगा)
  let orderId = '';
  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount }) 
    });
    
    const orderData = await response.json();
    
    if (!orderData || !orderData.id) {
      throw new Error("Backend did not return Razorpay order ID. Contact support.");
    }
    orderId = orderData.id;
    
  } catch (err: any) {
    console.error("Order creation failed:", err);
    if (options?.onError) options.onError(err);
    else alert("Payment could not be initiated. Please try again.");
    return;
  }

  // 🚨 2. अब razorpayOptions बनाएं
  const razorpayOptions = {
    key: keyId,
    amount: Math.round(amount * 100), 
    currency: 'INR',
    name: 'Bharat Pro Expert',
    description: options?.serviceName ? `Payment for ${options.serviceName}` : `Booking #${bookingId}`,
    image: 'https://img.icons8.com/color/120/clean.png',
    order_id: orderId, // 🚨 यह लाइन जोड़ना बहुत जरूरी है
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
    }) => {
      console.log(`[RazorpayService] Payment successful: ${response.razorpay_payment_id}`);
      try {
        const result = await updateBookingStatus(bookingId, 'PAID', {
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature
        });
        if (result.success) {
          console.log(`[RazorpayService] Booking ${bookingId} status updated to 'PAID'.`);
        }
        if (options?.onSuccess) options.onSuccess(response);
      } catch (err) {
        console.error('[RazorpayService] Failed to update booking status:', err);
        if (options?.onError) options.onError(err);
      }
    },
    prefill: {
      name: options?.customerName || '',
      email: options?.customerEmail || 'customer@bharatproexpert.com',
      contact: options?.customerPhone || ''
    },
    notes: { bookingId, app: 'Bharat Pro Expert' },
    theme: { color: '#062A49' },
    modal: {
      ondismiss: () => {
        if (options?.onDismiss) options.onDismiss();
      }
    }
  };

  try {
    const rzp = new (window as any).Razorpay(razorpayOptions);

    rzp.on('payment.failed', (resp: any) => {
      console.error('[RazorpayService] Payment failed event:', resp.error);
      if (options?.onError) options.onError(resp.error);
    });

    rzp.open();
  } catch (err: any) {
    console.error('[RazorpayService] Failed to initialize Razorpay checkout:', err);
    if (options?.onError) options.onError(err);
  }
};

export interface RazorpayCheckoutOptions {
  amount: number;
  bookingNumber: string;
  serviceName: string;
  homeSize?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }) => void | Promise<void>;
  onDismiss?: () => void;
  onError?: (error: any) => void;
}

export const openRazorpayPaymentModal = async (options: RazorpayCheckoutOptions): Promise<void> => {
  return handlePayment(options.bookingNumber, options.amount, {
    customerName: options.customerName,
    customerEmail: options.customerEmail,
    customerPhone: options.customerPhone,
    serviceName: `${options.serviceName} ${options.homeSize ? `(${options.homeSize})` : ''}`,
    onSuccess: options.onSuccess,
    onDismiss: options.onDismiss,
    onError: options.onError
  });
};
