import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount } = body;

    // Razorpay Keys (Env variable se lenge, agar nhi mila toh direct fallback use hoga)
    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.VITE_RAZORPAY_KEY_ID ||
      "rzp_live_Tlh9T3hoID4gmq";

    const razorpaySecret =
      process.env.RAZORPAY_KEY_SECRET || "YOUR_ACTUAL_RAZORPAY_SECRET_KEY"; 
      // NOTE: Upar "YOUR_ACTUAL_RAZORPAY_SECRET_KEY" ki jagah apni Razorpay ki Secret Key paste kar dein.

    const instance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpaySecret,
    });

    const options = {
      amount: Math.round((amount || 1285) * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    return NextResponse.json(order, { status: 200 });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
