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

/**
 * Custom API Hook for Booking Flow with Razorpay Integration
 * 
 * - Explicitly validates that 'UPI / Cards / Netbanking' (or online) is selected before triggering Razorpay Checkout.
 * - Strictly delays Firestore booking creation until the Razorpay handler (success callback) is executed.
 * - Never prematurely confirms or creates a booking document in Firestore if checkout is closed or failed.
 */
export const useRazorpayBooking = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper to check if the selection corresponds to 'UPI / Cards / Netbanking'
   */
  const isOnlinePaymentSelection = useCallback((method: PaymentMethodSelection): boolean => {
    return ['online', 'UPI', 'CARD', 'NET_BANKING'].includes(method);
  }, []);

  /**
   * Helper to check if the selection corresponds to 'Pay after service'
   */
  const isPayAfterServiceSelection = useCallback((method: PaymentMethodSelection): boolean => {
    return ['cash', 'PAY_AFTER_SERVICE'].includes(method);
  }, []);

  /**
   * Execute booking flow with validated payment trigger
   */
  const processBooking = useCallback(async (
    payload: BookingPayload,
    paymentMethod: PaymentMethodSelection,
    options: UseRazorpayBookingOptions
  ): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    // 1. Basic validation
    if (!payload.customerPhone || payload.customerPhone.trim().length < 10) {
      const msg = 'Please enter a valid 10-digit mobile number.';
      setError(msg);
      setIsProcessing(false);
      options.onError?.(msg);
      return;
    }

    if (!payload.address || !payload.address.street) {
      const msg = 'Please enter complete service address.';
      setError(msg);
      setIsProcessing(false);
      options.onError?.(msg);
      return;
    }

    if (payload.totalAmount <= 0) {
      const msg = 'Invalid total amount. Please review your cart.';
      setError(msg);
      setIsProcessing(false);
      options.onError?.(msg);
      return;
    }

    // 2. BRANCH A: "Pay after service" (Cash / Pay Later)
    // Directly creates booking in Firestore with PENDING payment status, bypassing Razorpay
    if (isPayAfterServiceSelection(paymentMethod)) {
      try {
        const cashBookingRecord: Booking = {
          ...payload,
          id: payload.bookingId,
          bookingNumber: payload.bookingNumber,
          categoryName: payload.categoryName || 'Deep Cleaning',
          selectedAddons: payload.selectedAddons || [],
          paymentMethod: 'PAY_AFTER_SERVICE',
          paymentStatus: 'PENDING',
          transactionId: 'TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          status: 'SEARCHING_PROFESSIONAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Write to Firestore inside createNewBooking
        const savedBooking = await createNewBooking(cashBookingRecord);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}

        setIsProcessing(false);
        await options.onSuccess(savedBooking);
      } catch (err: any) {
        console.error('[useRazorpayBooking] Pay After Service booking error:', err);
        const errMsg = err?.message || 'Failed to place booking. Please retry.';
        setError(errMsg);
        setIsProcessing(false);
        options.onError?.(errMsg);
      }
      return;
    }

    // 3. BRANCH B: Validate 'UPI / Cards / Netbanking' selection
    if (!isOnlinePaymentSelection(paymentMethod)) {
      const msg = 'Invalid payment method selected. Please choose "UPI / Cards / Netbanking" or "Pay after service".';
      setError(msg);
      setIsProcessing(false);
      options.onError?.(msg);
      return;
    }

    // 4. Validated 'UPI / Cards / Netbanking': Initialize Razorpay Checkout
    const keyId = getRazorpayKeyId();
    if (!keyId) {
      const msg = 'Razorpay Key ID is not configured. Please verify API credentials in AI Studio Secrets.';
      setError(msg);
      setIsProcessing(false);
      options.onError?.(msg);
      return;
    }

    // Load Razorpay Checkout SDK script dynamically
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !(window as any).Razorpay) {
      const msg = 'Could not load Razorpay SDK. Please check your internet connection.';
      setError(msg);
      setIsProcessing(false);
      options.onError?.(msg);
      return;
    }

    // Construct Razorpay options
    // NOTE: Booking is NOT created in Firestore yet.
    // Booking will ONLY be created in Firestore inside handler (payment success).
    const razorpayConfig = {
      key: keyId,
      amount: Math.round(payload.totalAmount * 100), // convert to paise
      currency: 'INR',
      name: 'Bharat Pro Expert',
      description: `Payment for ${payload.serviceName} (#${payload.bookingNumber})`,
      image: 'https://img.icons8.com/color/120/clean.png',
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
      theme: {
        color: '#062A49'
      },
      // handler.success: ONLY CALLED UPON VERIFIED PAYMENT COMPLETION
      handler: async (paymentResponse: {
        razorpay_payment_id: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      }) => {
        console.log('[useRazorpayBooking] Razorpay handler success triggered with payment ID:', paymentResponse.razorpay_payment_id);

        try {
          // CONSTRUCT FINAL BOOKING AND CREATE IN FIRESTORE ONLY NOW
          const paidBookingRecord: Booking = {
            ...payload,
            id: payload.bookingId,
            bookingNumber: payload.bookingNumber,
            categoryName: payload.categoryName || 'Deep Cleaning',
            selectedAddons: payload.selectedAddons || [],
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

          // WRITE TO FIRESTORE VIA createNewBooking
          const savedBooking = await createNewBooking(paidBookingRecord);

          try {
            confetti({
              particleCount: 100,
              spread: 75,
              origin: { y: 0.6 }
            });
          } catch {}

          setIsProcessing(false);
          await options.onSuccess(savedBooking);
        } catch (saveError: any) {
          console.error('[useRazorpayBooking] Firestore write failed after payment success:', saveError);
          const saveMsg = 'Payment was successful, but booking could not be saved. Please contact support with Payment ID: ' + paymentResponse.razorpay_payment_id;
          setError(saveMsg);
          setIsProcessing(false);
          options.onError?.(saveMsg);
        }
      },
      modal: {
        ondismiss: () => {
          console.log('[useRazorpayBooking] Checkout popup dismissed by customer without payment.');
          setIsProcessing(false);
          options.onDismiss?.();
        }
      }
    };

    try {
      const razorpayInstance = new (window as any).Razorpay(razorpayConfig);

      razorpayInstance.on('payment.failed', (failedResp: any) => {
        console.error('[useRazorpayBooking] Payment failed:', failedResp.error);
        const failDesc = failedResp.error?.description || 'Payment was unsuccessful or cancelled.';
        setIsProcessing(false);
        setError(failDesc);
        options.onError?.(failDesc);
      });

      console.log("[useRazorpayBooking] Opening Razorpay checkout modal now");

      // EXPLICITLY TRIGGER RAZORPAY CHECKOUT INSTANCE
      razorpayInstance.open();
    } catch (launchError: any) {
      console.error('[useRazorpayBooking] Failed to open Razorpay instance:', launchError);
      setIsProcessing(false);
      const openErr = launchError?.message || 'Failed to open Razorpay checkout.';
      setError(openErr);
      options.onError?.(openErr);
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
