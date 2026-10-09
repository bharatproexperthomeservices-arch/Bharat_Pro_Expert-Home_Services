import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay server environment variables are missing");
      return NextResponse.json(
        { success: false, error: "Payment configuration is missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const amount = Number(body.amount);
    const currency = body.currency || "INR";

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    if (currency !== "INR") {
      return NextResponse.json(
        { success: false, error: "Unsupported currency" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `bpe_${Date.now()}`,
      notes: { service: "Bharat Pro Expert Home Cleaning" }
    });

    // Keep both fields for compatibility with existing frontend callers.
    return NextResponse.json({
      ...order,
      id: order.id,
      orderId: order.id,
      keyId,
      success: true
    });
  } catch (error) {
    console.error("CREATE_ORDER_ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create payment order" },
      { status: 500 }
    );
  }
}
