"use client";
import { useState } from "react";

export default function RazorpayButton({ amount, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
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
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Invalid payment amount. Please review your booking.");
      return;
    }

    setLoading(true);
    try {
      if (!(await loadRazorpayScript())) throw new Error("Razorpay SDK failed to load. Check your internet connection.");

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
      });
      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderData.id) {
        throw new Error(orderData.error || "Backend did not return Razorpay order ID.");
      }

      const paymentObject = new window.Razorpay({
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Bharat Pro Expert Home Services",
        description: "Service Booking Payment",
        order_id: orderData.id,
        handler: async (response) => {
          try {
            const verification = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const result = await verification.json().catch(() => ({}));
            if (!verification.ok || result.verified !== true) {
              throw new Error(result.error || "Payment verification failed.");
            }
            if (onPaymentSuccess) await onPaymentSuccess(response);
            else alert("Payment verified successfully.");
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment could not be verified. Do not retry immediately; contact support with your payment ID.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: "#062A49" },
      });
      paymentObject.on("payment.failed", (event) => {
        alert(event?.error?.description || "Payment failed. Please try again.");
      });
      paymentObject.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert(error instanceof Error ? error.message : "Payment failed to initiate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <button onClick={handlePayment} disabled={loading} className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50">{loading ? "Processing..." : `Pay ₹${amount}`}</button>;
}
