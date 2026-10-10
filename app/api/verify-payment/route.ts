import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import Razorpay from "razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay verification environment variables are missing");
      return NextResponse.json(
        { success: false, verified: false, error: "Payment verification is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string"
    ) {
      return NextResponse.json(
        { success: false, verified: false, error: "Missing payment verification details" },
        { status: 400 }
      );
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const receivedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    const signatureValid =
      receivedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

    if (!signatureValid) {
      return NextResponse.json(
        { success: false, verified: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.order_id !== orderId) {
      return NextResponse.json(
        { success: false, verified: false, error: "Payment order mismatch" },
        { status: 400 }
      );
    }

    if (payment.status !== "captured" || payment.captured !== true) {
      return NextResponse.json(
        { success: false, verified: false, error: "Payment has not been captured yet" },
        { status: 400 }
      );
    }

    // This endpoint validates the transaction. Booking state persistence should
    // be handled by a trusted server-side booking/database implementation.
    return NextResponse.json({
      success: true,
      verified: true,
      orderId,
      paymentId,
      status: payment.status
    });
  } catch (error) {
    console.error("VERIFY_PAYMENT_ERROR:", error);
    return NextResponse.json(
      { success: false, verified: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
