import RazorpayButton from "@/components/RazorpayButton";

export default function CheckoutPage() {
  const bookingDetails = {
    amount: 500,
    customerInfo: {
      name: "User Name",
      email: "user@example.com",
      phone: "9876543210",
    },
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Bharat Pro Expert Home Services
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Complete your booking payment securely.
        </p>
        <RazorpayButton
          amount={bookingDetails.amount}
          customerInfo={bookingDetails.customerInfo}
        />
      </div>
    </main>
  );
}
