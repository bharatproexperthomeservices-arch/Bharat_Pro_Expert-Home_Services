/**
 * Razorpay Payment Gateway Service
 * 
 * Exports handlePayment for initiating Razorpay Checkout and updating Firestore booking status.
 * Reads API Key strictly from environment variables/secrets.
 */

import { updateBookingStatus } from './dbService';

// Active Live Razorpay API Credentials
export const RAZORPAY_LIVE_KEY_ID = 'rzp_live_TgBbAEno4YT7iC';
export const RAZORPAY_LIVE_KEY_SECRET = 'wof3iFxoRuHpl3J6Q8XFrNpe';

// Dynamically read environment variables or fall back to active live credentials
const getEnvKey = (): string => {
  const envKey = 
    (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 
    (import.meta as any).env?.RAZORPAY_KEY_ID || 
    RAZORPAY_LIVE_KEY_ID;
  return typeof envKey === 'string' && envKey.trim().length > 0 ? envKey.trim() : RAZORPAY_LIVE_KEY_ID;
};

/**
 * Returns the currently active Razorpay Key ID
 */
export const getRazorpayKeyId = (): string => {
  return getEnvKey();
};

/**
 * Checks if a valid Razorpay Key ID has been supplied in AI Studio Secrets
 */
export const isRazorpayKeyConfigured = (): boolean => {
  const key = getRazorpayKeyId();
  return Boolean(key && (key.startsWith('rzp_test_') || key.startsWith('rzp_live_')));
};

/**
 * Checks if the currently configured key is in TEST mode
 */
export const isTestMode = (): boolean => {
  const key = getRazorpayKeyId();
  return key.startsWith('rzp_test_');
};

/**
 * Ensures Razorpay Checkout script is loaded dynamically in the browser
 */
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
      console.error('[RazorpayService] Failed to load Razorpay checkout script from checkout.razorpay.com');
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

/**
 * Initiates Razorpay checkout for a given bookingId and amount,
 * and updates the booking status in Firestore to 'PAID' via updateBookingStatus on success.
 *
 * @param bookingId - The ID of the booking to pay for
 * @param amount - Total amount in INR rupees (will be converted to paise)
 * @param options - Optional extra params like customer details & callbacks
 */
export const handlePayment = async (
  bookingId: string,
  amount: number,
  options?: HandlePaymentOptions
): Promise<void> => {
  const keyId = getRazorpayKeyId();

  if (!keyId) {
    const errorMsg = 'Razorpay Key ID is not configured. Please set RAZORPAY_KEY_ID or VITE_RAZORPAY_KEY_ID in AI Studio Secrets.';
    console.error(`[RazorpayService] ${errorMsg}`);
    if (options?.onError) {
      options.onError(new Error(errorMsg));
    } else {
      alert(errorMsg);
    }
    return;
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !(window as any).Razorpay) {
    const errorMsg = 'Could not load Razorpay SDK. Please check your internet connection.';
    console.error(`[RazorpayService] ${errorMsg}`);
    if (options?.onError) {
      options.onError(new Error(errorMsg));
    } else {
      alert(errorMsg);
    }
    return;
  }

  const razorpayOptions = {
    key: keyId,
    amount: Math.round(amount * 100), // Convert INR to paise
    currency: 'INR',
    name: 'Bharat Pro Expert',
    description: options?.serviceName ? `Payment for ${options.serviceName}` : `Booking #${bookingId}`,
    image: 'https://img.icons8.com/color/120/clean.png',
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
    }) => {
      console.log(`[RazorpayService] Payment successful for booking ${bookingId}: ${response.razorpay_payment_id}`);

      try {
        // Update booking status in Firestore to 'PAID'
        const result = await updateBookingStatus(bookingId, 'PAID', {
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature
        });

        if (result.success) {
          console.log(`[RazorpayService] Booking ${bookingId} status successfully updated to 'PAID' in Firestore.`);
        } else {
          console.warn(`[RazorpayService] Firestore update warning: ${result.error}`);
        }

        if (options?.onSuccess) {
          options.onSuccess(response);
        }
      } catch (err) {
        console.error('[RazorpayService] Failed to update booking status in Firestore:', err);
        if (options?.onError) {
          options.onError(err);
        }
      }
    },
    prefill: {
      name: options?.customerName || '',
      email: options?.customerEmail || 'customer@bharatproexpert.com',
      contact: options?.customerPhone || ''
    },
    notes: {
      bookingId,
      app: 'Bharat Pro Expert'
    },
    theme: {
      color: '#062A49'
    },
    modal: {
      ondismiss: () => {
        console.log('[RazorpayService] Checkout popup closed by user.');
        if (options?.onDismiss) {
          options.onDismiss();
        }
      }
    }
  };

  try {
    const rzp = new (window as any).Razorpay(razorpayOptions);

    rzp.on('payment.failed', (resp: any) => {
      console.error('[RazorpayService] Payment failed event:', resp.error);
      const errMsg = resp.error?.description || 'Payment failed or was cancelled.';
      if (options?.onError) {
        options.onError(resp.error);
      } else {
        alert(`Payment Failed: ${errMsg}`);
      }
    });

    // Visible browser alert to confirm code path reached
    alert("Opening Razorpay checkout now");
    rzp.open();
  } catch (err: any) {
    console.error('[RazorpayService] Failed to initialize Razorpay checkout:', err);
    alert(`Razorpay checkout failed to open: ${err?.message || err}`);
    if (options?.onError) {
      options.onError(err);
    } else {
      alert('Could not start Razorpay checkout. Please check console for details.');
    }
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

/**
 * Generic modal opener with custom callbacks
 */
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
