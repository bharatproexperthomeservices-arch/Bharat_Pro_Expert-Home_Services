import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { success: false, verified: false, error: "Payment verification is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";

    if (!orderId || !paymentId || !signature || !/^[a-f0-9]{64}$/i.test(signature)) {
      return NextResponse.json(
        { success: false, verified: false, error: "Missing or invalid payment verification fields" },
        { status: 400 }
      );
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest();
    const received = Buffer.from(signature, "hex");

    if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
      return NextResponse.json(
        { success: false, verified: false, error: "Payment signature verification failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, verified: true, orderId, paymentId });
  } catch (error) {
    console.error("VERIFY_PAYMENT_ERROR:", error);
    return NextResponse.json(
      { success: false, verified: false, error: "Unable to verify payment" },
      { status: 500 }
    );
  }
}
