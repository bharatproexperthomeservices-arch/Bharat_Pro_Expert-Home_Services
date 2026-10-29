import crypto from "node:crypto";
import { BUSINESS_GST_DETAILS } from "./pricing-catalog.js";
import { sendGstInvoiceEmail } from "./send-invoice.js";

function json(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { verified: false, error: "Method not allowed." });
  }

  const razorpayKeySecret = typeof process.env.RAZORPAY_KEY_SECRET === "string" ? process.env.RAZORPAY_KEY_SECRET.trim() : "";
  const cashfreeAppId = typeof process.env.CASHFREE_APP_ID === "string" ? process.env.CASHFREE_APP_ID.trim() : "";
  const cashfreeSecretKey = typeof process.env.CASHFREE_SECRET_KEY === "string" ? process.env.CASHFREE_SECRET_KEY.trim() : "";

  if (!razorpayKeySecret && (!cashfreeAppId || !cashfreeSecretKey)) {
    return json(res, 503, {
      verified: false,
      error: "Payment gateway is not configured on this deployment.",
      code: "PAYMENT_GATEWAY_NOT_CONFIGURED"
    });
  }

  const { gateway, razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, order_id: orderId } = req.body || {};

  // Razorpay Signature Verification
  if (gateway === "razorpay" || razorpay_signature) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json(res, 400, { verified: false, error: "Missing Razorpay payment parameters." });
    }
    if (!razorpayKeySecret) {
      return json(res, 503, { verified: false, error: "Razorpay secret key not configured.", code: "PAYMENT_GATEWAY_NOT_CONFIGURED" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("Razorpay signature mismatch for payment:", razorpay_payment_id);
      return json(res, 400, { verified: false, error: "Invalid payment signature verification failed." });
    }

    // Trigger asynchronous email dispatch of GST Invoice if customer email was provided
    if (req.body?.customerEmail || req.body?.customer) {
      sendGstInvoiceEmail({
        bookingId: bookingId || razorpay_order_id,
        paymentId: razorpay_payment_id,
        customerName: req.body?.customerName || req.body?.customer?.name || "Customer",
        customerPhone: req.body?.customerPhone || req.body?.customer?.phone || "",
        customerEmail: req.body?.customerEmail || req.body?.customer?.email || "",
        items: req.body?.items || [],
        subtotal: req.body?.subtotal || 0,
        gst: req.body?.gst || 0,
        total: req.body?.total || 0
      }).catch(err => console.error("Invoice email background error:", err));
    }

    return json(res, 200, {
      verified: true,
      gateway: "razorpay",
      bookingId,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      status: "PAID",
      businessGst: BUSINESS_GST_DETAILS
    });
  }

  // Cashfree Verification
  if (typeof bookingId !== "string" || !/^bpe_[a-zA-Z0-9_-]{8,100}$/.test(bookingId) ||
      typeof orderId !== "string" || orderId !== bookingId.slice(0, 45)) {
    return json(res, 400, { verified: false, error: "Missing or invalid payment order reference." });
  }

  const clientId = cashfreeAppId;
  const clientSecret = cashfreeSecretKey;
  if (!clientId || !clientSecret) {
    return json(res, 503, { verified: false, error: "Cashfree not configured.", code: "PAYMENT_GATEWAY_NOT_CONFIGURED" });
  }

  const isProduction = process.env.CASHFREE_ENV === "production";
  const apiBase = isProduction ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
  const headers = {
    "x-client-id": clientId,
    "x-client-secret": clientSecret,
    "x-api-version": "2025-01-01",
    "Accept": "application/json"
  };

  try {
    const [orderResponse, paymentsResponse] = await Promise.all([
      fetch(`${apiBase}/orders/${encodeURIComponent(orderId)}`, { headers }),
      fetch(`${apiBase}/orders/${encodeURIComponent(orderId)}/payments`, { headers })
    ]);
    const order = await orderResponse.json().catch(() => ({}));
    const payments = await paymentsResponse.json().catch(() => []);
    if (!orderResponse.ok || !paymentsResponse.ok) {
      console.error("Cashfree payment status lookup failed:", orderResponse.status, paymentsResponse.status);
      return json(res, 502, { verified: false, error: "Could not confirm payment status with Cashfree. Please retry or contact support." });
    }

    const amountInPaise = Math.round(Number(order.order_amount) * 100);
    const successfulPayment = Array.isArray(payments)
      ? payments.find((payment) =>
          payment?.payment_status === "SUCCESS" &&
          payment?.order_id === orderId &&
          Math.round(Number(payment?.payment_amount) * 100) === amountInPaise
        )
      : null;
    if (order.order_id !== orderId || order.order_currency !== "INR" ||
        order.order_status !== "PAID" || !successfulPayment ||
        !Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
      return json(res, 409, { verified: false, error: "Cashfree has not confirmed a successful payment for this booking yet." });
    }

    return json(res, 200, {
      verified: true,
      gateway: "cashfree",
      bookingId,
      order_id: orderId,
      payment_id: String(successfulPayment.cf_payment_id || successfulPayment.payment_id || orderId),
      amount: amountInPaise,
      currency: "INR",
      status: "PAID",
      businessGst: BUSINESS_GST_DETAILS
    });
  } catch (error) {
    console.error("Cashfree payment verification failed:", error?.message || "Unknown error");
    return json(res, 502, { verified: false, error: "Unable to confirm payment with Cashfree. Please contact support before retrying." });
  }
}
