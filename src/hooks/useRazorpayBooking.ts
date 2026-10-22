// Cashfree-hosted checkout; secrets remain server-side in Vercel.
import { useState, useCallback } from 'react';
import { Booking } from '../types';
import { createNewBooking } from '../services/dbService';
import confetti from 'canvas-confetti';

declare global {
  interface Window {
    Cashfree?: (options: { mode: 'sandbox' | 'production' }) => any;
  }
}

export type PaymentMethodSelection = 'online' | 'cash' | 'UPI' | 'CARD' | 'NET_BANKING' | 'PAY_AFTER_SERVICE';

export interface BookingPayload {
  bookingId: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceId: string;
  serviceName: string;
  categoryName?: string;
  date: string;
  timeSlot: string;
  assignedHubId: string;
  address: {
    street: string;
    sector: string;
    city: string;
    state: string;
    pincode: string;
    lat: number;
    lng: number;
    landmark?: string;
  };
  selectedAddons?: any[];
  basePrice: number;
  addonsPrice: number;
  taxesGst: number;
  convenienceFee: number;
  discount: number;
  totalAmount: number;
  appliedCoupon?: string;
  unlockedBumperOffer?: string;
  priceSnapshot?: any;
  startOtp: string;
  completionOtp: string;
}

export interface UseRazorpayBookingOptions {
  onSuccess: (booking: Booking) => void | Promise<void>;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
}

const loadCashfreeScript = (): Promise<boolean> => new Promise((resolve) => {
  if (typeof window === 'undefined') return resolve(false);
  if (window.Cashfree) return resolve(true);
  const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
  const script = existing ?? document.createElement('script');
  script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
  script.onload = () => resolve(Boolean(window.Cashfree));
  script.onerror = () => resolve(false);
  if (!existing) document.head.appendChild(script);
});

export const useRazorpayBooking = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processBooking = useCallback(async (
    payload: BookingPayload,
    paymentMethod: PaymentMethodSelection,
    options: UseRazorpayBookingOptions
  ): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    const fail = (message: string) => {
      setError(message);
      setIsProcessing(false);
      options.onError?.(message);
    };

    if (!payload.customerPhone || payload.customerPhone.replace(/\D/g, '').length < 10) {
      fail('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!payload.address || !payload.address.street) {
      fail('Please enter complete service address.');
      return;
    }
    if (!Number.isFinite(payload.totalAmount) || payload.totalAmount <= 0) {
      fail('Invalid total amount. Please review your cart.');
      return;
    }

    try {
      const scriptLoaded = await loadCashfreeScript();
      if (!scriptLoaded || !window.Cashfree) {
        fail('Could not load Cashfree Checkout. Please check your internet connection and retry.');
        return;
      }

      const addons = (payload.selectedAddons || []).map((addon: any) => ({
        id: String(addon.id || addon.addonId || ''),
        name: String(addon.name || '')
      })).filter((addon) => addon.id || addon.name);

      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: payload.bookingId,
          serviceId: payload.serviceId,
          serviceName: payload.serviceName,
          addons,
          couponCode: payload.appliedCoupon || '',
          clientTotal: Math.round(payload.totalAmount),
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerEmail: payload.customerEmail,
          currency: 'INR',
          paymentMethod: 'ONLINE'
        })
      });
      const orderData = await orderResponse.json().catch(() => ({}));
      if (!orderResponse.ok || !orderData.payment_session_id || !orderData.order_id) {
        throw new Error(orderData.error || 'Cashfree did not return a valid payment session.');
      }

      const cashfree = window.Cashfree({ mode: orderData.environment === 'production' ? 'production' : 'sandbox' });
      const checkoutResult = await cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: '_modal'
      });

      if (checkoutResult?.error && !checkoutResult?.paymentDetails) {
        throw new Error(checkoutResult.error.message || 'Payment was cancelled or could not be completed.');
      }

      // Never trust the browser callback alone: query Cashfree from our server.
      const verifyResponse = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderData.order_id,
          bookingId: payload.bookingId,
          expectedAmount: orderData.amount
        })
      });
      const verification = await verifyResponse.json().catch(() => ({}));
      if (!verifyResponse.ok || verification.verified !== true ||
          verification.currency !== 'INR' ||
          !Number.isFinite(verification.amount) ||
          Number(verification.amount) !== Number(orderData.amount)) {
        throw new Error(verification.error || 'Cashfree has not confirmed the payment yet. Please check the payment status before retrying.');
      }

      const paidBookingRecord: Booking = {
        ...payload,
        id: payload.bookingId,
        categoryName: payload.categoryName || 'Deep Cleaning',
        selectedAddons: payload.selectedAddons || [],
        appliedCoupon: payload.appliedCoupon || null,
        unlockedBumperOffer: payload.unlockedBumperOffer || null,
        priceSnapshot: payload.priceSnapshot || null,
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        transactionId: String(verification.payment_id || verification.order_id),
        totalAmount: Number(verification.amount),
        status: 'SEARCHING_PROFESSIONAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const savedBooking = await createNewBooking(paidBookingRecord);
      try { confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } }); } catch {}
      setIsProcessing(false);
      await options.onSuccess(savedBooking);
    } catch (launchError: any) {
      console.error('[CashfreeBooking] Payment flow failed:', launchError);
      const message = launchError?.message || 'Unable to start Cashfree payment. Please retry.';
      setError(message);
      setIsProcessing(false);
      options.onError?.(message);
    }
  }, []);

  return { isProcessing, error, processBooking };
};
