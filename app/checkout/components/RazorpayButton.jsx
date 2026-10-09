"use client";
import { useState } from "react";

export default function RazorpayButton({
  amount = 500,
  customerInfo = {
    name: "Customer Name",
    email: "customer@example.com",
    phone: "9876543210",
  },
  onSuccess,
  onFailure,
}) {
  const [loading, setLoading] = useState(false);

  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      const isSdkLoaded = await loadRazorpaySDK();
      if (!isSdkLoaded) {
        alert("Razorpay SDK load nahi ho paya. Internet connection check karein.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          notes: {
            customer_name: customerInfo.name || "N/A",
            customer_phone: customerInfo.phone || "N/A",
          },
        }),
      });

      const orderData = await response.json();

      if (!response.ok || !orderData.id) {
        alert(`Order create nahi hua: ${orderData.error || "Server Error"}`);
        setLoading(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Bharat Pro Expert",
        description: "Home Services Booking Payment",
        order_id: orderData.id,
        handler: function (paymentResponse) {
          alert(`Payment Successful! ID: ${paymentResponse.razorpay_payment_id}`);
          if (onSuccess) onSuccess(paymentResponse);
        },
        prefill: {
          name: customerInfo.name || "",
          email: customerInfo.email || "",
          contact: customerInfo.phone || "",
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: function () {
            setLoading(false);
            if (onFailure) onFailure("Payment cancelled by user");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error("Payment Process Error:", error);
      alert("Payment initiate karne me dikkat aayi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all disabled:opacity-50"
    >
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </button>
  );
}
