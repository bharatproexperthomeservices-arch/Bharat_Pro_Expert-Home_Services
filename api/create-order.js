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

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return json(res, 503, { error: "Payment gateway is not configured on the server." });
  }

  const amount = Number(req.body?.amount);
  const currency = req.body?.currency || "INR";
  if (!Number.isFinite(amount) || amount <= 0 || amount > 500000 || currency !== "INR") {
    return json(res, 400, { error: "Invalid payment amount or currency." });
  }

  try {
    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: `bpe_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      notes: { service: "Bharat Pro Expert Home Services" }
    });
    return json(res, 201, { id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error("Razorpay order creation failed:", error?.message || "Unknown error");
    return json(res, 502, { error: "Unable to create payment order. Please try again." });
  }
}
