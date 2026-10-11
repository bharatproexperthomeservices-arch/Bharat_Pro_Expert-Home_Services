import { useState, useCallback } from 'react';
import { Booking } from '../types';
import { createNewBooking } from '../services/dbService';
import { loadCashfreeScript } from '../services/cashfreeService';
import confetti from 'canvas-confetti';

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

export interface UseCashfreeBookingOptions {
  onSuccess: (booking: Booking) => void | Promise<void>;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
}

export const useRazorpayBooking = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processBooking = useCallback(async (
    payload: BookingPayload,
    _paymentMethod: PaymentMethodSelection,
    options: UseCashfreeBookingOptions
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
    if (!payload.address?.street?.trim()) {
      fail('Please enter complete service address.');
      return;
    }
    if (!Number.isSafeInteger(payload.totalAmount) || payload.totalAmount <= 0) {
      fail('Invalid total amount. Please review your cart.');
      return;
    }

    try {
      const sdkLoaded = await loadCashfreeScript();
      if (!sdkLoaded || typeof window.Cashfree !== 'function') {
        throw new Error('Cashfree Checkout could not load. Please check your internet connection.');
      }

      const serviceName = payload.serviceName.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: payload.bookingId,
          serviceId: payload.serviceId,
          serviceName,
          addons: payload.selectedAddons || [],
          couponCode: payload.appliedCoupon || null,
          clientTotal: Number(payload.totalAmount),
          currency: 'INR',
          customerName: payload.customerName,
          customerPhone: payload.customerPhone.replace(/\D/g, '').slice(-10),
          customerEmail: payload.customerEmail || ''
        })
      });
      const orderData = await orderResponse.json().catch(() => ({}));
      if (!orderResponse.ok || typeof orderData.order_id !== 'string' ||
          typeof orderData.payment_session_id !== 'string' ||
          !Number.isSafeInteger(orderData.amount) ||
          orderData.amount !== payload.totalAmount * 100 ||
          orderData.currency !== 'INR') {
        throw new Error(orderData.error || 'Cashfree could not create an order for this service and price. Please refresh the cart or contact support.');
      }

      const cashfree = window.Cashfree!({
        mode: orderData.environment === 'production' ? 'production' : 'sandbox'
      });
      await cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: '_modal'
      });

      const verifyResponse = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: payload.bookingId,
          order_id: orderData.order_id,
          serviceId: payload.serviceId
        })
      });
      const verification = await verifyResponse.json().catch(() => ({}));
      if (!verifyResponse.ok || verification.verified !== true ||
          verification.bookingId !== payload.bookingId ||
          verification.order_id !== orderData.order_id ||
          verification.currency !== 'INR' ||
          verification.status !== 'PAID' ||
          verification.amount !== orderData.amount) {
        throw new Error(verification.error || 'Cashfree has not confirmed the payment yet. Booking is not confirmed.');
      }

      const now = new Date().toISOString();
      const paidBookingRecord: Booking = {
        ...payload,
        id: payload.bookingId,
        categoryName: payload.categoryName || 'Deep Cleaning',
        selectedAddons: payload.selectedAddons || [],
        appliedCoupon: payload.appliedCoupon || null,
        unlockedBumperOffer: payload.unlockedBumperOffer || null,
        priceSnapshot: payload.priceSnapshot || null,
        paymentMethod: 'Cashfree',
        paymentStatus: 'PAID',
        transactionId: String(verification.payment_id || orderData.order_id),
        totalAmount: Math.round(verification.amount / 100),
        status: 'SEARCHING_PROFESSIONAL',
        notes: `Cashfree order: ${orderData.order_id}; verified at ${now}`,
        createdAt: now,
        updatedAt: now
      };

      const savedBooking = await createNewBooking(paidBookingRecord);
      try { confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } }); } catch {}
      setIsProcessing(false);
      await options.onSuccess(savedBooking);
    } catch (err: any) {
      const message = err?.message || 'Cashfree payment could not be completed.';
      fail(message);
    }
  }, []);

  return { isProcessing, error, processBooking };
};
