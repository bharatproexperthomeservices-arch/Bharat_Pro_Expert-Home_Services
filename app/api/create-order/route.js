import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay API Keys strictly required in Environment Variables.");
      return NextResponse.json(
        { error: "Server Configuration Error: Missing Razorpay API Credentials" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const body = await request.json();
    const { amount, currency = "INR", notes = {} } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount specified" },
        { status: 400 }
      );
    }

    // Convert Rupees to Paise (e.g. ₹500 = 50000 paise)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `receipt_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        service: "Bharat Pro Expert Home Services",
        ...notes,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(
      {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate Razorpay order" },
      { status: 500 }
    );
  }
}
