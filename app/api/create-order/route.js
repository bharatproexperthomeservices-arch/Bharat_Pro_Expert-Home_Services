import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request) {
  try {
    const body = await request.json();
    const amount = body && body.amount ? body.amount : 1285;

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.VITE_RAZORPAY_KEY_ID ||
      "rzp_live_Tlh9T3hoID4gmq";

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      console.error("RAZORPAY_KEY_SECRET is missing in environment variables.");
      return NextResponse.json(
        { error: "Server Configuration Error: RAZORPAY_KEY_SECRET missing" },
        { status: 500 }
      );
    }

    const instance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpaySecret,
    });

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await instance.orders.create(options);

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Razorpay Order Generation Error:", error);
    return NextResponse.json(
      { error: error && error.message ? error.message : "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
