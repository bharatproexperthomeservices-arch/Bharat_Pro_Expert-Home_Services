"use client";

import React, { useState } from "react";

interface CheckoutProps {
  amount?: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout({ amount = 2745 }: CheckoutProps) {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert("Razorpay SDK failed to load. Check internet connection.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.id) {
        alert(`Payment Error: ${orderData.error || "Backend did not return Razorpay order ID"}`);
        setLoading(false);
        return;
      }

      const options = {
        key:
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          process.env.VITE_RAZORPAY_KEY_ID ||
          "rzp_live_Tlh9T3hoID4gmq",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Bharat Pro Expert Home Services",
        description: "Service Booking Payment",
        order_id: orderData.id,
        handler: function (response: any) {
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#0d6efd",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      alert(`Client Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200"
    >
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </button>
  );
}
