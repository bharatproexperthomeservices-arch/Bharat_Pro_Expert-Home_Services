import { useState, useCallback } from 'react';
import { Booking, ServiceAddon } from '../types';
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
  selectedAddons?: ServiceAddon[];
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

  const isOnlinePaymentSelection = useCallback((method: PaymentMethodSelection): boolean => {
    return ['online', 'UPI', 'CARD', 'NET_BANKING'].includes(method);
  }, []);

  const isPayAfterServiceSelection = useCallback((method: PaymentMethodSelection): boolean => {
    return ['cash', 'PAY_AFTER_SERVICE'].includes(method);
  }, []);

  const processBooking = useCallback(async (
    payload: BookingPayload,
    paymentMethod: PaymentMethodSelection,
    options: UseRazorpayBookingOptions
  ): Promise<void> => {
    setIsProcessing(true);
    setError(null);

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
    if (isPayAfterServiceSelection(paymentMethod)) {
      const msg = 'COD (Cash on Delivery) is disabled. Please pay online via UPI, Cards, or Netbanking to confirm your booking.';
      setError(msg); setIsProcessing(false); options.onError?.(msg); return;
    }
    if (!isOnlinePaymentSelection(paymentMethod)) {
      const msg = 'Invalid payment method selected. Please choose "UPI / Cards / Netbanking" or "Pay after service".';
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
      // ==========================================================
      // 🚀 FIX: बैकएंड से Razorpay की Order ID मंगवाएं
      // ==========================================================
      console.log("[useRazorpayBooking] Calling backend to create order...");
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payload.totalAmount })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.id) {
        throw new Error(orderData.details || orderData.error || 'Backend did not return Razorpay order ID. Contact support.');
      }

      const razorpayOrderId = orderData.id;
      console.log("[useRazorpayBooking] Order ID received from backend:", razorpayOrderId);

      // ==========================================================
      // Razorpay Options (अब इसमें order_id भी जुड़ गया है)
      // ==========================================================
      const razorpayConfig = {
        key: keyId,
        amount: Math.round(payload.totalAmount * 100),
        currency: 'INR',
        name: 'Bharat Pro Expert',
        description: `Payment for ${payload.serviceName} (#${payload.bookingNumber})`,
        image: 'https://img.icons8.com/color/120/clean.png',
        order_id: razorpayOrderId, // ✅ यह सबसे जरूरी लाइन है!
        prefill: {
          name: payload.customerName || 'Customer',
          email: payload.customerEmail || 'customer@bharatproexpert.com',
          contact: payload.customerPhone || ''
        },
        notes: {
          bookingNumber: payload.bookingNumber,
          serviceName: payload.serviceName,
          platform: 'Bharat Pro Expert Web/APK'
        },
        theme: { color: '#062A49' },
        handler: async (paymentResponse: {
          razorpay_payment_id: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        }) => {
          console.log('[useRazorpayBooking] Razorpay handler success:', paymentResponse.razorpay_payment_id);

          try {
            // 🚀 FIX: Firestore में undefined जाने से रोकें
            const paidBookingRecord: Booking = {
              ...payload,
              id: payload.bookingId,
              bookingNumber: payload.bookingNumber,
              categoryName: payload.categoryName || 'Deep Cleaning',
              selectedAddons: payload.selectedAddons || [],
              appliedCoupon: payload.appliedCoupon || null,
              unlockedBumperOffer: payload.unlockedBumperOffer || null,
              priceSnapshot: payload.priceSnapshot || null,
              paymentMethod: 'UPI',
              paymentStatus: 'PAID',
              transactionId: paymentResponse.razorpay_payment_id,
              razorpayDetails: {
                paymentId: paymentResponse.razorpay_payment_id,
                orderId: paymentResponse.razorpay_order_id || '',
                signature: paymentResponse.razorpay_signature || '',
                verifiedAt: new Date().toISOString(),
                verificationStatus: 'SUCCESS_VERIFIED'
              },
              status: 'SEARCHING_PROFESSIONAL',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            const savedBooking = await createNewBooking(paidBookingRecord);

            try { confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } }); } catch {}

            setIsProcessing(false);
            await options.onSuccess(savedBooking);
          } catch (saveError: any) {
            console.error('[useRazorpayBooking] Firestore write failed:', saveError);
            const saveMsg = 'Payment successful, but booking could not be saved. Please contact support. Payment ID: ' + paymentResponse.razorpay_payment_id;
            setError(saveMsg); setIsProcessing(false); options.onError?.(saveMsg);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('[useRazorpayBooking] Checkout dismissed.');
            setIsProcessing(false);
            options.onDismiss?.();
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(razorpayConfig);

      razorpayInstance.on('payment.failed', (failedResp: any) => {
        console.error('[useRazorpayBooking] Payment failed:', failedResp.error);
        const failDesc = failedResp.error?.description || 'Payment was unsuccessful or cancelled.';
        setIsProcessing(false); setError(failDesc); options.onError?.(failDesc);
      });

      console.log("[useRazorpayBooking] Opening Razorpay checkout modal now");
      razorpayInstance.open();

    } catch (launchError: any) {
      console.error('[useRazorpayBooking] Failed to process booking:', launchError);
      setIsProcessing(false);
      const openErr = launchError?.message || 'Failed to open Razorpay checkout.';
      setError(openErr); options.onError?.(openErr);
    }
  }, [isOnlinePaymentSelection, isPayAfterServiceSelection]);

  return {
    isProcessing,
    error,
    processBooking,
    isOnlinePaymentSelection,
    isPayAfterServiceSelection
  };
};
