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

  const loadRazorpayScript = (): Promise<boolean> => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const selector = 'script[src="https://checkout.razorpay.com/v1/checkout.js"]';
    const existing = document.querySelector<HTMLScriptElement>(selector);
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePayment = async () => {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      alert("Payment configuration is missing. Please contact support.");
      return;
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      alert("Invalid payment amount.");
      return;
    }

    setLoading(true);
    try {
      if (!(await loadRazorpayScript())) throw new Error("Razorpay SDK failed to load. Check your internet connection.");

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const orderData = await res.json().catch(() => ({}));
      if (!res.ok || !orderData.id) throw new Error(orderData.error || "Backend did not return Razorpay order ID.");

      const paymentObject = new window.Razorpay({
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Bharat Pro Expert Home Services",
        description: "Service Booking Payment",
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok || verifyData.verified !== true) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }
            alert("Payment verified successfully.");
          } catch (error: any) {
            alert(error?.message || "Payment could not be verified. Please contact support.");
          }
        },
        prefill: { name: "", email: "", contact: "" },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: "#062A49" },
      });
      paymentObject.on("payment.failed", (event: any) => {
        alert(event?.error?.description || "Payment failed. Please try again.");
      });
      paymentObject.open();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      alert(err?.message || "Payment failed to initiate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <button onClick={handlePayment} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200">{loading ? "Processing..." : `Pay ₹${amount}`}</button>;
}
