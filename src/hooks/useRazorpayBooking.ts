// src/hooks/useRazorpayBooking.ts
import { useState, useCallback } from 'react';
import { Booking } from '../types';
import { createNewBooking } from '../services/dbService';
import { getRazorpayKeyId, loadRazorpayScript } from '../services/razorpayService';
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

export interface UseRazorpayBookingOptions {
  onSuccess: (booking: Booking) => void | Promise<void>;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
}

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export const useRazorpayBooking = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processBooking = useCallback(async (
    payload: BookingPayload,
    paymentMethod: PaymentMethodSelection,
    options: UseRazorpayBookingOptions
  ): Promise<void> => {
    const fail = (message: string) => {
      setError(message);
      setIsProcessing(false);
      options.onError?.(message);
    };

    setIsProcessing(true);
    setError(null);

    if (!payload.customerPhone || payload.customerPhone.trim().replace(/\D/g, '').length < 10) {
      fail('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!payload.address?.street?.trim()) {
      fail('Please enter complete service address.');
      return;
    }
    if (!Number.isFinite(payload.totalAmount) || payload.totalAmount <= 0) {
      fail('Invalid total amount. Please review your cart.');
      return;
    }

    const keyId = getRazorpayKeyId();
    if (!keyId) {
      fail('Payment is not configured yet. Please contact support.');
      return;
    }

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !(window as any).Razorpay) {
        fail('Could not load Razorpay Checkout. Check your internet connection and try again.');
        return;
      }

      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(payload.totalAmount * 100) / 100,
          currency: 'INR',
          receipt: payload.bookingNumber
        })
      });
      const orderData = await orderResponse.json().catch(() => ({}));

      if (!orderResponse.ok || orderData.success !== true || !orderData.id) {
        throw new Error(orderData.error || 'Could not create the payment order.');
      }

      const razorpayInstance = new (window as any).Razorpay({
        key: orderData.keyId || keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Bharat Pro Expert',
        description: `Payment for ${payload.serviceName}`,
        order_id: orderData.id,
        prefill: {
          name: payload.customerName || '',
          email: payload.customerEmail || '',
          contact: payload.customerPhone || ''
        },
        notes: { bookingNumber: payload.bookingNumber },
        theme: { color: '#062A49' },
        handler: async (paymentResponse: RazorpaySuccessResponse) => {
          try {
            if (paymentResponse.razorpay_order_id !== orderData.id) {
              throw new Error('The payment order did not match this booking.');
            }

            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(paymentResponse)
            });
            const verification = await verifyResponse.json().catch(() => ({}));

            if (!verifyResponse.ok || verification.success !== true || verification.verified !== true) {
              throw new Error(verification.error || 'Payment could not be verified. Do not retry immediately; contact support if money was deducted.');
            }

            // Save as paid only after the server has verified the Razorpay signature
            // and confirmed the payment belongs to the returned order.
            const paidBookingRecord: Booking = {
              ...payload,
              id: payload.bookingId,
              categoryName: payload.categoryName || 'Home Cleaning',
              selectedAddons: payload.selectedAddons || [],
              appliedCoupon: payload.appliedCoupon || null,
              unlockedBumperOffer: payload.unlockedBumperOffer || null,
              priceSnapshot: payload.priceSnapshot || null,
              paymentMethod: 'UPI',
              paymentStatus: 'PAID',
              transactionId: paymentResponse.razorpay_payment_id,
              status: 'SEARCHING_PROFESSIONAL',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            const savedBooking = await createNewBooking(paidBookingRecord);
            try { confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } }); } catch {}
            setIsProcessing(false);
            await options.onSuccess(savedBooking);
          } catch (verificationOrSaveError: any) {
            console.error('[useRazorpayBooking] Payment verification/booking error:', verificationOrSaveError);
            fail(verificationOrSaveError?.message || 'Payment verification failed. Please contact support before trying again.');
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            options.onDismiss?.();
          }
        }
      });

      razorpayInstance.on('payment.failed', (failedResp: any) => {
        fail(failedResp?.error?.description || 'Payment failed or cancelled.');
      });
      razorpayInstance.open();
    } catch (launchError: any) {
      console.error('[useRazorpayBooking] Checkout error:', launchError);
      fail(launchError?.message || 'Failed to start Razorpay Checkout.');
    }
  }, []);

  return { isProcessing, error, processBooking };
};
