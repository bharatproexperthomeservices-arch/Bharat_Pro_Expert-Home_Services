import Razorpay from "razorpay";
import crypto from "node:crypto";

function json(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });
  }

  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_live_Tlh9T3hoID4gmq";
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    console.error("Razorpay order endpoint is missing server credentials.");
    return json(res, 503, {
      error: "Payment gateway is not configured. In Vercel Environment Variables, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then redeploy.",
      code: "PAYMENT_GATEWAY_NOT_CONFIGURED"
    });
  }

  // The client currently sends a rupee amount. Reject malformed amounts early;
  // the server-authoritative catalogue/quote is still required before live payments.
  const rawAmount = req.body?.amount;
  const amount = Number(rawAmount);
  const currency = req.body?.currency || "INR";
  if (rawAmount === undefined || rawAmount === null || rawAmount === "" ||
      !Number.isFinite(amount) || amount <= 0 || amount > 500000 ||
      !Number.isSafeInteger(Math.round(amount * 100)) || currency !== "INR") {
    return json(res, 400, {
      error: "Invalid checkout amount. Refresh the booking and try again.",
      code: "INVALID_CHECKOUT_AMOUNT"
    });
  }

  try {
    const razorpay = new Razorpay({ key_id, key_secret });
    const amountPaise = Math.round(amount * 100);
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `bpe_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      notes: { service: "Bharat Pro Expert Home Services" }
    });

    if (!order?.id || !Number.isSafeInteger(order.amount) ||
        order.amount !== amountPaise || order.currency !== "INR") {
      console.error("Razorpay returned an order that did not match the requested amount/currency.");
      return json(res, 502, {
        error: "Razorpay returned an invalid order. Please retry.",
        code: "INVALID_GATEWAY_ORDER"
      });
    }
    return json(res, 201, { id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    const providerStatus = error?.statusCode || error?.status;
    const providerMessage = error?.error?.description || error?.description || error?.message || "";
    console.error("Razorpay order creation failed:", providerStatus || "provider_error", providerMessage);
    return json(res, 502, {
      error: providerStatus === 401 || /authentication|authorization|key_id|key_secret|credentials/i.test(providerMessage)
        ? "Razorpay rejected the server credentials. Check that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET belong to the same TEST or LIVE mode."
        : "Razorpay could not create the order. Check Vercel Function Logs for the provider error, then retry.",
      code: "RAZORPAY_ORDER_CREATION_FAILED"
    });
  }
}
