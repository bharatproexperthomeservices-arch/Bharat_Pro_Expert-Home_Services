"use client";
import RazorpayButton from "@/components/RazorpayButton";

export default function CheckoutPage() {
  const payableAmount = 2745; // Aapka final amount (e.g. ₹2745)

  const handleSuccess = (response) => {
    console.log("Payment Details:", response);
    alert(`Payment Successful! Razorpay Payment ID: ${response.razorpay_payment_id}`);
    // Yahan par booking confirm karne ka logic likhein
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-xl font-bold mb-4">Complete Your Booking</h2>
      <div className="border-t border-b py-3 my-3">
        <p className="flex justify-between font-semibold">
          <span>Payable Amount:</span>
          <span>₹{payableAmount}</span>
        </p>
      </div>
      
      {/* Razorpay Integration Button */}
      <RazorpayButton amount={payableAmount} onPaymentSuccess={handleSuccess} />
    </div>
  );
}
