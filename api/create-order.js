import Razorpay from "razorpay";
import crypto from "node:crypto";

function json(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed." });
  }

  // The key ID is public; accept either conventional server variable name.
  // The secret must remain server-only and must never use a VITE_ variable.
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    console.error("Razorpay order endpoint is missing server credentials.");
    return json(res, 503, {
      error: "Payment gateway is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel Environment Variables."
    });
  }

  const rawAmount = req.body?.amount;
  const amount = Number(rawAmount);
  const currency = req.body?.currency || "INR";
  if (rawAmount === undefined || rawAmount === null || !Number.isFinite(amount) || amount <= 0 || amount > 500000 || currency !== "INR") {
    return json(res, 400, { error: "Invalid payment amount or currency." });
  }

  try {
    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `bpe_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      notes: { service: "Bharat Pro Expert Home Services" }
    });
    if (!order?.id || !Number.isSafeInteger(order.amount) || order.currency !== "INR") {
      console.error("Razorpay returned an invalid order response.");
      return json(res, 502, { error: "Payment provider returned an invalid order. Please retry." });
    }
    return json(res, 201, { id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    // Keep secrets out of logs and responses; return a useful provider-safe message.
    console.error("Razorpay order creation failed:", error?.statusCode || error?.status || "provider_error", error?.error?.description || error?.message || "Unknown error");
    return json(res, 502, { error: error?.error?.description || "Razorpay could not create the order. Check server credentials and retry." });
  }
}
