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

    // 1. Basic Validation
    if (!payload.customerPhone || payload.customerPhone.trim().length < 10) {
      const msg = 'Please enter a valid 10-digit mobile number.';
      setError(msg); setIsProcessing(false); options.onError?.(msg); return;
    }
    if (!payload.address || !payload.address.street) {
      const msg = 'Please enter complete service address.';
      setError(msg); setIsProcessing(false); options.onError?.(msg); return;
    }
    if (payload.totalAmount <= 0) {
      const msg = 'Invalid total amount. Please review your cart.';
      setError(msg); setIsProcessing(false); options.onError?.(msg); return;
    }

    const keyId = getRazorpayKeyId();
    if (!keyId) {
      const msg = 'Razorpay Key ID is not configured. Please verify API credentials.';
      setError(msg); setIsProcessing(false); options.onError?.(msg); return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !(window as any).Razorpay) {
      const msg = 'Could not load Razorpay SDK. Please check your internet connection.';
      setError(msg); setIsProcessing(false); options.onError?.(msg); return;
    }

    try {
      // 🚀 STEP 1: Backend se Order ID mangwayein
      console.log("[useRazorpayBooking] Backend se order id mang rahe hain...");
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payload.totalAmount })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.id) {
        throw new Error(orderData.details || orderData.error || 'Backend did not return Razorpay order ID.');
      }

      const razorpayOrderId = orderData.id;
      console.log("[useRazorpayBooking] Order ID mil gayi:", razorpayOrderId);

      // 🚀 STEP 2: Razorpay Options taiyaar karein
      const razorpayConfig = {
        key: keyId,
        amount: Math.round(payload.totalAmount * 100),
        currency: 'INR',
        name: 'Bharat Pro Expert',
        description: `Payment for ${payload.serviceName}`,
        order_id: razorpayOrderId, // 🔥 Yeh sabse zaroori hai
        prefill: {
          name: payload.customerName || 'Customer',
          email: payload.customerEmail || 'customer@bharatproexpert.com',
          contact: payload.customerPhone || ''
        },
        theme: { color: '#062A49' },
        handler: async (paymentResponse: any) => {
          console.log('[useRazorpayBooking] Payment Success:', paymentResponse.razorpay_payment_id);
          try {
            // Verify the payment signature on the server before saving a paid booking.
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature
              })
            });
            const verification = await verifyResponse.json().catch(() => ({}));
            if (!verifyResponse.ok || verification.verified !== true) {
              const verifyMsg = verification.error || 'Payment verification failed. Booking was not marked as paid.';
              setError(verifyMsg);
              setIsProcessing(false);
              options.onError?.(verifyMsg);
              return;
            }

            // Save the booking only after the server confirms the payment signature.
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
              transactionId: paymentResponse.razorpay_payment_id,
              status: 'SEARCHING_PROFESSIONAL',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            const savedBooking = await createNewBooking(paidBookingRecord);
            try { confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } }); } catch {}
            setIsProcessing(false);
            await options.onSuccess(savedBooking);
          } catch (saveError: any) {
            console.error('[useRazorpayBooking] Firestore error:', saveError);
            const saveMsg = 'Payment success, but booking save nahi hui. Contact support. Payment ID: ' + paymentResponse.razorpay_payment_id;
            setError(saveMsg); setIsProcessing(false); options.onError?.(saveMsg);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            options.onDismiss?.();
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(razorpayConfig);
      
      razorpayInstance.on('payment.failed', (failedResp: any) => {
        const failDesc = failedResp.error?.description || 'Payment failed or cancelled.';
        setIsProcessing(false); setError(failDesc); options.onError?.(failDesc);
      });

      razorpayInstance.open();

    } catch (launchError: any) {
      console.error('[useRazorpayBooking] Error:', launchError);
      setIsProcessing(false);
      const openErr = launchError?.message || 'Failed to open Razorpay.';
      setError(openErr); options.onError?.(openErr);
    }
  }, []);

  return { isProcessing, error, processBooking };
};
