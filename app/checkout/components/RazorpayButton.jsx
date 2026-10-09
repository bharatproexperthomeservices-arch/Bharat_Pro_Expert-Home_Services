"use client";
import { useState } from "react";

export default function RazorpayButton({ amount, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
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
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Check internet connection.");
        setLoading(false);
        return;
      }

      // Backend API call to create order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.id) {
        alert(`Error: ${orderData.error || "Backend did not return Razorpay order ID."}`);
        setLoading(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_Tlh9T3hoID4gmq",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Bharat Pro Expert Home Services",
        description: "Service Booking Payment",
        order_id: orderData.id,
        handler: function (response) {
          if (onPaymentSuccess) {
            onPaymentSuccess(response);
          } else {
            alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
          }
        },
        theme: {
          color: "#000000",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed to initiate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
    >
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </button>
  );
}
