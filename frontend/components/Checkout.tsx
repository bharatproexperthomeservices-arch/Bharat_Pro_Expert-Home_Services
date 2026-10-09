import React, { useState } from 'react';

interface CheckoutProps {
  amount?: number;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, any>) => { open: () => void; on: (event: string, callback: (event: any) => void) => void };
}
}

export default function Checkout({ amount = 2745 }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

  const loadRazorpayScript = (): Promise<boolean> => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  const handlePayment = async () => {
    if (!keyId) {
      alert('Online payment is not configured. Please contact support.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Please check the booking amount and try again.');
      return;
    }

    setLoading(true);
    try {
      if (!(await loadRazorpayScript()) || !window.Razorpay) {
        throw new Error('Razorpay Checkout could not load. Check your internet connection.');
      }

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR' }),
      });
      const order = await response.json().catch(() => ({}));
      if (!response.ok || order.success !== true || !order.id) {
        throw new Error(order.error || 'Could not create a payment order.');
      }

      const checkout = new window.Razorpay({
        key: order.keyId || keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Bharat Pro Expert',
        description: 'Home cleaning service booking',
        order_id: order.id,
        theme: { color: '#0B3BA8' },
        handler: async (payment: any) => {
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payment),
            });
            const result = await verifyResponse.json().catch(() => ({}));
            if (!verifyResponse.ok || result.success !== true || result.verified !== true) {
              throw new Error(result.error || 'Payment verification failed.');
            }
            alert('Payment verified successfully. Payment ID: ' + result.paymentId);
          } catch (error: any) {
            alert(error?.message || 'Payment could not be verified. Contact support before retrying.');
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });

      checkout.on('payment.failed', (event: any) => {
        alert(event?.error?.description || 'Payment failed. Please try again.');
      });
      checkout.open();
    } catch (error: any) {
      alert(error?.message || 'Unable to start payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200"
    >
      {loading ? 'Processing...' : `Pay ₹${amount}`}
    </button>
  );
}
