import crypto from "node:crypto";
import Razorpay from "razorpay";
import { SERVICE_PRICES } from "./pricing-catalog.js";

function json(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { verified: false, error: "Method not allowed." });
  }

  // Key ID is public; support the existing Vercel variable and the preferred server-side name.
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return json(res, 503, { verified: false, error: "Payment gateway is not configured on the server." });
  }

  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (typeof bookingId !== "string" || !/^bpe_[a-zA-Z0-9_-]{8,100}$/.test(bookingId) ||
      ![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(
    value => typeof value === "string" && value.length > 0 && value.length <= 256
  )) {
    return json(res, 400, { verified: false, error: "Missing or invalid payment verification fields." });
  }

  try {
    const expected = crypto.createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();
    if (!/^[a-f0-9]{64}$/i.test(razorpay_signature)) {
      return json(res, 400, { verified: false, error: "Invalid signature format." });
    }
    const received = Buffer.from(razorpay_signature, "hex");
    if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
      return json(res, 400, { verified: false, error: "Payment signature verification failed." });
    }

    // A valid signature alone does not prove the payment was captured.
    const razorpay = new Razorpay({ key_id, key_secret });
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id)
    ]);

    const notes = order.notes || {};
    if (notes.bookingId !== bookingId) {
      return json(res, 409, { verified: false, error: "Payment order does not match this booking reference." });
    }
    const subtotal = Number(notes.subtotalInr);
    const gst = Number(notes.gstInr);
    const convenienceFee = Number(notes.convenienceFeeInr);
    const discount = Number(notes.discountInr);
    const breakdownIsValid =
      typeof notes.serviceId === "string" &&
      Object.prototype.hasOwnProperty.call(SERVICE_PRICES, notes.serviceId) &&
      [subtotal, gst, convenienceFee, discount].every(Number.isSafeInteger) &&
      subtotal > 0 && gst >= 0 && convenienceFee >= 0 && discount >= 0 &&
      subtotal + gst + convenienceFee - discount === order.amount / 100;

    if (payment.order_id !== order.id ||
        payment.order_id !== razorpay_order_id ||
        payment.currency !== "INR" ||
        order.currency !== "INR" ||
        payment.amount !== order.amount ||
        payment.status !== "captured" ||
        !breakdownIsValid) {
      return json(res, 409, {
        verified: false,
        error: "Payment is not captured or does not match the order. Please contact support before retrying."
      });
    }

    return json(res, 200, {
      verified: true,
      bookingId,
      razorpay_order_id: order.id,
      razorpay_payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status
    });
  } catch (error) {
    console.error("Razorpay payment verification failed:", error?.message || "Unknown error");
    return json(res, 502, { verified: false, error: "Unable to confirm captured payment with Razorpay. Please contact support before retrying." });
  }
}
